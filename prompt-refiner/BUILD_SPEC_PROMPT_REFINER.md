# BUILD_SPEC: PROMPT REFINER v2.0
## Paste this entire document into Claude Code CLI to build

**Target:** Production-grade auto prompt refinement system for Claude Code CLI  
**Runtime cost:** ~$0.001/prompt (Claude Haiku)  
**Build time:** 30 minutes  
**Completion probability:** 92%

---

## WHAT YOU ARE BUILDING

A UserPromptSubmit hook that intercepts every prompt before it reaches Claude, scores it across 10 dimensions, selects the optimal reasoning framework from 16 options, rewrites it to A+ quality using Claude Haiku, shows the diff to the user, and requires approval before execution.

The system also auto-detects which of 5 life goal domains the prompt serves (G1-G5) and applies domain-specific framework weights.

---

## FILE STRUCTURE TO CREATE

```
~/MASTER_RULES/prompt-refiner/
├── main.py            # Entry point + approval loop + logging
├── scorer.py          # 10-dimension scoring + gate logic
├── refiner.py         # Haiku refinement engine
├── frameworks.py      # 16 reasoning framework definitions
├── goals.py           # G1-G5 domain detection
├── diff.py            # Terminal diff display
├── hook.sh            # UserPromptSubmit hook script
├── config.json        # Thresholds, model, flags
└── logs/              # JSONL refinement history
```

---

## config.json

```json
{
  "enabled": true,
  "model": "claude-haiku-4-5-20251001",
  "max_tokens": 2000,
  "score_threshold_reject": 30,
  "score_threshold_refine": 60,
  "score_threshold_execute": 80,
  "score_threshold_ship": 95,
  "require_approval": true,
  "log_all": true,
  "goals": {
    "G1": "Federal criminal case US v. Redmond EDPA 24-376, legal strategy, motions, evidence, FBI, IRS",
    "G2": "Family court Berks County, child custody, support, protective orders",
    "G3": "Civil litigation, contracts, business disputes, compliance",
    "G4": "Family harmony, Shannon job search, children, household management",
    "G5": "$500K monthly revenue, Digital Principles Corp, Koyoti, business automation, sales"
  }
}
```

---

## goals.py

```python
"""G1-G5 Life Goal Domain Detector"""

GOAL_KEYWORDS = {
    "G1": ["federal","trial","EDPA","24-376","evidence","discovery","motion","judge",
           "prosecution","FBI","IRS","26 USC","7201","7202","indictment","subpoena",
           "deposition","exhibit","brief","appeal","sentencing","Redmond"],
    "G2": ["custody","child support","berks county","family court","shannon","warrant",
           "contempt","visitation","protective order","parenting plan"],
    "G3": ["contract","lawsuit","compliance","tort","liability","settlement",
           "arbitration","incorporation","trademark","copyright","civil"],
    "G4": ["shannon","kids","children","family","school","home","household",
           "job search","education","health"],
    "G5": ["revenue","500k","digital principles","koyoti","automation","sales",
           "customer","lead","conversion","EBITDA","cashflow","SaaS","MRR",
           "pipeline","funnel","marketing","growth"]
}

DOMAIN_WEIGHTS = {
    "G1": {"IRAC":0.35,"PreMortem":0.20,"OODA":0.20,"FiveWhys":0.15,"MECE":0.10},
    "G2": {"IRAC":0.30,"JTBD":0.25,"Empathy":0.20,"PreMortem":0.15,"MECE":0.10},
    "G3": {"IRAC":0.40,"MECE":0.25,"PreMortem":0.20,"CostBenefit":0.15},
    "G4": {"JTBD":0.35,"Empathy":0.30,"FiveWhys":0.20,"ActionPriority":0.15},
    "G5": {"MECE":0.30,"JTBD":0.25,"PreMortem":0.20,"OKR":0.15,"OODA":0.10},
    "GENERAL": {"MECE":0.25,"FiveWhys":0.25,"OODA":0.25,"PreMortem":0.25}
}

def detect_domain(prompt):
    p = prompt.lower()
    scores = {}
    for domain, keywords in GOAL_KEYWORDS.items():
        scores[domain] = sum(1 for k in keywords if k.lower() in p) / len(keywords)
    best = max(scores, key=scores.get)
    if scores[best] < 0.02:
        return "GENERAL", 0.0, DOMAIN_WEIGHTS["GENERAL"]
    return best, round(scores[best], 3), DOMAIN_WEIGHTS[best]

def select_framework(domain, weights, prompt):
    return max(weights, key=weights.get) if weights else "MECE"
```

