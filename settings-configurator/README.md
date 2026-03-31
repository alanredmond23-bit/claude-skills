# Claude Default Behavioral Heuristics Configurator

**Digital Principles Corp // March 2026**

## What This Is

An interactive Excel spreadsheet that maps every default behavioral heuristic Claude operates on -- 103 documented settings across 18 categories in the reference sheet, and 20 configurable settings with dropdown controls and live output scoring in the configurator sheet.

Claude runs on implicit shortcuts (heuristics) that trade depth for speed unless explicitly overridden. This tool makes those shortcuts visible, configurable, and measurable.

## Files

| File | Purpose |
|------|---------|
| `CLAUDE_SETTINGS_CONFIGURATOR.xlsx` | Interactive configurator with dropdowns and formula-driven output scores |
| `CLAUDE_DEFAULT_BEHAVIORAL_HEURISTICS.xlsx` | Full reference: 103 settings, 18 categories, current values, descriptions, upside/downside of change |
| `README.md` | This file |

## How the Configurator Works

### Column B: Your Controls

Every yellow cell in Column B has a dropdown. Click it, pick a different option. The spreadsheet recalculates immediately.

### 20 Configurable Settings (7 categories)

**Model Parameters (4)**
- Temperature: 0.0 to 1.0 slider (default 1.0). Cannot combine with top_p on Opus 4.6.
- Effort Level: low / medium / high / max (default high). Controls adaptive thinking depth.
- Model: Haiku 4.5 / Sonnet 4.6 / Opus 4.6 / Opus 4.6 Fast (default Opus 4.6).
- Context Window: 32K / 128K / 200K / 500K / 1M (default 200K).

**File Reading (4)**
- File Read Depth: head -30 / head -80 / head -200 / Full file / Full + verify (default head -80).
- Binary Files: Skip entirely / Read if asked / Always extract (default Skip).
- Similar File Reading: Read 1 skip rest / Read 3 sample / Read all (default Read 1).
- Git Clone Depth: Shallow / Full / Full + branches / Full + log + branches (default Shallow).

**Search & Research (3)**
- Search Queries per Topic: 1-2 / 3-5 / 5-10 / 10+ (default 1-2).
- Web Fetch Depth: Snippets only / Fetch when critical / Always fetch (default Snippets).
- Past Chat Coverage: Skip / 2-3 pulls / Full / Full + read content (default 2-3 pulls).

**Response Generation (3)**
- Understanding Before Responding: 40% / 60% / 80% / 95% (default 60%).
- Confidence Language: Always confident / Flag unknowns / Signal uncertainty / Qualify everything (default Always confident).
- Build vs Read Priority: Build first / Balanced / Read first / Read everything first (default Build first).

**Code Generation (2)**
- Code Verification: Assume works / Run once / Run + fix / Run + fix + lint + test (default Assume works).
- Error Handling: Skip / Basic try/catch / Comprehensive / Production + logging (default Skip).

**Quality Assurance (2)**
- QA Before Delivery: None / Self-review / Verify claims / Full audit (default None).
- Hallucination Prevention: Trust memory / Flag unverified / Verify all facts / Verify + cite (default Trust memory).

**Tool & Output (2)**
- Command Output Reading: tail -3 / tail -10 / Full output / Full + parse errors (default tail -3).
- Tool Calls per Task: Minimum 1-3 / Standard 3-5 / Thorough 5-10 / Exhaustive 10+ (default Minimum).

### 6 Output Metrics

Each setting change shifts these scores via nested IF formulas. Scores = baseline + sum of all impacts, clamped 0-100.

| Metric | Baseline | What It Measures |
|--------|----------|-----------------|
| SPEED | 65% | Response latency, time to first output |
| QUALITY | 55% | Overall output polish, completeness |
| ACCURACY | 45% | Factual correctness, no hallucinations, verified claims |
| COST EFFICIENCY | 50% | Token efficiency, cost per output unit |
| DEPTH | 40% | Thoroughness, coverage, nothing left unread |
| CREATIVITY | 60% | Novel solutions, unexpected connections |

### Ratings

| Score | Rating |
|-------|--------|
| 80-100 | EXCELLENT (green) |
| 65-79 | GOOD (blue) |
| 50-64 | FAIR (amber) |
| 35-49 | WEAK (red) |
| 0-34 | POOR (dark red) |

### Overall Composite Score

