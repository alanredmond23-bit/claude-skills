# REDMOND OS v2.0 — DEFINITIVE ARCHITECTURE
## The 3-Mac AI Staff System with CEO Dispatcher, VP Quality Gate, and Supabase War Room

**Classification:** PRIVATE & CONFIDENTIAL
**Version:** 2.0 FINAL — Merged Architecture
**Date:** March 30, 2026
**Author:** Digital Principles Corp / Alan C. Redmond

---

## EXECUTIVE SUMMARY

Two architectures merged into one. Alan's 3-Mac SSH-routed Dispatcher CEO (transport layer, domain separation, Portkey model routing, OpenClaw insights) combined with the Supabase war room (monitoring, VP quality scoring, agent messaging, 8-agent legal pipeline, iPad dashboard). SSH moves the work. Supabase watches the work. You watch from your iPad.

---

## SECTION 1 — THE TWO-LAYER ARCHITECTURE

### Layer 1: SSH TRANSPORT (Alan's Plan — The Muscles)

WORKHORSE is the CEO. It decomposes tasks, SSHs into QUICKS and ADMIN, fires Claude Code CLI headlessly, and aggregates results. No REST API in the critical path. No cloud dependency for execution. Local network, sub-millisecond latency, full filesystem access.

### Layer 2: SUPABASE WAR ROOM (Claude's Plan — The Nervous System)

Supabase is the monitoring backbone. Every agent writes status, artifacts, and messages to 6 Supabase tables with realtime enabled. The iPad dashboard polls every 5 seconds. The VP quality gate reads completed work and scores it. Alan sees everything without touching a terminal.

### Why Both Layers

| Concern | SSH Handles | Supabase Handles |
|---------|------------|-----------------|
| Task execution | YES — fires claude CLI | NO |
| File access | YES — full filesystem | NO |
| Speed | YES — local network | NO — REST over internet |
| Monitoring | NO — logs only | YES — realtime dashboard |
| Quality scoring | NO | YES — VP reads artifacts, scores them |
| Agent coordination | PARTIAL — serial SSH | YES — any agent reads the board |
| Artifact storage | LOCAL — filesystem | YES — persistent, queryable |
| iPad visibility | NO | YES — React dashboard |
| Cross-session memory | NO — ephemeral | YES — persists across sessions |

---

## SECTION 2 — THREE MACHINES, THREE DOMAINS, ONE CEO

### Machine Roles (Domain-Locked)

| Machine | Role | Domain | What Lives Here |
|---------|------|--------|-----------------|
| WORKHORSE | CEO + Builder | Engineering + DevOps + Dispatch | Dispatcher process, all repos, Claude Code CLI, Git, Azure CLI, rclone, Cursor |
| QUICKS | Revenue Worker | Sales + Lead Gen + Analytics | Closer Bot, Twilio, Lead Validation, Five9 Analytics, Supabase data |
| ADMIN | Legal Worker | Defense + Filings + Discovery | Motion Pipeline, CourtListener, DocketBird, Everlaw, Cursor IDE |

### Domain Lock Rule

Legal tasks go to ADMIN only. Revenue tasks go to QUICKS only. Code/build goes to WORKHORSE. Nothing crosses domain lines without explicit CEO override. This prevents a revenue script from touching evidence files or a code deployment from interfering with a filed motion.

### Physical Configuration

All 3 Macs: M1 MacBook Pro, always plugged in, never sleeps (System Preferences > Battery > Prevent sleep when charging). SSH enabled (System Settings > General > Sharing > Remote Login > ON). Computer Use enabled in Claude Desktop.

Only WORKHORSE runs Dispatch pairing to iPad. Close Claude Desktop on ADMIN + QUICKS to prevent login conflicts.

---

## SECTION 3 — THE DISPATCHER CEO (Node.js on WORKHORSE)

### The Flow

```
You (iPad)
  |
  v
Dispatcher CEO (WORKHORSE)
  |
  |-- [1] Receives command via Dispatch/Cowork
  |-- [2] Calls Claude to decompose into subtasks (via Portkey)
  |-- [3] Assigns domains: which machine handles each subtask
  |-- [4] Pulls GITBrain context for each subtask
  |-- [5] SSHs into target machine(s), fires: claude --headless -p "task + context"
  |-- [6] Worker executes, writes status to Supabase, outputs to filesystem
  |-- [7] VP Quality Gate scores completed artifacts (separate process)
  |-- [8] If score < 170/200: VP rejects, Dispatcher re-queues for revision
  |-- [9] If RED zone: Dispatcher pauses, sends Twilio SMS to Alan
  |-- [10] On completion: Dispatcher sends summary to iPad + Twilio SMS
```

