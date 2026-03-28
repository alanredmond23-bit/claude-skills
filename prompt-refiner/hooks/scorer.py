#!/usr/bin/env python3
"""
Prompt Scorer - 10 Dimension Scoring System
Max Score: 130 points
"""

import json
from typing import Dict, Tuple

DIMENSIONS = {
    "goal_alignment": {"weight": 2.0, "description": "Does this advance G1-G5?"},
    "intent_clarity": {"weight": 1.5, "description": "Clear intent defined?"},
    "domain_fit": {"weight": 1.0, "description": "Correct domain detected?"},
    "demand_precision": {"weight": 1.5, "description": "Specific ask articulated?"},
    "assumption_load": {"weight": 1.0, "description": "Few unverified assumptions?"},
    "framework_fit": {"weight": 1.0, "description": "Right framework selected?"},
    "output_format": {"weight": 1.0, "description": "Deliverable format defined?"},
    "time_block_fit": {"weight": 1.5, "description": "Achievable in time block?"},
    "zone_compliance": {"weight": 1.5, "description": "Appropriate zone selected?"},
    "leverage_factor": {"weight": 1.0, "description": "Compounds future work?"}
}

MAX_SCORE = sum(d["weight"] * 10 for d in DIMENSIONS.values())  # 130

def score_prompt(prompt: str, context: Dict) -> Tuple[float, Dict[str, float]]:
    """
    Score a prompt across 10 dimensions.
    Returns (total_score, dimension_scores)
    """
    scores = {}
    
    # Goal Alignment (0-10)
    goal_keywords = ["G1", "G2", "G3", "G4", "G5", "bankruptcy", "charges", "custody", "family", "revenue"]
    goal_score = min(10, sum(2 for k in goal_keywords if k.lower() in prompt.lower()))
    scores["goal_alignment"] = goal_score
    
    # Intent Clarity (0-10)
    intent_indicators = ["help", "create", "fix", "analyze", "write", "build", "find", "explain"]
    intent_score = min(10, 3 + sum(2 for i in intent_indicators if i in prompt.lower()))
    scores["intent_clarity"] = intent_score
    
    # Domain Fit (0-10)
    domain = context.get("domain", "")
    domain_score = 10 if domain else 3
    scores["domain_fit"] = domain_score
    
    # Demand Precision (0-10)
    word_count = len(prompt.split())
    if word_count < 3:
        demand_score = 2
    elif word_count < 10:
        demand_score = 5
    elif word_count < 30:
        demand_score = 8
    else:
        demand_score = 10
    scores["demand_precision"] = demand_score
    
    # Assumption Load (0-10, inverse - fewer is better)
    assumption_count = context.get("assumption_count", 3)
    assumption_score = max(0, 10 - assumption_count)
    scores["assumption_load"] = assumption_score
    
    # Framework Fit (0-10)
    framework = context.get("framework", "")
    framework_score = 10 if framework else 4
    scores["framework_fit"] = framework_score
    
    # Output Format (0-10)
    format_indicators = ["list", "table", "report", "document", "code", "analysis", "summary"]
    format_score = min(10, 3 + sum(2 for f in format_indicators if f in prompt.lower()))
    scores["output_format"] = format_score
    
    # Time Block Fit (0-10)
    time_block = context.get("time_block", "")
    time_score = 10 if time_block else 5
    scores["time_block_fit"] = time_score
    
    # Zone Compliance (0-10)
    zone = context.get("zone", "")
    zone_score = 10 if zone else 5
    scores["zone_compliance"] = zone_score
    
    # Leverage Factor (0-10)
    leverage_indicators = ["template", "reusable", "automate", "process", "system"]
    leverage_score = min(10, 3 + sum(2 for l in leverage_indicators if l in prompt.lower()))
    scores["leverage_factor"] = leverage_score
    
    # Calculate weighted total
    total = sum(scores[dim] * DIMENSIONS[dim]["weight"] for dim in scores)
    
    return total, scores


def get_score_gate(score: float) -> str:
    """Return the gate based on score."""
    if score < 65:
        return "REJECT"
    elif score < 95:
        return "REFINE"
    elif score < 115:
        return "EXECUTE"
    else:
        return "SHIP"


def format_score_report(total: float, scores: Dict[str, float]) -> str:
    """Format a score report for display."""
    gate = get_score_gate(total)
    
    lines = [
        f"SCORE: {total:.0f}/{MAX_SCORE:.0f} ({total/MAX_SCORE*100:.0f}%) → {gate}",
        ""
    ]
    
    for dim, score in scores.items():
        weight = DIMENSIONS[dim]["weight"]
        weighted = score * weight
        bar = "█" * int(score) + "░" * (10 - int(score))
        lines.append(f"  {dim:20} [{bar}] {score:.0f}×{weight:.1f}={weighted:.0f}")
    
    return "\n".join(lines)


if __name__ == "__main__":
    # Test
    test_prompt = "fix the bug"
    test_context = {"domain": "", "framework": "", "zone": "", "time_block": ""}
    total, scores = score_prompt(test_prompt, test_context)
    print(format_score_report(total, scores))
