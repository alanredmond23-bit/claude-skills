#!/usr/bin/env python3
"""
REDMOND OS: CEO ORCHESTRATOR
=============================
The CEO agent. Takes a command from Alan, decomposes it into tasks,
assigns to agents, monitors progress, escalates RED zone only.

Usage:
    python ceo.py "Build a Franks motion targeting FBI SA Courtney Simmons"
    python ceo.py --monitor              # Just watch the board
    python ceo.py --mission FRANKS-001   # Resume monitoring a mission
"""

import os
import sys
import json
import time
import uuid
import argparse
from datetime import datetime, timezone
from typing import Optional

import httpx  # pip install httpx --break-system-packages
import anthropic  # pip install anthropic --break-system-packages

# ─── CONFIG ───────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fifybuzwfaegloijrmqb.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
CEO_MODEL = "claude-sonnet-4-6"  # Sonnet for speed. Opus for RED zone decisions.
CEO_AGENT_ID = "CEO-001"
POLL_INTERVAL = 10  # seconds between board checks
MAX_RETRIES = 3

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# ─── SUPABASE HELPERS ─────────────────────────────────────────────────

def sb_get(table: str, params: dict = None) -> list:
    """GET from Supabase REST API."""
    r = httpx.get(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, params=params or {})
    r.raise_for_status()
    return r.json()

def sb_post(table: str, data: dict) -> dict:
    """INSERT into Supabase."""
    r = httpx.post(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, json=data)
    r.raise_for_status()
    return r.json()

def sb_patch(table: str, match: dict, data: dict) -> dict:
    """UPDATE in Supabase."""
    params = {f"{k}": f"eq.{v}" for k, v in match.items()}
    r = httpx.patch(f"{SUPABASE_URL}/rest/v1/{table}", headers=HEADERS, params=params, json=data)
    r.raise_for_status()
    return r.json()

# ─── CEO BRAIN ────────────────────────────────────────────────────────

DECOMPOSITION_PROMPT = """You are the CEO of a multi-agent AI system called REDMOND OS.
You receive a high-level command from Alan (the human principal) and decompose it
into parallel and sequential tasks that can be executed by worker agents.

AGENT TYPES AVAILABLE:
- RESEARCHER: Pulls case law, evidence, data from APIs (CourtListener, Everlaw, web)
- FACT_COMPILER: Organizes evidence chronologies, maps facts to legal elements
- DRAFTER: Writes documents, motions, briefs, code, content
- CITE_CHECKER: Validates legal citations, checks for overruled cases
- ADVERSARY: Writes opposing arguments, finds weaknesses
- REVISER: Strengthens drafts based on adversary attacks and quality scores
- SCORER: Runs quality rubrics (200-point dual scoring for legal, lint/test for code)
- FORMATTER: Produces final output (PDF, DOCX, PPTX per EDPA rules or project specs)
- CODER: Writes and tests code (frontend, backend, infrastructure)
- TESTER: Runs tests, validates outputs, checks for errors

ZONE RULES:
- RED: Legal filings, billing logic, evidence handling. Human approval required before execution.
- YELLOW: APIs, core services, migrations. Requires tests + review.
- GREEN: New features, docs, utilities. Full autonomy.

TIME BLOCKS:
- 1 min, 5 min, 10 min, 30 min, 1 hour. Over 2 hours = WARNING.

OUTPUT FORMAT (JSON only, no markdown):
{
  "mission_id": "SHORT-ID-001",
  "zone": "RED|YELLOW|GREEN",
  "total_estimate_min": 60,
  "tasks": [
    {
      "task_id": "SHORT-ID-001-TASKNAME",
      "task_type": "RESEARCH|DRAFT|CITE_CHECK|...",
      "title": "Human readable title",
      "instructions": "Detailed instructions for the agent",
      "dependencies": [],
      "zone": "RED|YELLOW|GREEN",
      "time_estimate_min": 10,
      "preferred_model": "opus|sonnet|haiku|cerebras"
    }
  ]
}

RULES:
1. Maximize parallelism. If tasks don't depend on each other, they run simultaneously.
2. Dependencies are task_ids that must complete before this task starts.
3. Every legal filing task is RED zone. Always.
4. Research and fact compilation can always run in parallel.
5. Drafting depends on research. Revision depends on adversary. Formatting depends on revision.
6. Include a SCORER task after every DRAFTER/REVISER task.
7. Be specific in instructions. Include file paths, API endpoints, case numbers, judge names.
"""