---

## frameworks.py

```python
"""16 Reasoning Framework Definitions"""

FRAMEWORKS = {
    "IRAC": {
        "template": "Structure: ISSUE (what is decided), RULE (applicable law/principle), APPLICATION (rule applied to facts), CONCLUSION (outcome)."
    },
    "MECE": {
        "template": "Break into categories that are mutually exclusive (no overlap) and collectively exhaustive (nothing missing). Present as hierarchy."
    },
    "OODA": {
        "template": "OBSERVE current situation, ORIENT based on context, DECIDE best action, ACT with specific next steps."
    },
    "FiveWhys": {
        "template": "State the problem, ask WHY 5 times drilling to root cause. Address root cause not symptom."
    },
    "JTBD": {
        "template": "Address the FUNCTIONAL job (what needs done), EMOTIONAL job (how user wants to feel), SOCIAL job (how user wants to be perceived)."
    },
    "PreMortem": {
        "template": "Assume this fails in 6 months. List 5 most likely failure causes. Redesign to eliminate each. Present failure-proof version."
    },
    "OKR": {
        "template": "OBJECTIVE (what), KEY RESULTS (3-5 measurable outcomes), INITIATIVES (how). Every recommendation ties to measurable result."
    },
    "Socratic": {
        "template": "Identify embedded assumptions. Question each. Build answer on verified foundations only."
    },
    "FirstPrinciples": {
        "template": "Strip to first principles: what is absolutely true vs assumed? Rebuild solution from verified fundamentals only."
    },
    "Inversion": {
        "template": "Ask what guarantees failure. List all failure paths. Solution avoids every failure path."
    },
    "CostBenefit": {
        "template": "Quantify COSTS (time/money/risk/opportunity at 1mo/6mo/1yr) and BENEFITS (revenue/time/risk at same intervals). Recommend on numbers."
    },
    "SWOT": {
        "template": "STRENGTHS (internal), WEAKNESSES (internal), OPPORTUNITIES (external), THREATS (external). Conclude with 3 strategic options."
    },
    "ActionPriority": {
        "template": "QUICK WINS (high impact, low effort), BIG BETS (high impact, high effort), FILL-INS (low impact, low effort), THANKLESS (eliminate). Rank within each."
    },
    "Empathy": {
        "template": "Map key person: THINK (beliefs), FEEL (fears), SAY (actual words), DO (behaviors). Strategy based on all four."
    },
    "Pyramid": {
        "template": "Lead with conclusion/recommendation. Then 3 supporting arguments. Then evidence per argument. Never bury the conclusion."
    },
    "Scenario": {
        "template": "BEST CASE (both uncertainties favorable), BASE CASE (mixed), WORST CASE (both unfavorable). Recommend strategy robust across all three."
    }
}

def get_framework_instruction(name):
    return FRAMEWORKS.get(name, FRAMEWORKS["MECE"])["template"]
```

---

## scorer.py

```python
"""10-Dimension Prompt Scoring Engine"""

import anthropic, json, os

SCORING_SYSTEM = """You are a prompt quality scorer. Score the prompt across 10 dimensions (0-10 each).
Return ONLY valid JSON. No preamble. No markdown. No fences.

{
  "scores": {
    "clarity": 0, "specificity": 0, "context": 0, "actionability": 0, "scope": 0,
    "output_format": 0, "constraints": 0, "success_criteria": 0, "relevance": 0, "completeness": 0
  },
  "total": 0,
  "weakest_dimensions": ["dim1", "dim2"],
  "one_line_diagnosis": "string"
}

total = sum of all 10 scores * 10"""

def score_prompt(prompt):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001", max_tokens=500,
        system=SCORING_SYSTEM,
        messages=[{"role":"user","content":f"Score this prompt:\n\n{prompt}"}]
    )
    raw = msg.content[0].text.strip().replace("```json","").replace("```","").strip()
    result = json.loads(raw)
    total = result.get("total", sum(result["scores"].values()) * 10)
    gate = "REJECT" if total < 30 else "REFINE" if total < 60 else "EXECUTE" if total < 80 else "SHIP"
    return total, result, gate

def format_scorecard(total, result, gate, domain):
    scores = result.get("scores", {})
    diagnosis = result.get("one_line_diagnosis", "")
    weakest = result.get("weakest_dimensions", [])
    G = {"REJECT":"\033[91m","REFINE":"\033[93m","EXECUTE":"\033[94m","SHIP":"\033[92m"}
    R = "\033[0m"
    c = G.get(gate, "")
    lines = [f"\n{'='*60}","PROMPT REFINER",f"{'='*60}",
             f"Domain: {domain}  Score: {total}/100  Gate: {c}{gate}{R}",
             f"Diagnosis: {diagnosis}", f"{'─'*60}"]
    for dim, score in scores.items():
        bar = "█"*score + "░"*(10-score)
        flag = " ← WEAK" if dim in weakest else ""
        lines.append(f"{dim:<20} {bar} {score}/10{flag}")
    lines.append(f"{'='*60}\n")
    return "\n".join(lines)
```

