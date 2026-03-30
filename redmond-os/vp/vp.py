#!/usr/bin/env python3
"""
REDMOND OS: VP QUALITY GATE
============================
The VP agent. Monitors completed tasks, runs quality checks,
routes failures back to workers, escalates RED zone to CEO/Alan.

Usage:
    python vp.py                    # Run quality gate loop
    python vp.py --mission FRANKS-001   # Gate a specific mission
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime, timezone

import httpx
import anthropic

# ─── CONFIG ───────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fifybuzwfaegloijrmqb.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
VP_MODEL = "claude-sonnet-4-6"
VP_AGENT_ID = "VP-001"
POLL_INTERVAL = 8
SCORE_THRESHOLD = 85  # Minimum score to pass (out of 100 per dimension, 200 total)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def sb_get(table, params=None):
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, params=params or {})
    r.raise_for_status()
    return r.json()

def sb_post(table, data):
    r = httpx.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=data)
    r.raise_for_status()
    return r.json()

def sb_patch(table, match, data):
    params = {f"{k}": f"eq.{v}" for k, v in match.items()}
    r = httpx.patch(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, params=params, json=data)
    r.raise_for_status()
    return r.json()


# ─── QUALITY SCORING ─────────────────────────────────────────────────

LEGAL_SCORING_PROMPT = """You are a legal quality reviewer for federal court filings (EDPA).
Score this work product on two dimensions, 0-100 each:

DIMENSION 1: LEGAL SUBSTANCE (0-100)
- Correct statement of law (0-25)
- Proper citation format and accuracy (0-25)  
- Persuasive argumentation (0-25)
- Completeness of analysis (0-25)

DIMENSION 2: TACTICAL EFFECTIVENESS (0-100)
- Judge-specific optimization (0-25)
- Anticipation of opposition arguments (0-25)
- Use of favorable facts/evidence (0-25)
- Strategic positioning for trial (0-25)

THRESHOLD: Combined score must be >= 170 (85 per dimension) to pass.

OUTPUT FORMAT (JSON only):
{
  "substance_score": 0-100,
  "substance_breakdown": {"law": 0-25, "citations": 0-25, "argumentation": 0-25, "completeness": 0-25},
  "tactical_score": 0-100,
  "tactical_breakdown": {"judge_fit": 0-25, "opposition": 0-25, "facts": 0-25, "strategy": 0-25},
  "total_score": 0-200,
  "passed": true/false,
  "deficiencies": ["list of specific things to fix"],
  "strengths": ["list of what works well"]
}
"""

CODE_SCORING_PROMPT = """You are a code quality reviewer.
Score this work product on two dimensions, 0-100 each:

DIMENSION 1: CORRECTNESS (0-100)
- Logic correctness (0-25)
- Error handling (0-25)
- Edge cases covered (0-25)
- Type safety / input validation (0-25)

DIMENSION 2: QUALITY (0-100)
- Code clarity and readability (0-25)
- Performance (0-25)
- Security (0-25)
- Maintainability (0-25)

OUTPUT FORMAT (JSON only):
{
  "correctness_score": 0-100,
  "quality_score": 0-100,
  "total_score": 0-200,
  "passed": true/false,
  "deficiencies": ["list of specific things to fix"],
  "strengths": ["list of what works well"]
}
"""

def score_artifact(artifact: dict, task_type: str) -> dict:
    """Use Claude to score an artifact."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    
    is_legal = task_type in ("DRAFT", "CITE_CHECK", "RESEARCH", "ADVERSARY", "REVISE")
    prompt = LEGAL_SCORING_PROMPT if is_legal else CODE_SCORING_PROMPT
    
    response = client.messages.create(
        model=VP_MODEL,
        max_tokens=2048,
        system=prompt,
        messages=[{"role": "user", "content": f"WORK PRODUCT TO SCORE:\n\n{artifact.get('content', 'No content')[:8000]}"}]
    )
    
    text = response.content[0].text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# ─── GATE CHECKS ─────────────────────────────────────────────────────