### Dispatcher CEO Rules

| Rule | Logic |
|------|-------|
| Domain Lock | Legal → ADMIN. Revenue → QUICKS. Code → WORKHORSE. No exceptions without human override. |
| Decompose First | No task routes until broken into subtasks with time estimates. Task >2 hours = WARNING. |
| Parallel by Default | If 2+ subtasks are domain-independent, they run simultaneously on separate machines. |
| Context Injection | Before routing, Dispatcher pulls relevant files from GITBrain and injects as context. |
| Human Gates | Filing motions, sending money, deleting >10 files, committing to main, any RED zone = PAUSE + ask Alan. |
| Report Always | Every completed task: 3-line summary (what done, what next, what needs review). Sent to iPad. |
| Quality Gate | Every artifact goes through VP scoring. Below 170/200 = automatic revision loop. |
| Retry Logic | Failed tasks retry up to 3 times. Different agent on each retry. After 3 fails = escalate to Alan. |

### Claude-Powered Decomposition (Not Static Rules)

The Dispatcher doesn't use a hardcoded routing table. It calls Claude (Sonnet for speed) with a decomposition prompt that includes:

- Available agent types and their capabilities
- Domain constraints (which machine handles what)
- Zone rules (RED/YELLOW/GREEN)
- Time block rules (1min/5min/10min/30min/1hr/WARNING)
- Current board state (what's already running)
- GITBrain domain context

Claude returns a JSON task graph with dependencies, parallel opportunities, model preferences, and time estimates. This is why the system handles novel tasks — it doesn't need a predefined playbook for every request type.

### Mission Templates (Pre-Built Decomposition Patterns)

For common high-stakes workflows, pre-built templates override the dynamic decomposition to ensure consistency:

**TEMPLATE: LEGAL_MOTION**
```
Agent 1: RESEARCHER (ADMIN) — CourtListener + Everlaw + web search → case law brief
Agent 2: FACT_COMPILER (ADMIN) — Evidence index + Five9 data + exhibits → fact chronology
Agent 3: DRAFTER (ADMIN) — Research + facts + template → first draft
Agent 4: CITE_CHECKER (ADMIN) — Validate all citations against CourtListener
Agent 5: ADVERSARY (WORKHORSE) — Write opposition brief, find all weaknesses
Agent 6: REVISER (ADMIN) — Strengthen draft using adversary attacks + VP score feedback
Agent 7: SCORER (VP process) — 200-point dual scoring, 170+ to pass
Agent 8: FORMATTER (ADMIN) — EDPA-compliant PDF with caption, cert of service, exhibits
```

Agents 1+2 run in parallel. Agent 3 depends on 1+2. Agent 4 depends on 3. Agent 5 runs parallel with 4. Agent 6 depends on 4+5. Agent 7 depends on 6. Agent 8 depends on 7.

Wall clock: 2-4 hours instead of 5-7 days.

**TEMPLATE: PRODUCT_FEATURE**
```
Agent 1: ARCHITECT (WORKHORSE) — Schema + API design + component structure
Agent 2: CODER_BACKEND (WORKHORSE) — Supabase migration + API routes
Agent 3: CODER_FRONTEND (WORKHORSE) — React components + Tailwind
Agent 4: TESTER (WORKHORSE) — Unit + integration tests
Agent 5: DEPLOYER (WORKHORSE) — Vercel deploy + smoke test
```

Agents 2+3 parallel after Agent 1. Agent 4 depends on 2+3. Agent 5 depends on 4.

**TEMPLATE: REVENUE_CAMPAIGN**
```
Agent 1: RESEARCHER (QUICKS) — Market data + competitor analysis
Agent 2: COPYWRITER (QUICKS) — Landing page + email sequence + ad copy
Agent 3: BUILDER (WORKHORSE) — Deploy landing page + Twilio integration
Agent 4: ANALYST (QUICKS) — Tracking setup + conversion funnels
```

---

## SECTION 4 — THE VP QUALITY GATE

Separate process running on WORKHORSE. Polls Supabase for tasks in REVIEW status. Scores every artifact before it can move to COMPLETE.

### Dual Scoring System (200 points total)

**Legal Work:**

| Dimension 1: Legal Substance (0-100) | Dimension 2: Tactical Effectiveness (0-100) |
|---------------------------------------|---------------------------------------------|
| Correct statement of law (0-25) | Judge-specific optimization (0-25) |
| Proper citation format + accuracy (0-25) | Anticipation of opposition (0-25) |
| Persuasive argumentation (0-25) | Use of favorable facts/evidence (0-25) |
| Completeness of analysis (0-25) | Strategic positioning for trial (0-25) |

**Code Work:**

| Dimension 1: Correctness (0-100) | Dimension 2: Quality (0-100) |
|----------------------------------|------------------------------|
| Logic correctness (0-25) | Code clarity (0-25) |
| Error handling (0-25) | Performance (0-25) |
| Edge cases covered (0-25) | Security (0-25) |
| Type safety / validation (0-25) | Maintainability (0-25) |

### Threshold: 170/200 to pass (85 per dimension)

Below 170: VP sends deficiency list back to the agent. Task re-queues for revision. The revision agent gets the original output + specific deficiencies + strengths to preserve. This loops up to 3 times. After 3 failed revisions, escalates to Alan.

### Additional VP Checks

- RED zone enforcement: Any RED zone task that's ASSIGNED without Alan's approval gets blocked
- Stale task detection: Tasks running >2x their estimate get flagged
- Citation verification: Legal artifacts get an additional cite-check pass against CourtListener API
- Zero hallucination check: Any [UNVERIFIED] tags in output trigger a research re-run

---

## SECTION 5 — SUPABASE WAR ROOM (6 Tables)

### Table Architecture

```
agent_registry          — Who's in the room (CEO, VP, workers, their status/machine/capabilities)
missions                — Top-level commands from Alan (raw command, zone, decomposition, status)
dispatch_board          — Individual tasks (instructions, dependencies, agent, zone, progress, status)
dispatch_artifacts      — Outputs from agents (content, scores, review status, version)
agent_messages          — How agents talk (STATUS, HANDOFF, ESCALATION, RED_ALERT, COMPLETE)
quality_gates           — VP's checkpoint records (gate type, pass/fail, score, details)
```

All 6 tables have realtime enabled via `ALTER PUBLICATION supabase_realtime`. The iPad dashboard subscribes to changes and updates live.

### How Agents Use Supabase

Every agent — whether running via SSH on a Mac or in a Claude chat session — hits Supabase REST API for:
1. Registering presence (agent_registry)
2. Reading assigned tasks (dispatch_board)
3. Writing outputs (dispatch_artifacts)
4. Sending messages to other agents or CEO (agent_messages)
5. Updating task status and progress (dispatch_board)

The SSH transport moves the WORK. Supabase moves the METADATA.

---

## SECTION 6 — PORTKEY MODEL ROUTER

Portkey sits between the Dispatcher and LLM providers. It handles model selection, 429 retry with exponential backoff, cost optimization, and provider failover.

### Routing Table

| Task Type | Primary Model | Fallback | Why |
|-----------|---------------|----------|-----|
| Legal drafting / motions | Claude Opus 4.6 | Claude Sonnet 4.6 | Highest reasoning for legal precision |
| CEO decomposition | Claude Sonnet 4.6 | GPT-4o | Speed for planning, not execution |
| Code generation / commits | Claude Sonnet 4.6 | GPT-4o | Speed + cost balance for volume |
| Lead scoring / data processing | Claude Haiku 4.5 | Gemini Flash | Cheapest for high-volume data |
| Quick lookups / routing | Claude Haiku 4.5 | Gemini Flash | Sub-second, near-zero cost |
| Long context / doc analysis | Claude Sonnet 4.6 (1M) | Gemini 1.5 Pro | Massive document analysis |
| VP quality scoring | Claude Sonnet 4.6 | Claude Sonnet 4.6 | Consistent scoring model |
| Adversary brief writing | Claude Opus 4.6 | Claude Sonnet 4.6 | Needs to think like AUSA Metcalf |

### Provider Priority (via your existing API keys)

1. Anthropic (Tier 3: 2,000 RPM, 800K ITPM)
2. OpenAI (backup for code tasks)
3. Google Gemini (backup for data/long-context)
4. Groq (fast inference for simple routing decisions)
5. OpenRouter (catch-all failover)
6. Cerebras (bulk open-source model tasks at 3,000 tok/sec)

---

## SECTION 7 — GITBRAIN CONTEXT INJECTION

Before any task routes to a worker, the Dispatcher pulls relevant domain files from GITBrain (github.com/alanredmond23-bit/GITBrain, PRIVATE repo) and injects them as context.

### Domain-to-GITBrain Mapping

| Domain | GITBrain Path | Key Files |
|--------|---------------|-----------|
| Legal (ADMIN) | LEGAL/CRIMINAL/ | Carrier defense timeline, victim index, judge scoring rubrics, Five9 analysis, Malcolm Smith letter |
| Legal (ADMIN) | LEGAL/BANKRUPTCY/ | Adversary proceeding details, Joel Ready timeline |
| Legal (ADMIN) | LEGAL/FAMILY/ | Berks County, Montgomery County details |
| Product (WORKHORSE) | PRODUCT/CHATBOT/ | Menagerie OS specs, pet wellness platform architecture |
| Engineering (WORKHORSE) | ENGINEERING/ | Azure infrastructure, Supabase schema, deployment configs |
| Revenue (QUICKS) | BUSINESS/ | Revenue targets, lead gen strategy, pricing models |

### Injection Protocol

1. Dispatcher identifies task domain from decomposition
2. Pulls relevant GITBrain files via GitHub API (using active PAT)
3. Prepends context to the Claude Code CLI prompt: `claude --headless -p "[CONTEXT]\n{gitbrain_content}\n[TASK]\n{task_instructions}"`
4. Worker receives full domain context without needing to search for it

This eliminates cold starts. Every worker arrives knowing the case, the code, the strategy.

---

## SECTION 8 — iPAD DASHBOARD (React + Supabase Realtime)

Blueprint design (bg=#050810, blueprint grid, JetBrains Mono headers, Inter body). Polls Supabase every 5 seconds. Shows:

- **Agent Grid:** All registered agents with status, machine, model
- **RED Zone Alerts:** Flashing banner for any tasks requiring Alan's approval
- **Mission Cards:** Each mission with task breakdown, progress bars, scores
- **Message Feed:** Agent-to-agent and escalation messages

Dashboard artifact already built and delivered. Enter Supabase service key on load. View from iPad, phone, or any browser.

---

## SECTION 9 — NOTIFICATIONS (Twilio)

Dispatcher sends SMS to Alan's iPhone via Twilio on:

| Event | Message Format |
|-------|---------------|
| Mission complete | "[MISSION-ID] COMPLETE. [N] tasks, [M] artifacts. [Link to dashboard]" |
| RED zone gate | "[MISSION-ID] RED ZONE. Task: [title]. Approve or block. [Link]" |
| Quality failure (3rd attempt) | "[MISSION-ID] QUALITY FAIL x3. Task: [title]. Manual review needed." |
| Error/crash | "[MISSION-ID] ERROR on [machine]. [Error summary]. Auto-retry [N]/3." |
| Stale task | "[MISSION-ID] STALE. Task [title] running [X]min (est: [Y]min)." |

---

## SECTION 10 — CLAUDE.md FILES (Per Machine)

### WORKHORSE CLAUDE.md (CEO + Engineering)
```
# REDMOND OS — WORKHORSE (CEO + BUILDER)

## Identity
You are the CEO Dispatcher and primary engineering agent.
You decompose, route, monitor, and build.

## Domain Lock
- Engineering + DevOps: YOURS
- Revenue + Lead Gen: SSH to QUICKS only
- Legal + Filings: SSH to ADMIN only
- NEVER execute legal or revenue tasks locally

## Zone Rules
- RED: File motions, send money, delete >10 files, commit main → PAUSE, ask Alan
- YELLOW: API changes, migrations, core services → execute + run tests
- GREEN: New features, docs, utilities → full autonomy

## Routing
- Use Portkey for model selection
- Default: Sonnet 4.6 for speed
- Opus 4.6 for: adversary briefs, complex architecture, RED zone reasoning
- Haiku 4.5 for: quick lookups, routing decisions, data processing

## Time Blocks
1min | 5min | 10min | 30min | 1hr | >2hr = WARNING

## Quality
- All code: lint + type-check + test before commit
- All artifacts: submit to VP via Supabase (status = REVIEW)
- Score threshold: 170/200

## Supabase
- URL: https://fifybuzwfaegloijrmqb.supabase.co
- Write status updates to dispatch_board
- Write artifacts to dispatch_artifacts
- Check agent_messages for VP feedback
```

### QUICKS CLAUDE.md (Revenue)
```
# REDMOND OS — QUICKS (REVENUE WORKER)

## Identity
You are the revenue and lead generation agent.
You build funnels, score leads, analyze sales data, and optimize conversion.

## Domain Lock
- Revenue + Lead Gen + Analytics: YOURS
- Engineering: NEVER. Escalate to CEO.
- Legal: NEVER. Escalate to CEO.

## Revenue Targets
- $500K MRR via pet wellness + dental membership
- $69.98/month per pet
- 4,026 households to hit target
- Menagerie OS is the platform

## Tools
- Twilio (SMS/voice campaigns)
- Five9 Analytics (call data analysis)
- Supabase (lead data, customer records)
- Netevia/Paynote/SeamlessChex (payment processing, reserve recovery)

## Quality
- All outputs: submit to VP via Supabase
- Lead scoring models: must include conversion probability + revenue estimate
- Campaign copy: A/B test minimum 2 variants
```

### ADMIN CLAUDE.md (Legal)
```
# REDMOND OS — ADMIN (LEGAL COMMAND)

## Identity
You are the legal defense and filing agent.
You research, draft, cite-check, and format federal court filings.

## Domain Lock
- Legal defense, filings, discovery: YOURS
- Engineering: NEVER. Escalate to CEO.
- Revenue: NEVER. Escalate to CEO.

## Active Cases
- US v. Redmond (24-cr-376) — Judge Schmehl, EDPA, Trial Sept 2026
- Bankruptcy (4:24-bk-13093-PMM) — Judge Mayer
- Berks County (25DR00324) — Judge Gavin (recusal filed)
- Montgomery County (2016-47715) — Judge Demchick-Alloy

## Prosecution Team (24-cr-376)
- AUSA David Metcalf (lead)
- AUSA Mary Crawley
- AUSA Samuel Dalke
- FBI SA Courtney Simmons (Franks target)
- Groff pled 12/16/25 (Giglio lane)

## Key Evidence
- Five9 data: 77.6% failed calls (Franks foundation)
- Malcolm Smith letter (Brady material)
- Client_Care_Evidence_Index.xlsx
- Victim_Carrier_Timeline_V2.xlsx
- 5 eras, 24 victims, 68+ products, 15+ carriers
- Carrier defense: Sok introduced every carrier, Redmond = fulfillment

## Filing Standards
- EDPA Local Rules
- 200-point dual scoring (170+ to file)
- Zero hallucinated citations
- Every cite verified against CourtListener

## Judge Profiles
- Schmehl: Obama 2013, Franks ~30% grant rate, pro se tolerant
- Mayer: Bankruptcy judge, adversary proceedings
- Gavin: Recusal motion filed (prior adverse representation)
- Demchick-Alloy: Custody judge, Montgomery County

## Tools
- CourtListener API (key: f22ede6af8adbbe2fb44004f58c2f5cd410b2e24)
- DocketBird API (key: eTnDWQVnyQSKes4xHoZrf50hCf)
- Everlaw (DB 75633, Project 110962)
- Westlaw/CoCounsel

## Quality
- ALL filings are RED zone. No auto-filing. Always pause for Alan.
- Citation format: Bluebook
- Every motion scored by VP before Alan reviews
```

---

## SECTION 11 — IMPLEMENTATION PLAN (Merged)

### TONIGHT — Session 1 (2.5 hours)

| # | Task | Machine | Time | Owner |
|---|------|---------|------|-------|
| 1 | Enable Remote Login on QUICKS + ADMIN. Test SSH. | All 3 | 15 min | Alan |
| 2 | Add SSH config to WORKHORSE ~/.ssh/config | WORKHORSE | 15 min | Alan |
| 3 | Run Supabase SQL migration (001_dispatch_system.sql) | Supabase | 5 min | Alan |
| 4 | Test Supabase connection from WORKHORSE | WORKHORSE | 5 min | Alan |
| 5 | Write WORKHORSE CLAUDE.md | WORKHORSE | 15 min | Claude Code |
| 6 | Write QUICKS CLAUDE.md | QUICKS | 10 min | Claude Code |
| 7 | Write ADMIN CLAUDE.md | ADMIN | 10 min | Claude Code |
| 8 | Install Portkey on all 3 Macs | All 3 | 30 min | Claude Code |
| 9 | Build Dispatcher CEO v1 (Node.js) | WORKHORSE | 30 min | Claude Code |
| 10 | Start VP Quality Gate process | WORKHORSE | 10 min | Claude Code |
| 11 | End-to-end test: iPad → Dispatch → decompose → SSH → result | All | 15 min | Alan |

### THIS WEEK — Sessions 2-4

| Session | Focus | Output | Time |
|---------|-------|--------|------|
| 2 | GITBrain Context Injector | Every routed task arrives with full context | 1 hr |
| 3 | Twilio notification connector | iPhone buzzes on complete/error/gate | 30 min |
| 4 | CourtListener + DocketBird MCPs on ADMIN | Live case data in legal sessions | 1 hr |

### NEXT WEEK — Sessions 5-7

| Session | Focus | Output | Time |
|---------|-------|--------|------|
| 5 | Dispatcher v2: mission templates, parallel routing, VP integration | Autonomous operation | 2 hr |
| 6 | Azure Blob MCP: read/write menageriesa36965 without rclone | Automated file pipeline | 1 hr |
| 7 | Legal Motion Pipeline: full 8-agent template with scoring loop | "Build me a Franks motion" → done in 3 hours | 2 hr |

---

## SECTION 12 — WHAT THIS LOOKS LIKE WHEN DONE

6am. iPad. You text Dispatcher:

> "Draft the Franks motion targeting Simmons. Use Five9 data showing 77.6% failed calls. Hit 90%+ quality."

Dispatcher decomposes into 8 tasks. RESEARCHER + FACT_COMPILER start immediately on ADMIN in parallel. RESEARCHER pulls case law from CourtListener — Franks v. Delaware, judge-specific Schmehl precedents. FACT_COMPILER builds the chronology from Five9 data and the evidence index.

15 minutes. Both done. Artifacts written to Supabase. VP scores research brief: 182/200. PASS.

DRAFTER fires on ADMIN. Receives research brief + fact chronology + Franks motion template + Schmehl judge profile. Produces 18-page draft.

CITE_CHECKER validates every citation. 2 pin cites off. Sends back with corrections.

ADVERSARY fires on WORKHORSE (different machine, different perspective). Writes AUSA Metcalf's opposition. Finds 3 weaknesses.

REVISER gets the draft + cite corrections + adversary attacks. Strengthens. Resubmits.

VP scores: 178/200. PASS.

FORMATTER produces EDPA-compliant PDF.

Your iPhone buzzes: "FRANKS-001 COMPLETE. 18 pages, 14 citations verified, scored 178/200. 2 items need your review. Dashboard link."

You review on iPad. Approve. Dispatcher pushes to GITBrain and pings Shannon.

2.5 hours. Not 7 days.

---

## SECTION 13 — FILES ALREADY BUILT AND PUSHED

**GitHub: github.com/alanredmond23-bit/claude-skills/redmond-os/**

| File | What It Does |
|------|-------------|
| sql/001_dispatch_system.sql | 6 Supabase tables, indexes, realtime, auto-timestamps |
| ceo/ceo.py | CEO Orchestrator v1 (Python — to be replaced with Node.js in Session 1) |
| vp/vp.py | VP Quality Gate with 200-point dual scoring |
| workers/SKILL.md | Protocol for any Claude instance to join the war room |
| setup.sh | One-command deploy on WORKHORSE |

**Artifact Delivered:**

| File | What It Does |
|------|-------------|
| redmond-os-dashboard.jsx | iPad war room dashboard, blueprint design, live Supabase polling |

---

## SECTION 14 — OPENCLAW LESSONS APPLIED

| OpenClaw Insight | Our Application |
|-----------------|-----------------|
| Single Node.js monolith beats microservices | Single Dispatcher process per machine. No Kubernetes, no Docker. |
| 4 primitive tools (Read, Write, Edit, Bash) | Same primitives via Claude Code CLI. Agent composes everything else. |
| Local compute over cloud APIs | All 3 Macs run locally. No cloud for core execution. |
| Model agnostic | Portkey routes to Claude/GPT/Gemini based on task. Models are commodities. |
| Skills system (SKILL.md) | CLAUDE.md per machine + worker SKILL.md = domain-specific skills. |
| Value in deployment topology, not model | 3-Mac topology with domain separation IS the moat. |

| OpenClaw Weakness | Our Fix |
|-------------------|---------|
| General purpose — no specialization | 3 machines with locked domains |
| 11.3% malicious skills | No marketplace. We write our own. |
| Single machine — no parallelism | 3 machines run parallel workstreams |
| No CEO layer | Dispatcher is the CEO |
| No quality gate | VP scores everything at 200-point scale |
| No monitoring dashboard | Supabase + React dashboard on iPad |

---

## BOTTOM LINE

One login. Three workers. One CEO. One VP. You on the couch with an iPad. iPhone buzzes when work is done. The staff knows what to do. You only get pulled in for RED zone decisions.

OpenAI paid $1B for this concept. We build it this week.