---

## refiner.py

```python
"""Prompt Refinement Engine — Claude Haiku"""

import anthropic, os
from frameworks import get_framework_instruction

SYSTEM = """You are an elite prompt engineer. Rewrite the given prompt to A+ quality.
Rules: preserve original intent 100%, apply the specified framework, add missing context/constraints/format specs.
Return ONLY the refined prompt text. No explanation. No preamble."""

def refine_prompt(raw, domain, framework_name, weak_dims, score):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    fw = get_framework_instruction(framework_name)
    weak_str = ", ".join(weak_dims) if weak_dims else "none"
    
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001", max_tokens=2000, system=SYSTEM,
        messages=[{"role":"user","content":
            f"Original prompt (score {score}/100):\n---\n{raw}\n---\n"
            f"Domain: {domain}\nFramework: {framework_name}\nInstruction: {fw}\nFix these weak dims: {weak_str}\n\nRewrite to A+:"}]
    )
    return msg.content[0].text.strip()
```

---

## diff.py

```python
"""Terminal diff display and approval gate"""

import difflib

def show_diff(original, refined):
    d = list(difflib.unified_diff(
        original.splitlines(), refined.splitlines(),
        fromfile="ORIGINAL", tofile="REFINED", lineterm=""
    ))
    if not d:
        return "No changes."
    out = []
    for line in d:
        if line.startswith("+") and not line.startswith("+++"):
            out.append(f"\033[92m{line}\033[0m")
        elif line.startswith("-") and not line.startswith("---"):
            out.append(f"\033[91m{line}\033[0m")
        elif line.startswith("@@"):
            out.append(f"\033[94m{line}\033[0m")
        else:
            out.append(line)
    return "\n".join(out)

def approval_prompt(refined, framework, domain):
    print(f"\n{'='*60}\nREFINED PROMPT | Framework: {framework} | Domain: {domain}\n{'='*60}")
    print(refined)
    print("="*60)
    while True:
        c = input("\n[A]pprove  [R]eject use original  [E]dit manually: ").strip().lower()
        if c in ["a"]: return "approve"
        if c in ["r"]: return "reject"
        if c in ["e"]: return "edit"
```

---

## main.py