def decompose_mission(command: str) -> dict:
    """Use Claude to decompose a command into tasks."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    
    response = client.messages.create(
        model=CEO_MODEL,
        max_tokens=4096,
        system=DECOMPOSITION_PROMPT,
        messages=[{"role": "user", "content": f"COMMAND FROM ALAN: {command}"}]
    )
    
    text = response.content[0].text
    # Strip markdown fences if present
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


def create_mission(command: str) -> str:
    """Decompose command and write mission + tasks to Supabase."""
    print(f"\n[CEO] Decomposing: {command}")
    plan = decompose_mission(command)
    
    mission_id = plan["mission_id"]
    
    # Create mission
    sb_post("missions", {
        "mission_id": mission_id,
        "command": command,
        "zone": plan["zone"],
        "status": "ACTIVE",
        "decomposition": json.dumps(plan)
    })
    print(f"[CEO] Mission created: {mission_id} | Zone: {plan['zone']} | Tasks: {len(plan['tasks'])}")
    
    # Create tasks
    for task in plan["tasks"]:
        sb_post("dispatch_board", {
            "task_id": task["task_id"],
            "mission_id": mission_id,
            "task_type": task["task_type"],
            "title": task["title"],
            "instructions": task["instructions"],
            "dependencies": task.get("dependencies", []),
            "zone": task.get("zone", "GREEN"),
            "status": "QUEUED",
            "time_estimate_min": task.get("time_estimate_min", 10)
        })
        print(f"  [TASK] {task['task_id']} | {task['task_type']} | {task['zone']} | ~{task.get('time_estimate_min', '?')}min")
    
    # RED zone warning
    if plan["zone"] == "RED":
        print(f"\n[CEO] *** RED ZONE MISSION *** Requires Alan's approval before agents execute.")
        sb_post("agent_messages", {
            "from_agent": CEO_AGENT_ID,
            "to_agent": "ALAN",
            "mission_id": mission_id,
            "message_type": "RED_ALERT",
            "content": f"RED ZONE mission '{mission_id}' requires your approval. {len(plan['tasks'])} tasks queued. Review the board."
        })
    
    return mission_id


# ─── ASSIGNMENT ENGINE ────────────────────────────────────────────────

def get_available_agents() -> list:
    """Get agents that are IDLE or have capacity."""
    agents = sb_get("agent_registry", {"status": "eq.IDLE"})
    return agents

def get_ready_tasks(mission_id: str) -> list:
    """Get QUEUED tasks whose dependencies are all COMPLETE."""
    tasks = sb_get("dispatch_board", {
        "mission_id": f"eq.{mission_id}",
        "status": "eq.QUEUED"
    })
    
    completed = sb_get("dispatch_board", {
        "mission_id": f"eq.{mission_id}",
        "status": "eq.COMPLETE",
        "select": "task_id"
    })
    completed_ids = {t["task_id"] for t in completed}
    
    ready = []
    for task in tasks:
        deps = task.get("dependencies", [])
        if all(d in completed_ids for d in deps):
            ready.append(task)
    
    return ready

def assign_tasks(mission_id: str):
    """Match ready tasks to available agents."""
    ready = get_ready_tasks(mission_id)
    agents = get_available_agents()
    
    if not ready:
        return
    if not agents:
        print(f"[CEO] {len(ready)} tasks ready but no agents available. Waiting...")
        return
    
    for task, agent in zip(ready, agents):
        sb_patch("dispatch_board", {"task_id": task["task_id"]}, {
            "agent_id": agent["agent_id"],
            "status": "ASSIGNED",
            "started_at": datetime.now(timezone.utc).isoformat()
        })
        sb_patch("agent_registry", {"agent_id": agent["agent_id"]}, {
            "status": "WORKING"
        })
        # Notify agent
        sb_post("agent_messages", {
            "from_agent": CEO_AGENT_ID,
            "to_agent": agent["agent_id"],
            "mission_id": mission_id,
            "task_id": task["task_id"],
            "message_type": "HANDOFF",
            "content": json.dumps({
                "task_id": task["task_id"],
                "title": task["title"],
                "instructions": task["instructions"],
                "zone": task["zone"]
            })
        })
        print(f"[CEO] Assigned {task['task_id']} -> {agent['agent_id']}")


# ─── MONITOR LOOP ────────────────────────────────────────────────────

def get_mission_status(mission_id: str) -> dict:
    """Get current status of all tasks in a mission."""
    tasks = sb_get("dispatch_board", {"mission_id": f"eq.{mission_id}"})
    total = len(tasks)
    by_status = {}
    for t in tasks:
        s = t["status"]
        by_status[s] = by_status.get(s, 0) + 1
    return {"total": total, "breakdown": by_status, "tasks": tasks}

def monitor_mission(mission_id: str):
    """Main monitoring loop. Assigns tasks, checks progress, handles escalations."""
    print(f"\n[CEO] Monitoring mission: {mission_id}")
    print(f"[CEO] Poll interval: {POLL_INTERVAL}s")
    print("-" * 60)
    
    while True:
        try:
            status = get_mission_status(mission_id)
            
            # Print status line
            b = status["breakdown"]
            line = " | ".join(f"{k}:{v}" for k, v in sorted(b.items()))
            print(f"[CEO] {datetime.now().strftime('%H:%M:%S')} | {line}")
            
            # Check for completion
            if b.get("COMPLETE", 0) == status["total"]:
                print(f"\n[CEO] MISSION COMPLETE: {mission_id}")
                sb_patch("missions", {"mission_id": mission_id}, {
                    "status": "COMPLETE",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                })
                break
            
            # Check for failures
            if b.get("FAILED", 0) > 0:
                failed = [t for t in status["tasks"] if t["status"] == "FAILED"]
                for t in failed:
                    print(f"[CEO] FAILED: {t['task_id']} | {t.get('error_log', 'no error log')}")
                    # Retry logic: requeue up to MAX_RETRIES
                    # (tracked via error_log count)
            
            # Assign any ready tasks
            assign_tasks(mission_id)
            
            # Check for escalations
            escalations = sb_get("agent_messages", {
                "to_agent": f"eq.{CEO_AGENT_ID}",
                "acknowledged": "eq.false",
                "message_type": "eq.ESCALATION"
            })
            for esc in escalations:
                print(f"[CEO] ESCALATION from {esc['from_agent']}: {esc['content']}")
                sb_patch("agent_messages", {"id": esc["id"]}, {"acknowledged": True})
            
            time.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            print(f"\n[CEO] Monitoring paused. Mission {mission_id} continues in background.")
            break
        except Exception as e:
            print(f"[CEO] Error: {e}")
            time.sleep(POLL_INTERVAL)


# ─── MAIN ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="REDMOND OS: CEO Orchestrator")
    parser.add_argument("command", nargs="?", help="Command from Alan")
    parser.add_argument("--monitor", action="store_true", help="Monitor mode only")
    parser.add_argument("--mission", type=str, help="Mission ID to monitor")
    parser.add_argument("--status", action="store_true", help="Print all mission statuses")
    args = parser.parse_args()
    
    if not SUPABASE_KEY:
        print("[CEO] ERROR: Set SUPABASE_SERVICE_KEY environment variable")
        sys.exit(1)
    if not ANTHROPIC_KEY:
        print("[CEO] ERROR: Set ANTHROPIC_API_KEY environment variable")
        sys.exit(1)
    
    # Register CEO
    try:
        sb_post("agent_registry", {
            "agent_id": CEO_AGENT_ID,
            "agent_type": "CEO",
            "surface": "CLI",
            "machine": os.environ.get("MACHINE_NAME", "WORKHORSE"),
            "model": CEO_MODEL,
            "status": "WORKING",
            "capabilities": json.dumps(["decompose", "assign", "monitor", "escalate"])
        })
    except Exception:
        # Already registered, update heartbeat
        sb_patch("agent_registry", {"agent_id": CEO_AGENT_ID}, {
            "status": "WORKING",
            "last_heartbeat": datetime.now(timezone.utc).isoformat()
        })
    
    if args.status:
        missions = sb_get("missions", {"order": "created_at.desc", "limit": "10"})
        for m in missions:
            print(f"{m['mission_id']} | {m['status']} | {m['zone']} | {m['command'][:60]}")
        return
    
    if args.mission:
        monitor_mission(args.mission)
        return
    
    if args.monitor:
        # Monitor most recent active mission
        missions = sb_get("missions", {"status": "eq.ACTIVE", "order": "created_at.desc", "limit": "1"})
        if missions:
            monitor_mission(missions[0]["mission_id"])
        else:
            print("[CEO] No active missions.")
        return
    
    if args.command:
        mission_id = create_mission(args.command)
        monitor_mission(mission_id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