def check_completed_tasks():
    """Find tasks in REVIEW status and run quality gates."""
    tasks = sb_get("dispatch_board", {"status": "eq.REVIEW"})
    
    for task in tasks:
        task_id = task["task_id"]
        print(f"[VP] Reviewing: {task_id} ({task['task_type']})")
        
        # Get artifacts for this task
        artifacts = sb_get("dispatch_artifacts", {"task_id": f"eq.{task_id}"})
        
        if not artifacts:
            print(f"[VP] No artifacts for {task_id}. Marking FAILED.")
            sb_patch("dispatch_board", {"task_id": task_id}, {
                "status": "FAILED",
                "error_log": "No artifacts produced"
            })
            continue
        
        # Score each artifact
        all_passed = True
        for artifact in artifacts:
            try:
                score_result = score_artifact(artifact, task["task_type"])
                total = score_result.get("total_score", 0)
                passed = total >= SCORE_THRESHOLD * 2  # 170+ to pass
                
                # Record quality gate
                sb_post("quality_gates", {
                    "task_id": task_id,
                    "gate_type": "SCORE",
                    "passed": passed,
                    "score": total,
                    "details": json.dumps(score_result),
                    "checked_by": VP_AGENT_ID
                })
                
                # Update artifact
                sb_patch("dispatch_artifacts", {"artifact_id": artifact["artifact_id"]}, {
                    "score": total,
                    "review_status": "APPROVED" if passed else "REVISION_NEEDED",
                    "review_notes": json.dumps(score_result.get("deficiencies", []))
                })
                
                print(f"[VP] {artifact['artifact_id']}: {total}/200 {'PASS' if passed else 'FAIL'}")
                
                if not passed:
                    all_passed = False
                    # Send deficiencies back to the original agent
                    sb_post("agent_messages", {
                        "from_agent": VP_AGENT_ID,
                        "to_agent": task.get("agent_id", "CEO-001"),
                        "mission_id": task.get("mission_id"),
                        "task_id": task_id,
                        "message_type": "HANDOFF",
                        "content": json.dumps({
                            "action": "REVISE",
                            "score": total,
                            "deficiencies": score_result.get("deficiencies", []),
                            "strengths": score_result.get("strengths", [])
                        })
                    })
                    
            except Exception as e:
                print(f"[VP] Scoring error for {artifact.get('artifact_id')}: {e}")
                all_passed = False
        
        # Update task status
        if all_passed:
            sb_patch("dispatch_board", {"task_id": task_id}, {
                "status": "COMPLETE",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "progress": 100
            })
            # Free the agent
            if task.get("agent_id"):
                sb_patch("agent_registry", {"agent_id": task["agent_id"]}, {"status": "IDLE"})
            print(f"[VP] {task_id} APPROVED and COMPLETE")
        else:
            sb_patch("dispatch_board", {"task_id": task_id}, {
                "status": "QUEUED",  # Back to queue for revision
                "progress": max(task.get("progress", 0) - 20, 0)
            })
            if task.get("agent_id"):
                sb_patch("agent_registry", {"agent_id": task["agent_id"]}, {"status": "IDLE"})
            print(f"[VP] {task_id} sent back for REVISION")


def check_red_zone():
    """Escalate any RED zone tasks that are about to execute."""
    red_tasks = sb_get("dispatch_board", {
        "zone": "eq.RED",
        "status": "eq.ASSIGNED"
    })
    
    for task in red_tasks:
        print(f"[VP] RED ZONE ALERT: {task['task_id']} assigned to {task.get('agent_id')}")
        sb_post("agent_messages", {
            "from_agent": VP_AGENT_ID,
            "to_agent": "ALAN",
            "mission_id": task.get("mission_id"),
            "task_id": task["task_id"],
            "message_type": "RED_ALERT",
            "content": f"RED ZONE task '{task['title']}' is assigned and about to execute. Approve or block."
        })


def check_stale_tasks():
    """Find tasks stuck IN_PROGRESS for too long."""
    in_progress = sb_get("dispatch_board", {"status": "eq.IN_PROGRESS"})
    now = datetime.now(timezone.utc)
    
    for task in in_progress:
        started = task.get("started_at")
        if not started:
            continue
        started_dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
        elapsed_min = (now - started_dt).total_seconds() / 60
        estimate = task.get("time_estimate_min", 30)
        
        if elapsed_min > estimate * 2:
            print(f"[VP] STALE TASK: {task['task_id']} running {elapsed_min:.0f}min (est: {estimate}min)")
            sb_post("agent_messages", {
                "from_agent": VP_AGENT_ID,
                "to_agent": "CEO-001",
                "mission_id": task.get("mission_id"),
                "task_id": task["task_id"],
                "message_type": "ESCALATION",
                "content": f"Task {task['task_id']} has been running {elapsed_min:.0f}min, {(elapsed_min/estimate):.1f}x estimate. May be stuck."
            })


# ─── MAIN LOOP ────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="REDMOND OS: VP Quality Gate")
    parser.add_argument("--mission", type=str, help="Gate a specific mission only")
    args = parser.parse_args()
    
    if not SUPABASE_KEY or not ANTHROPIC_KEY:
        print("[VP] ERROR: Set SUPABASE_SERVICE_KEY and ANTHROPIC_API_KEY")
        sys.exit(1)
    
    # Register VP
    try:
        sb_post("agent_registry", {
            "agent_id": VP_AGENT_ID,
            "agent_type": "VP",
            "surface": "CLI",
            "machine": os.environ.get("MACHINE_NAME", "WORKHORSE"),
            "model": VP_MODEL,
            "status": "WORKING",
            "capabilities": json.dumps(["score", "review", "escalate", "gate"])
        })
    except Exception:
        sb_patch("agent_registry", {"agent_id": VP_AGENT_ID}, {
            "status": "WORKING",
            "last_heartbeat": datetime.now(timezone.utc).isoformat()
        })
    
    print(f"[VP] Quality Gate running. Threshold: {SCORE_THRESHOLD * 2}/200")
    print(f"[VP] Poll interval: {POLL_INTERVAL}s")
    print("-" * 60)
    
    while True:
        try:
            check_completed_tasks()
            check_red_zone()
            check_stale_tasks()
            time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("\n[VP] Quality Gate paused.")
            break
        except Exception as e:
            print(f"[VP] Error: {e}")
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