```python
#!/usr/bin/env python3
"""PROMPT REFINER v2.0 — Main Entry Point
Usage:
  python3 main.py "your prompt"
  echo "prompt" | python3 main.py
  python3 main.py --test
  python3 main.py --log
"""

import sys, json, os, datetime
from pathlib import Path

from scorer import score_prompt, format_scorecard
from refiner import refine_prompt
from goals import detect_domain, select_framework
from diff import show_diff, approval_prompt

LOG_DIR = Path.home() / "MASTER_RULES" / "prompt-refiner" / "logs"

def log_it(entry):
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_file = LOG_DIR / f"{datetime.date.today().isoformat()}.jsonl"
    with open(log_file, "a") as f:
        f.write(json.dumps(entry) + "\n")

def run(raw_prompt, interactive=True):
    domain, confidence, weights = detect_domain(raw_prompt)
    framework_name = select_framework(domain, weights, raw_prompt)
    score, result, gate = score_prompt(raw_prompt)
    weak_dims = result.get("weakest_dimensions", [])

    if interactive:
        print(format_scorecard(score, result, gate, domain))

    if gate == "SHIP":
        if interactive: print("SHIP — executing as-is.")
        return raw_prompt

    if gate == "REJECT":
        if interactive: print("REJECT — prompt too vague. Rewrite and retry.")
        return raw_prompt

    refined = refine_prompt(raw_prompt, domain, framework_name, weak_dims, score)

    if interactive:
        print("\nDIFF:")
        print(show_diff(raw_prompt, refined))
        decision = approval_prompt(refined, framework_name, domain)
        if decision == "reject":
            refined = raw_prompt
        elif decision == "edit":
            print("Enter edited prompt (blank line to finish):")
            lines = []
            while True:
                line = input()
                if not line: break
                lines.append(line)
            refined = "\n".join(lines)

    log_it({
        "ts": datetime.datetime.now().isoformat(),
        "domain": domain, "framework": framework_name,
        "score": score, "gate": gate,
        "original": raw_prompt, "refined": refined
    })

    return refined

def main():
    if len(sys.argv) > 1:
        if sys.argv[1] == "--test":
            tests = [
                "help me with my case",
                "analyze motion to suppress filed 2026-02-14 in EDPA 24-376, identify 3 strongest prosecution counterarguments, IRAC format, bullet list with confidence scores",
                "make money",
                "draft Twilio SMS campaign for Digital Principles Corp, 500 real estate leads, under 160 chars, include opt-out, A/B test two CTAs",
            ]
            for t in tests:
                print(f"\n{'='*60}\nTEST: {t[:60]}\n{'='*60}")
                run(t, interactive=True)
            return
        if sys.argv[1] == "--log":
            lf = LOG_DIR / f"{datetime.date.today().isoformat()}.jsonl"
            if not lf.exists():
                print("No logs today.")
                return
            for line in lf.read_text().splitlines()[-10:]:
                e = json.loads(line)
                print(f"\n{e['ts']} | {e['domain']} | {e['framework']} | {e['gate']} | {e['score']}/100")
            return
        raw = " ".join(sys.argv[1:])
    elif not sys.stdin.isatty():
        raw = sys.stdin.read().strip()
    else:
        print("Usage: python3 main.py 'your prompt'")
        sys.exit(1)

    result = run(raw, interactive=True)
    print(f"\nFINAL:\n{result}")

if __name__ == "__main__":
    main()
```

---

## hook.sh

```bash
#!/bin/bash
# UserPromptSubmit Hook for Claude Code CLI
# Install location: ~/.claude/hooks/UserPromptSubmit/refiner.sh

source ~/MASTER_RULES/load_secrets.sh
PROMPT=$(cat)

# Skip empty, system commands, or short prompts
if [ -z "$PROMPT" ] || [[ "$PROMPT" == /* ]] || [ ${#PROMPT} -lt 10 ]; then
    echo "$PROMPT"
    exit 0
fi

REFINED=$(python3 ~/MASTER_RULES/prompt-refiner/main.py "$PROMPT" 2>/dev/null)
[ $? -eq 0 ] && [ -n "$REFINED" ] && echo "$REFINED" || echo "$PROMPT"
```

---

## INSTALL SEQUENCE

```bash
# Step 1: Create dirs
mkdir -p ~/MASTER_RULES/prompt-refiner/logs

# Step 2: Install dependency
pip install anthropic --break-system-packages

# Step 3: Load env
source ~/MASTER_RULES/load_secrets.sh

# Step 4: Verify API key present
echo $ANTHROPIC_API_KEY | head -c 20

# Step 5: Run test suite
cd ~/MASTER_RULES/prompt-refiner
python3 main.py --test

# Step 6: Install hook
mkdir -p ~/.claude/hooks/UserPromptSubmit
cp hook.sh ~/.claude/hooks/UserPromptSubmit/refiner.sh
chmod +x ~/.claude/hooks/UserPromptSubmit/refiner.sh

# Step 7: Test hook directly
echo "help me with my legal case" | bash ~/.claude/hooks/UserPromptSubmit/refiner.sh
```

---

## PRE-LAUNCH ERROR FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| `KeyError: ANTHROPIC_API_KEY` | Env not loaded | Run `source ~/MASTER_RULES/load_secrets.sh` first |
| `json.JSONDecodeError` | Haiku returned markdown fences | Already handled — strip in scorer.py |
| Hook not triggering | Wrong path | Verify `~/.claude/hooks/UserPromptSubmit/` exists |
| `ModuleNotFoundError: anthropic` | Not installed | `pip install anthropic --break-system-packages` |
| Score always 0 | Haiku format issue | Check SCORING_SYSTEM prompt — must say return total as sum*10 |

---

## WHAT SUCCESS LOOKS LIKE

Every Claude Code prompt gets intercepted → scored → refined → diff shown → approved → logged.  
Total overhead: 3-5 seconds. Cost: ~$0.001. Payoff: every prompt hitting Claude is A+ quality.
