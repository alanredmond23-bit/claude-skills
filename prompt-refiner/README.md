# Prompt Refiner Skill

**Auto A+ Prompt Engineering System with Approval Hooks**

## Overview

This skill intercepts every user prompt via Claude Code CLI's `UserPromptSubmit` hook, transforms F-minus quality prompts to A+ quality using Claude Haiku, displays the transformation with scores, and requires human approval before execution.

## Unique Features (vs ALL competitors)

| Feature | Us | Others |
|---------|-----|--------|
| Shows transformation diff | YES | NO |
| Pre-execution scoring | YES | NO |
| Human approval gate | YES | NO |
| Domain auto-detection | YES | NO |
| Framework auto-selection | YES | NO |
| Life goal integration (G1-G5) | YES | NO |
| Zone-based risk gates | YES | NO |
| Uses cheap model (Haiku ~$0.001/prompt) | YES | NO |
| Bypass with prefix (* or !) | YES | NO |

## File Structure

```
prompt-refiner/
├── SKILL.md                 # Full build specification
├── RULES.md                 # Elon Algorithm, time blocks
├── ZONES.md                 # RED/YELLOW/GREEN definitions
├── config/
│   ├── domains.json         # Domain detection rules
│   ├── frameworks.json      # Framework selection matrix
│   └── goals.json           # G1-G5 definitions
├── hooks/
│   ├── refiner.py           # Main hook - calls Haiku, displays approval
│   ├── scorer.py            # 10-dimension scoring (130 max)
│   └── requirements.txt     # Python dependencies
└── docs/
    ├── PROMPT_REFINER_FINAL.xlsx  # 14-sheet reference toolkit
    └── transcript.txt       # Full conversation history
```

## Installation

```bash
# 1. Clone this repo
git clone https://github.com/alanredmond23-bit/claude-skills.git
cd claude-skills/prompt-refiner

# 2. Install dependencies
pip install -r hooks/requirements.txt

# 3. Copy to MASTER_RULES
cp -r . ~/MASTER_RULES/prompt-refiner/

# 4. Configure Claude CLI hook
# Add to ~/.claude/settings.json:
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/MASTER_RULES/prompt-refiner/hooks/refiner.py"
      }]
    }]
  }
}

# 5. Set API key
export ANTHROPIC_API_KEY="sk-..."
```

## Usage

```bash
# Normal usage (refinement + approval)
claude "fix the bug"

# Bypass refinement
claude "* fix the bug"
claude "! just do it"
```

## Scoring System

10 dimensions, max 130 points:

| Dimension | Weight | Max |
|-----------|--------|-----|
| Goal Alignment | 2.0 | 20 |
| Intent Clarity | 1.5 | 15 |
| Domain Fit | 1.0 | 10 |
| Demand Precision | 1.5 | 15 |
| Assumption Load | 1.0 | 10 |
| Framework Fit | 1.0 | 10 |
| Output Format | 1.0 | 10 |
| Time Block Fit | 1.5 | 15 |
| Zone Compliance | 1.5 | 15 |
| Leverage Factor | 1.0 | 10 |

**Gates:**
- < 65: REJECT
- 65-94: REFINE
- 95-114: EXECUTE
- 115+: SHIP

## Frameworks (16)

IRAC, MECE, OODA, 5 WHYS, JTBD, PRE-MORTEM, WARDLEY, COT, PERSPECTIVE, FIRST PRINCIPLES, INVERSION, RED TEAM, SCAMPER, EISENHOWER, PDCA, TOC

## Domains (5)

LEGAL, BUSINESS, TECHNICAL, FAMILY, RESEARCH

## Goals (G1-G5)

- G1: Bankruptcy Resolution (CRITICAL)
- G2: Federal Charges Defense (CRITICAL)
- G3: Custody Resolution (CRITICAL)
- G4: Family Harmony (HIGH)
- G5: $500K/month Revenue (HIGH)

## License

Proprietary - Alan Copeland / Digital Principles Corp