Average of all 6 metrics. Displayed at the bottom with a rating.

## Preset Profiles

Not built into the spreadsheet (use the reference below to manually set):

| Profile | Temperature | Effort | Model | File Read | Search | Understanding | QA | Use For |
|---------|-------------|--------|-------|-----------|--------|---------------|----|---------| 
| **Legal Motion Sprint** | 0.3 | max | Opus 4.6 | Full + verify | 10+ exhaustive | 95% | Full audit + verify + cite | Court filings, motions, evidence synthesis |
| **Rapid Code Build** | 0.5 | high | Sonnet 4.6 | head -200 | 1-2 quick | 60% | Self-review + run+fix | Feature builds, scripts, rapid iteration |
| **Deep Research** | 0.7 | max | Opus 4.6 | Full + verify | 10+ exhaustive | 95% | Full audit + verify + cite | Competitive analysis, architecture review, due diligence |
| **Maximum Speed** | 0.8 | low | Haiku 4.5 | head -30 | 1-2 quick | 40% | None | Quick lookups, routing decisions, data processing |

## The Full Reference (103 Settings)

`CLAUDE_DEFAULT_BEHAVIORAL_HEURISTICS.xlsx` contains the exhaustive list across 18 categories:

1. Model Parameters (8)
2. File Reading (8)
3. Search & Research (7)
4. Response Generation (7)
5. Code Generation (6)
6. Tool Usage (6)
7. Communication (7)
8. Document Creation (5)
9. Legal Domain (4)
10. Memory & Context (4)
11. Estimation (3)
12. Prioritization (4)
13. Claude.ai Platform Settings (7)
14. Search Tool Technical Settings (5)
15. Artifact Technical Settings (5)
16. Opus 4.6 Model-Specific Settings (7)
17. Conversation/Session Settings (3)
18. Tone & Style Defaults (7)

Each row has: Setting Name, Current Value, What It Does, Upside of Change, Downside of Change.

## Key Technical Findings

- **Opus 4.6 rejects both temperature AND top_p simultaneously.** Breaking change from older Claude models. Use temperature only.
- **Adaptive thinking replaces budget_tokens.** Old `thinking: {type: "enabled", budget_tokens: N}` is deprecated on 4.6. Use `thinking: {type: "adaptive"}` with effort parameter.
- **Effort levels: low / medium / high / max.** Max is new for Opus 4.6. High is default.
- **128K max output tokens** (doubled from 64K). Requires streaming for large values.
- **1M context window** at standard pricing (no surcharge). Beta.
- **Fast mode** at $30/$150 per MTok (6x standard). Separate rate limits.
- **localStorage BLOCKED** in artifacts. Use `window.storage` API (5MB/key) or React state.
- **Web search: $10/1,000 searches.** Dynamic filtering with code execution on tool version web_search_20260209.
- **Copyright: 15-word quote maximum.** One quote per source. Default to paraphrasing.

## How This Was Built

1. Identified every heuristic by examining Claude's behavior across 30+ conversations over 60 days
2. Categorized into model parameters, behavioral shortcuts, platform settings, and technical constraints
3. Verified model-specific settings via Anthropic documentation and web research (March 2026)
4. Built impact scoring model mapping each setting change to 6 output metrics
5. Implemented as Excel formulas (nested IF + SUM) with data validation dropdowns

## Usage in CLAUDE.md

To apply specific settings from this configurator to your Claude Code sessions, add to your CLAUDE.md:

```markdown
## READ-FIRST PROTOCOL
- Before responding: `cat` files under 500 lines. `view` in 200-line chunks for longer files.
- Read EVERY file, not a sample. Never describe a file you haven't read.
- Never use `head`. Always use `cat` or full `view`.
- Never use `--depth 1` on clone. Full clone.
- Never use `| tail -3`. Read full output.
- Report actual read percentage before analysis.
- Say "I haven't read [X] yet" explicitly when true.

## SEARCH PROTOCOL
- Minimum 5 search queries per topic before responding.
- Always web_fetch full pages, not snippets.
- Paginate through ALL past conversations when referencing history.

## QUALITY PROTOCOL  
- Self-review every output before delivering.
- Flag every unverified claim with [UNVERIFIED].
- Run generated code before claiming it works.
```

## Origin

Built during a conversation where Alan pushed back on Claude's skimming behavior, forcing an honest accounting of every implicit shortcut. The spreadsheet is the result of that accountability exercise.
