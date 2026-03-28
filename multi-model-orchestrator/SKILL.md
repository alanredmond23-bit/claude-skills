---
name: multi-model-orchestrator
description: Fan out any prompt to Grok + Gemini + GPT-4o + Claude Opus simultaneously via async Python. Zero Claude runtime cost — runs standalone from terminal. Computes TF-IDF cosine similarity consensus score, detects outlier model, extracts key disagreements, generates ReportLab PDF report, stores all runs to ~/MASTER_RULES/model_runs/. Global 'ask' command installed to /usr/local/bin/ask. Modes: compare | consensus | vote.
install: bash ~/MASTER_RULES/multi-model-orchestrator/install.sh
spec: ~/MASTER_RULES/skills/multi-model-orchestrator/BUILD_SPEC_MULTI_MODEL.md
usage: ask "your question" [--models grok,gemini,gpt,claude] [--mode compare|consensus|vote]
status: SPEC_READY — paste BUILD_SPEC into Claude Code CLI to build
---

# MULTI-MODEL ORCHESTRATOR SKILL

One command. Four models. Simultaneous. PDF output. No Claude middleware cost at runtime.

## USAGE

```bash
# All 4 models, compare mode (default)
ask "what are the strongest defenses against 26 USC 7201?"

# Vote mode — majority answer on binary
ask "should I file before depositions?" --mode vote --domain legal

# Skip Claude at runtime (pure external APIs only)
ask "analyze this pitch" --models grok,gemini,gpt

# Quick 2-model spot check, no PDF
ask "is this clause enforceable?" --models gpt,claude --no-pdf

# Full deep research
ask "EBITDA optimization for $2M ARR SaaS" --models grok,gemini,gpt,claude --mode compare --domain business
```

## WHAT IT DOES

1. Fans out prompt to all selected models simultaneously (asyncio)
2. Each model client handles its own errors independently — others continue if one fails
3. Computes TF-IDF cosine similarity between all responses → agreement %
4. Detects outlier model (lowest avg similarity to others)
5. Extracts key disagreements between models
6. Generates ReportLab PDF: cover + consensus + perf table + full responses + disagreements
7. Saves everything to `~/MASTER_RULES/model_runs/YYYY-MM-DD/HH-MM-SS/`
8. Appends summary to `~/MASTER_RULES/model_runs/all_runs.jsonl`
9. Prints clean terminal summary with ASCII agreement bar

## MODELS

| Model | Provider | API base | Key name |
|-------|----------|----------|----------|
| grok | xAI | api.x.ai/v1 (OpenAI-compatible) | GROK_API_KEY or XAI_API_KEY |
| gemini | Google | google.generativeai | GEMINI_API_KEY |
| gpt | OpenAI | api.openai.com | OPENAI_API_KEY |
| claude | Anthropic | api.anthropic.com | ANTHROPIC_API_KEY |

## ANALYSIS MODES

- **compare** — Show all responses, consensus score, disagreements (default)
- **consensus** — Highlight points of agreement across all models
- **vote** — Majority answer on binary questions

## FILE LOCATIONS

```
~/MASTER_RULES/multi-model-orchestrator/
├── orchestrator.py           ← main entry + asyncio fan-out
├── models/
│   ├── grok_client.py
│   ├── gemini_client.py
│   ├── gpt_client.py
│   └── claude_client.py
├── analysis/
│   ├── consensus_engine.py   ← TF-IDF cosine similarity
│   ├── diff_analyzer.py
│   └── vote_engine.py
├── output/
│   ├── pdf_generator.py      ← ReportLab full report
│   ├── terminal_display.py
│   └── storage_writer.py
├── ask                       ← shell wrapper (symlinked to /usr/local/bin/ask)
└── install.sh
```

## OUTPUT FILES PER RUN

```
~/MASTER_RULES/model_runs/2026-03-28/14-23-01/
├── run.json                  ← full structured data
├── grok_response.txt
├── gemini_response.txt
├── gpt_response.txt
├── claude_response.txt
└── model_comparison_report.pdf
```

## COST PER RUN

| Configuration | Est. cost |
|---------------|-----------|
| Grok only | ~$0.005 |
| GPT-4o only | ~$0.015 |
| Gemini only | ~$0.002 |
| Claude Opus only | ~$0.025 |
| All 4 models | ~$0.047 |

No Claude subscription markup. Pure API rates.

## BUILD COMMAND (Claude Code CLI)

```
Build the Multi-Model Orchestrator exactly as specified in BUILD_SPEC_MULTI_MODEL.md.
Create all files in ~/MASTER_RULES/multi-model-orchestrator/.
Then run install.sh.
Then test with: ask "what is the capital of France?" --models grok,gpt --no-pdf
```

## KEY DEPENDENCIES

```bash
pip install anthropic openai google-generativeai scikit-learn reportlab --break-system-packages
```

## ERRORS TO PREVENT

- Check GROK_API_KEY vs XAI_API_KEY — both handled in grok_client.py
- ReportLab colors must use `colors.HexColor()` not plain strings
- `ask` symlink requires sudo — enter password when install.sh prompts
- Gemini SDK may not be fully async — `run_in_executor` pattern used

## ZONE

GREEN — no RED zone data. Full autonomy.

## IMPACT AXES

B (Revenue — better decisions = G5 faster) | C (Cost — $0.047 vs paying Claude middleware on every query) | D (Organization — all model runs logged and searchable)
