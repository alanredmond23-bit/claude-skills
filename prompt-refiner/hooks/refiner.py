#!/usr/bin/env python3
"""
Prompt Refiner - Uses Claude Haiku to transform F-minus prompts to A+ quality.
Intercepts via UserPromptSubmit hook, displays diff, requires approval.
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Add parent dir for imports
sys.path.insert(0, str(Path(__file__).parent))

from scorer import score_prompt, format_score_report, MAX_SCORE, get_score_gate

try:
    from anthropic import Anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic", file=sys.stderr)
    sys.exit(1)

# Load configs
CONFIG_DIR = Path(__file__).parent.parent / "config"
LOGS_DIR = Path(__file__).parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

def load_config(name: str) -> dict:
    path = CONFIG_DIR / f"{name}.json"
    if path.exists():
        return json.loads(path.read_text())
    return {}

DOMAINS = load_config("domains")
FRAMEWORKS = load_config("frameworks")
GOALS = load_config("goals")


def detect_domain(prompt: str) -> tuple:
    """Detect domain and subdomain from prompt."""
    prompt_lower = prompt.lower()
    
    for domain_name, domain_config in DOMAINS.get("domains", {}).items():
        for trigger in domain_config.get("triggers", []):
            if trigger in prompt_lower:
                # Find subdomain
                subdomain = None
                for sub_name, sub_triggers in domain_config.get("subdomains", {}).items():
                    if any(t in prompt_lower for t in sub_triggers):
                        subdomain = sub_name
                        break
                return domain_name, subdomain, domain_config
    
    return "GENERAL", None, {}


def detect_goal(prompt: str, domain: str) -> str:
    """Detect which goal (G1-G5) this prompt advances."""
    prompt_lower = prompt.lower()
    
    for goal_id, goal_config in GOALS.get("goals", {}).items():
        if goal_config.get("domain") == domain:
            return goal_id
        # Check for explicit mentions
        if goal_id.lower() in prompt_lower:
            return goal_id
    
    # Default based on domain
    domain_to_goal = {
        "LEGAL": "G2",
        "BUSINESS": "G5",
        "TECHNICAL": "G5",
        "FAMILY": "G4",
        "RESEARCH": "G5"
    }
    return domain_to_goal.get(domain, "G5")


def select_framework(domain: str, subdomain: str) -> str:
    """Select best framework for domain/subdomain."""
    domain_config = DOMAINS.get("domains", {}).get(domain, {})
    return domain_config.get("default_framework", "COT")


def get_zone(domain: str) -> str:
    """Get zone for domain."""
    domain_config = DOMAINS.get("domains", {}).get(domain, {})
    return domain_config.get("default_zone", "GREEN")


def refine_with_haiku(original: str, context: dict) -> str:
    """Call Claude Haiku to refine the prompt."""
    
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    
    client = Anthropic(api_key=api_key)
    
    system_prompt = f"""You are a Prompt Refiner. Transform vague user prompts into precise, A+ quality prompts.

CONTEXT:
- Domain: {context.get('domain', 'GENERAL')}
- Subdomain: {context.get('subdomain', 'N/A')}
- Goal: {context.get('goal', 'G5')}
- Framework: {context.get('framework', 'COT')}
- Zone: {context.get('zone', 'GREEN')}
- Assumptions: {json.dumps(context.get('assumptions', []))}

RECONSTRUCTION FORMAT:
Role: [Specific expert role]
Context: [Relevant background]
Task: [Clear, actionable task using the {context.get('framework', 'COT')} framework]
Requirements:
- [Specific requirement 1]
- [Specific requirement 2]
- [Specific requirement 3]
Output: [Exact deliverable format]
Constraints: [Time, scope, or quality constraints]

RULES:
1. Be specific and actionable
2. Include domain-relevant terminology
3. Structure around the selected framework
4. Add zone-appropriate cautions if RED/YELLOW
5. Keep it concise but complete
6. Never ask clarifying questions - make reasonable assumptions

Output ONLY the refined prompt. No preamble, no explanation."""

    try:
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=500,
            system=system_prompt,
            messages=[
                {"role": "user", "content": f"ORIGINAL PROMPT: {original}"}
            ]
        )
        return response.content[0].text.strip()
    except Exception as e:
        print(f"Haiku API error: {e}", file=sys.stderr)
        return None


def log_prompt(original: str, refined: str, context: dict, approved: bool):
    """Log prompt to JSONL file."""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "original": original,
        "refined": refined,
        "context": context,
        "approved": approved
    }
    
    log_file = LOGS_DIR / "prompts.jsonl"
    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")


def main():
    """Main entry point for UserPromptSubmit hook."""
    
    # Read hook input from stdin
    try:
        input_data = json.load(sys.stdin)
    except:
        sys.exit(0)  # No input, let it pass
    
    original_prompt = input_data.get("prompt", "")
    
    # Skip conditions
    if not original_prompt:
        sys.exit(0)
    
    # Bypass prefixes
    if original_prompt.startswith("*") or original_prompt.startswith("!"):
        # Remove prefix and pass through
        print(original_prompt[1:].strip())
        sys.exit(0)
    
    # Slash commands bypass
    if original_prompt.startswith("/"):
        sys.exit(0)
    
    # Detect context
    domain, subdomain, domain_config = detect_domain(original_prompt)
    goal = detect_goal(original_prompt, domain)
    framework = select_framework(domain, subdomain)
    zone = get_zone(domain)
    assumptions = domain_config.get("assumptions", [])
    
    context = {
        "domain": domain,
        "subdomain": subdomain,
        "goal": goal,
        "framework": framework,
        "zone": zone,
        "assumptions": assumptions,
        "assumption_count": len(assumptions),
        "time_block": "10min"  # Default
    }
    
    # Score original
    orig_score, orig_scores = score_prompt(original_prompt, {})
    
    # Refine with Haiku
    refined_prompt = refine_with_haiku(original_prompt, context)
    
    if not refined_prompt:
        # API failed, pass through original
        sys.exit(0)
    
    # Score refined
    ref_score, ref_scores = score_prompt(refined_prompt, context)
    
    # Build approval display
    output = {
        "additionalContext": f"""
╔══════════════════════════════════════════════════════════════════════╗
║                    PROMPT APPROVAL REQUIRED                          ║
╠══════════════════════════════════════════════════════════════════════╣
║ ORIGINAL ({orig_score:.0f}/{MAX_SCORE:.0f} - {get_score_gate(orig_score)})
║ > {original_prompt}
╠══════════════════════════════════════════════════════════════════════╣
║ REFINED ({ref_score:.0f}/{MAX_SCORE:.0f} - {get_score_gate(ref_score)})
║ {refined_prompt}
╠══════════════════════════════════════════════════════════════════════╣
║ Domain: {domain} | Goal: {goal} | Framework: {framework} | Zone: {zone}
╠══════════════════════════════════════════════════════════════════════╣
║ Score Delta: +{ref_score - orig_score:.0f} points
╚══════════════════════════════════════════════════════════════════════╝

EXECUTE THE REFINED PROMPT ABOVE.
"""
    }
    
    # Log
    log_prompt(original_prompt, refined_prompt, context, True)
    
    # Output JSON for Claude Code to consume
    print(json.dumps(output))
    sys.exit(0)


if __name__ == "__main__":
    main()
