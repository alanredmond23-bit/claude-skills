import { useState } from "react";

const ORG = {
  chairman: {
    name: "ALAN C. REDMOND",
    title: "Chairman",
    surface: "iPad + iPhone",
    tools: ["Dispatch/Cowork", "War Room Dashboard", "Slack (planned)", "Screen Sharing"],
    notes: "One command in. Approvals only. RED zone decisions. Reviews on iPad.",
  },
  departments: [
    {
      id: "coo",
      name: "COO / DISPATCHER",
      head: "DISPATCHER CEO",
      headTitle: "Chief Operating Officer",
      color: "#F59E0B",
      machine: "WORKHORSE",
      maturity: 40,
      description: "Decomposes commands, routes to departments via SSH, monitors progress, reports to Chairman. The central nervous system.",
      staff: [
        { name: "CEO DISPATCHER", role: "Decomposition + Routing", model: "Sonnet 4.6", status: "V1 BUILT (Python)", repo: "redmond-os/ceo/ceo.py" },
        { name: "VP QUALITY GATE", role: "200-point dual scoring, revision loops, RED zone enforcement", model: "Sonnet 4.6", status: "BUILT", repo: "redmond-os/vp/vp.py" },
        { name: "PORTKEY ROUTER", role: "Model selection, 429 fallback, cost optimization", model: "N/A (router)", status: "PLANNED", repo: null },
        { name: "TWILIO NOTIFIER", role: "SMS alerts on complete/error/gate", model: "N/A", status: "PLANNED", repo: null },
      ],
      repos: [
        { name: "redmond-os (in claude-skills)", purpose: "Dispatch tables, CEO, VP, worker protocol, dashboard", status: "ACTIVE" },
        { name: "claude-skills", purpose: "Canonical skills repo: prompt-refiner, multi-model-orchestrator, dispatch system", status: "ACTIVE" },
      ],
      products: ["REDMOND OS Dispatch System", "War Room iPad Dashboard"],
    },
    {
      id: "clo",
      name: "CLO / LEGAL DEPARTMENT",
      head: "CLO AGENT",
      headTitle: "Chief Legal Officer",
      color: "#EF4444",
      machine: "ADMIN",
      maturity: 70,
      description: "Most mature department. 12 agent definitions, 22 Python bot modules, 30 plan-pack architecture docs, 4 case-specific strategy folders, EDPA filing templates, quality floors (170/185/190).",
      staff: [
        { name: "CLO", role: "Chief Legal Officer. Case strategy, agent delegation, motion approval, cross-case coordination", model: "Opus 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/clo.yaml" },
        { name: "SOUNDING BOARD", role: "Advisory. Stress tests intake and strategy decisions", model: "Opus 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/sounding_board.yaml" },
        { name: "TRIAGE AGENT", role: "Intake routing, priority classification", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/triage_agent.yaml" },
        { name: "MOTION WRITER", role: "Drafts motions from research + facts + templates", model: "Opus 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/motion_writer.yaml" },
        { name: "CASE LAW RESEARCHER", role: "CourtListener + Westlaw + web search for precedent", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/researcher_case_law.yaml" },
        { name: "EVIDENCE RESEARCHER", role: "Five9 data, Malcolm Smith letter, exhibit analysis", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/researcher_evidence.yaml" },
        { name: "JUDGE RESEARCHER", role: "Schmehl/Mayer/Gavin/Demchick-Alloy profiling", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/researcher_judge.yaml" },
        { name: "OPPOSITION RESEARCHER", role: "Profiles Metcalf, Crawley, Dalke, Simmons", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/researcher_opposition.yaml" },
        { name: "FINANCIAL RESEARCHER", role: "Asset tracing, forfeiture analysis, reserve recovery support", model: "Haiku 4.5", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/researcher_financial.yaml" },
        { name: "JR. CRIMINAL", role: "Federal criminal specialist (24-cr-376)", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/junior_criminal.yaml" },
        { name: "JR. BANKRUPTCY", role: "Chapter 7 specialist (4:24-bk-13093)", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/junior_bankruptcy.yaml" },
        { name: "JR. CIVIL", role: "Family court + foreclosure + malpractice", model: "Sonnet 4.6", status: "YAML DEFINED", repo: "redmond-overlord-desktop/BRAIN/AGENTS/junior_civil.yaml" },
        { name: "DISCOVERY BOT", role: "Document classifier, entity extractor, keyword analyzer, privilege detector, timeline builder, embedding generator, batch processor (11 Python modules)", model: "Sonnet 4.6", status: "CODE BUILT", repo: "operation-freedom/legal-ai-terminal/agents/discovery-bot/" },
        { name: "STRATEGY BOT", role: "Argument generator, case law synthesizer, counter-argument, motion drafter, precedent analyzer, statute analyzer, westlaw research (11 Python modules)", model: "Opus 4.6", status: "CODE BUILT", repo: "operation-freedom/legal-ai-terminal/agents/strategy-bot/" },
      ],
      repos: [
        { name: "redmond-overlord-desktop", purpose: "Tauri War Room desktop app. BRAIN folder (12 agents, 4 case folders, 11 global playbooks, EDPA templates). 30 plan-pack docs. 35+ React components.", status: "ACTIVE -- primary legal UI" },
        { name: "operation-freedom", purpose: "Legal AI Terminal. Electron + React. 2 fully built Python bot systems (22 modules). 6 prompt modes. 6 skill files. Context injector.", status: "ACTIVE -- primary legal AI engine" },
        { name: "final-FBI-defensive-DOJ-strategy", purpose: "THE REDMOND DOCTRINE. Master strategic repo. Evidence-Forward Assembly v4, 10 Legends, 10 Game Changers, War Room JSX v1-v3, Gap Register (76 gaps).", status: "ACTIVE -- strategy vault" },
        { name: "30-days-to-the-win", purpose: "Motion pipeline. Brady/Giglio, Franks (Five9), Bill of Particulars, Faretta. Commander AI transcripts.", status: "ACTIVE -- filing sequence" },
        { name: "BILL-RUSH", purpose: "Rush malpractice track. 94 files. Demand letters, Cohn intake, forensic audit, Weir testimony.", status: "ACTIVE -- malpractice track" },
        { name: "rush-pa-legal-monorepo", purpose: "PA consolidated legal monorepo (Rush sanctions, bankruptcy).", status: "REFERENCE" },
        { name: "legal-vision-federal", purpose: "React/Vite legal visualization app.", status: "EARLY" },
        { name: "devy-bot-claude-cli", purpose: "Claude CLI domain configs: federal-defense, custody-alimony, commercial-litigation, involuntary-bankruptcy agent.md + style.md files.", status: "REFERENCE" },
      ],
      products: ["Redmond Overlord Desktop (War Room)", "Legal AI Terminal", "Motion Pipeline"],
      cases: [
        { name: "US v. Redmond (24-cr-376)", judge: "Schmehl", status: "Trial Sept 2026", zone: "RED" },
        { name: "Bankruptcy (4:24-bk-13093)", judge: "Mayer", status: "Chapter 7, adversary proceedings", zone: "RED" },
        { name: "Berks County (25DR00324)", judge: "Gavin (recusal filed)", status: "Family/support", zone: "YELLOW" },
        { name: "Montgomery County (2016-47715)", judge: "Demchick-Alloy", status: "Custody", zone: "YELLOW" },
        { name: "RF JV NPL Trust v. ARC Realty (25-13446)", judge: "TBD", status: "Foreclosure MSJ", zone: "RED" },
        { name: "Rush Malpractice", judge: "N/A", status: "Pre-filing (Cohn intake)", zone: "YELLOW" },
      ],
    },
    {
      id: "cfo",
      name: "CFO / FINANCE",
      head: "SHANNON KROEMMELBEIN",
      headTitle: "CFO / Operator",
      color: "#06B6D4",
      machine: "QUICKS (partial)",
      maturity: 15,
      description: "Human-operated. Shannon handles processor calls, bank operations, entity filings. No agent automation yet. Critical survival function.",
      staff: [
        { name: "Shannon", role: "Entity operator, bank signatory, processor contact, court filings", model: "HUMAN", status: "ACTIVE", repo: null },
        { name: "CFO AGENT (planned)", role: "Cash flow tracking, reserve recovery automation, payment scheduling", model: "Sonnet 4.6", status: "NOT BUILT", repo: null },
      ],
      repos: [],
      products: [],
      accounts: [
        { name: "PNC Personal", detail: "Routing 043000096, Acct 5015864269. Alan's personal.", status: "ACTIVE" },
        { name: "Found ABN", detail: "FROZEN. Now CLOSED per Alan.", status: "CLOSED" },
        { name: "Found DPC", detail: "FROZEN. Now CLOSED per Alan.", status: "CLOSED" },
        { name: "TD/M&T Business (planned)", detail: "ABN business checking for processor wires", status: "PENDING" },
      ],
      reserves: [
        { name: "Paynote/SeamlessChex", amount: "$19,865", ticket: "#1660604", status: "10+ months held, FTC/CFPB complaint eligible" },
        { name: "Netevia", amount: "Partial released", ticket: "#650376", status: "Some recovered" },
        { name: "Maverick", amount: "~$20K", ticket: null, status: "Bank change needed" },
        { name: "Nexio", amount: "Unknown", ticket: null, status: "MID 923501818217639" },
        { name: "PayArc (x2)", amount: "Unknown", ticket: null, status: "Two ABN accounts" },
      ],
      assets: [
        { name: "Bentley", detail: "~$40K behind on payments" },
        { name: "Black Mercedes", detail: "$37K remaining" },
        { name: "White Mercedes", detail: "$36K remaining" },
        { name: "Diamond Ring", detail: "Appraised $225K. Selling channels researched Nov 2025." },
        { name: "4 Properties", detail: "Federal lis pendens blocks sale until case resolution" },
      ],
    },
    {
      id: "cro",
      name: "CRO / REVENUE",
      head: "REVENUE COMMANDER",
      headTitle: "Chief Revenue Officer",
      color: "#10B981",
      machine: "QUICKS",
      maturity: 15,
      description: "Products specced but no pipeline running. 531K leads purchased. Twilio closer bot designed. Revenue target: $500K MRR.",
      staff: [
        { name: "CLOSER BOT", role: "AI sales closer via Twilio SMS/Voice. Multi-channel outreach.", model: "Sonnet 4.6", status: "UI BUILT, not deployed", repo: "Twilio-closer-bot-and-brain" },
        { name: "LEAD VALIDATOR", role: "Lead scoring, dedup, enrichment", model: "Haiku 4.5", status: "PLANNED", repo: "LEAD_VALIDATION" },
        { name: "FIVE9 ANALYST", role: "Call data analysis, conversion tracking", model: "Sonnet 4.6", status: "DATA READY (1.18M files)", repo: null },
      ],
      repos: [
        { name: "pet-product-repo", purpose: "Menagerie OS product dossier (10 parts, 50K+ words), financial model, investor deck, 96-source research CSV, marketing.", status: "ACTIVE -- product bible" },
        { name: "final-lead-faucet-2027", purpose: "Lead pipeline + chat extractor (broken Playwright scraper).", status: "ACTIVE" },
        { name: "Twilio-closer-bot-and-brain", purpose: "Twilio Connect UI (Next.js/Vite), implementation roadmap, master execution plan.", status: "UI BUILT" },
        { name: "LEAD_VALIDATION", purpose: "Lead validation system.", status: "EARLY" },
      ],
      products: [
        { name: "Menagerie OS (Pet Wellness)", detail: "Non-insurance membership. $69.98/mo per pet. 4,026 households to $500K MRR. B2B through vet clinics. 531K purchased leads.", maturity: 25 },
        { name: "Dental Perks", detail: "Dental membership platform. Concept only.", maturity: 5 },
        { name: "LIL RED", detail: "TypingMind competitor (141K monthly users). Competitive analysis done. No code.", maturity: 10 },
      ],
    },
    {
      id: "cto",
      name: "CTO / ENGINEERING",
      head: "ARCHITECT",
      headTitle: "Chief Technology Officer",
      color: "#3B82F6",
      machine: "WORKHORSE + AZURE VM",
      maturity: 45,
      description: "Infrastructure specced and partially deployed. Azure VM architecture ready. 3-Mac fleet configured. CLAUDEQUAD4 in beta. Multiple UI attempts being consolidated into Tori.",
      staff: [
        { name: "INFRA AGENT (AG-1)", role: "VM, Nginx, systemd, TLS, firewall", model: "Sonnet 4.6", status: "SPECCED", repo: "redmond-overlord" },
        { name: "DATABASE AGENT (AG-2)", role: "PostgreSQL, pgvector, PgBouncer, Redis, backup cron", model: "Sonnet 4.6", status: "SPECCED", repo: "redmond-overlord" },
        { name: "API AGENT (AG-3)", role: "FastAPI 13 endpoints, Redis cache, SSE streaming", model: "Sonnet 4.6", status: "SPECCED", repo: "redmond-overlord" },
        { name: "STORAGE AGENT (AG-4)", role: "Azure Blob SAS, AI Search index, upload/download", model: "Sonnet 4.6", status: "SPECCED", repo: "redmond-overlord" },
        { name: "AI AGENT (AG-5)", role: "Azure OpenAI streaming, embeddings, chunker, RAG", model: "Sonnet 4.6", status: "SPECCED", repo: "redmond-overlord" },
        { name: "PROMPT REFINER", role: "UserPromptSubmit hook. 10-dimension scoring, 16 frameworks, 5 goals, domain auto-detection. Haiku at $0.001/prompt. refiner.py + scorer.py.", model: "Haiku 4.5", status: "CODE BUILT", repo: "claude-skills/prompt-refiner/" },
        { name: "MULTI-MODEL ORCHESTRATOR", role: "Async fan-out to Grok/Gemini/GPT-4o/Opus. TF-IDF cosine consensus scoring, outlier detection, ReportLab PDF reports. $0.047/4-model query.", model: "Multi-model", status: "SPEC BUILT", repo: "claude-skills/multi-model-orchestrator/" },
        { name: "BULK INTERVIEW", role: "Python interview tool with JSON question sets (drive-organization, legal-intake). Batch data collection.", model: "Sonnet 4.6", status: "CODE BUILT", repo: "claude-skills/bulk-interview/" },
        { name: "HANDWRITING OCR", role: "Handwriting recognition system for scanned legal documents and notes.", model: "Vision", status: "SPEC ONLY", repo: "claude-skills/handwriting-ocr/" },
        { name: "CONSUMER GROUP TEST", role: "500 questions, 10 personas, competitive comparison MCP server. TypeScript.", model: "Multi-model", status: "CODE BUILT", repo: "CLAUDEQUAD4/consumer-group-test/" },
      ],
      repos: [
        { name: "redmond-overlord", purpose: "Azure VM master plan. D4s_v5, FastAPI+Nginx+PostgreSQL+Redis. Tori architecture. 6-agent swarm. CLAUDE.md.", status: "ACTIVE -- infra bible" },
        { name: "CLAUDEQUAD4", purpose: "Native macOS SwiftUI. 2x2 terminal grid, PTY, orchestration modes, session manager, consumer group test MCP.", status: "BETA" },
        { name: "joanna-decision-engines", purpose: "Meta Agent platform on LibreChat. 16 features: extended thinking, deep research, image/video gen, voice, computer use, visual workflows, scheduled tasks, Google Workspace, VS Code ext. 17 Supabase schema files. Desktop Electron app.", status: "ACTIVE -- platform replacement" },
        { name: "supavisualizer-lonewolf", purpose: "Premium liquid-glass Supabase schema visualizer. Tauri + Next.js. AI assistant, schema diff, RLS generator.", status: "ACTIVE -- dev tool" },
        { name: "wolf", purpose: "RunPod to Supabase lightning transfer CLI. Go. S3-compatible upload.", status: "ACTIVE -- data tool" },
        { name: "IDE-Red", purpose: "CI/CD workflows, deployment gates, health checks, monetization roadmap.", status: "REFERENCE" },
      ],
      products: [
        { name: "Tori", detail: "Next.js dashboard replacing all Azure native dashboards. Calendar, War Room, Evidence Explorer, Queue, Settings. Redmond Blueprint design.", maturity: 15 },
        { name: "CLAUDEQUAD4", detail: "Native macOS multi-terminal for parallel Claude sessions.", maturity: 60 },
        { name: "Joanna / Meta Agent", detail: "Full AI platform on LibreChat with 16 features. The claude.ai replacement.", maturity: 35 },
        { name: "Claude TUI", detail: "Python/Textual terminal UI replicating claude.ai. 8 files, SQLite.", maturity: 70 },
        { name: "SupaVisualizer", detail: "Tauri schema visualizer for Supabase databases.", maturity: 50 },
      ],
    },
    {
      id: "cio",
      name: "CIO / INTELLIGENCE",
      head: "INTELLIGENCE DIRECTOR",
      headTitle: "Chief Intelligence Officer",
      color: "#8B5CF6",
      machine: "ALL MACHINES",
      maturity: 50,
      description: "The AI brain. Hoffman Memory System (114 tests passing, MCP server built), ORACLE+APEX prediction engine (27 Python modules, working code), CRAYOL language (95% token reduction), GITBrain knowledge graph (6 domains, 27 subdomains), Extractions pipeline (9 tables, 5 views). Coyote Hyperloop OS designed but not built.",
      staff: [
        { name: "HOFFMAN ENGINE", role: "Bio-inspired 4-tier memory. Spatial index (Nutcracker), distributed modules (Octopus), identity-weighted recall (Dolphin), matriarchal knowledge chain (Elephant), snapshot buffer (Chimp), threat-tagged memory (Crow). MCP server with 9 tools.", model: "Any (via MCP)", status: "CODE BUILT (11 modules, 114 tests)", repo: "MEMORY-TEARS-FOR-FEARS-NOW" },
        { name: "CRAYOL COMPILER", role: "Inter-agent language. CRAYOL-MEM (65% memory compression), CRAYOL-CODE (74% token reduction), Control Token Signal Layer (50 signals, 7 categories).", model: "N/A (language layer)", status: "SPECCED + PARTIAL CODE", repo: "MEMORY-TEARS-FOR-FEARS-NOW/src/crayol_*.py" },
        { name: "BELLA INTERPRETER", role: "Belfast-dialect AI language. Natural language commands → structured operations.", model: "N/A (transpiler)", status: "SPECCED", repo: "MEMORY-TEARS-FOR-FEARS-NOW/src/bella.py" },
        { name: "ORACLE ENGINE", role: "6-layer prediction: superforecaster ensemble, swarm simulation, Monte Carlo/Bayesian, game theory (Nash/Stackelberg), prediction markets (Polymarket/Metaculus), APEX synthesis.", model: "Multi-model fan-out", status: "CODE BUILT (27 modules)", repo: "predictibility-cartridge" },
        { name: "APEX SCORER", role: "Novel scoring replacing Brier score. 7 attack vectors: asymmetric, conformal, decision-theoretic, information-theoretic, stochastic dominance, trajectory, Wasserstein.", model: "N/A (math engine)", status: "CODE BUILT", repo: "predictibility-cartridge/src/oracle/scoring/" },
        { name: "GITBRAIN CURATOR", role: "Knowledge graph. 6 domains, 27 subdomains. SKILL v2.0: onboarding interview, multi-stream detection, 7 breakthrough types, divergence trees, ANALYSIS.md reports. 119 conversations indexed.", model: "Sonnet 4.6", status: "ACTIVE", repo: "GITBrain" },
        { name: "EXTRACTOR", role: "Conversation intelligence pipeline. 12-layer analysis per conversation. SQLite (9 tables, 5 views). EXTRACTOR_PROMPT.md. People registry (50+), elevated concepts (12 L4 universals), unfinished business (30 items).", model: "Sonnet 4.6", status: "SCHEMA BUILT", repo: "extractions" },
        { name: "NOCTURNAL ENGINE", role: "Idle-time training. 5 phases: REPLAY, PRUNE, REINFORCE, REORGANIZE, TEST. Modeled on mammalian sleep consolidation.", model: "N/A (background process)", status: "CODE BUILT", repo: "MEMORY-TEARS-FOR-FEARS-NOW/src/nocturnal_consolidation_engine.py" },
        { name: "BELFAST STT", role: "Dialect interpretation layer. 2000+ word bank, phonetic rules (TH-stopping, vowel backing, HRT), Apple SFSpeechRecognizer en-IE locale config, Control Token integration. BELFAST_DIALECT.md for MASTER_RULES.", model: "N/A (filter layer)", status: "SPEC BUILT", repo: "MASTER_RULES/BELFAST_DIALECT.md" },
        { name: "THE SCOUT", role: "Central email filing cabinet. SQLite + MBOX ingester + IMAP daemon for 6 Gmail accounts + 400-500 GoDaddy mailboxes. IDLE push, content dedup, auto-classification. Runs 24/7 on ADMIN.", model: "Haiku 4.5", status: "CODE BUILT", repo: "GITBrain (PRODUCT/SCOUT)" },
        { name: "GMAIL DISCOVERY", role: "AI-powered eDiscovery. Organization engine (4 templates), configurable YAML, custodian-based folder creation.", model: "Sonnet 4.6", status: "CODE BUILT", repo: "gmail-discovery-platform" },
        { name: "GMAIL INTELLIGENCE", role: "Purpose-driven semantic email extraction. AI analysis, sentiment, entity extraction, privilege detection, History API sync.", model: "Sonnet 4.6", status: "CODE BUILT", repo: "gmail-intelligence-platform" },
      ],
      repos: [
        { name: "MEMORY-TEARS-FOR-FEARS-NOW", purpose: "Hoffman Memory System. 11 Python modules, MCP server (9 tools), 114 tests, 81 real knowledge vectors loaded, deploy scripts for Azure + ANVIL.", status: "ACTIVE -- memory engine" },
        { name: "predictibility-cartridge", purpose: "ORACLE+APEX v2. 27 Python modules across 6 layers + scoring attacks. Working Polymarket/Metaculus clients. Docker-compose (Neo4j+Ollama+API). SIBYL/REDMOND framework. CRAYOL protocol docs.", status: "ACTIVE -- prediction engine" },
        { name: "GITBrain", purpose: "Externalized AI memory. 6 domains (LEGAL/PRODUCT/ENGINEERING/BUSINESS/STRATEGY/PERSONAL), 27 subdomains. SKILL v2.0. Master index of 119 conversations.", status: "ACTIVE -- knowledge graph" },
        { name: "extractions", purpose: "Conversation intelligence. Per-conversation 12-layer extraction. SQLite schema (9 tables, 5 views). EXTRACTOR_PROMPT.md, ingest.py, ELEVATED_CONCEPTS (12 L4 universals, 10 L3 cross-domain).", status: "ACTIVE -- intelligence pipeline" },
        { name: "gmail-discovery-platform", purpose: "AI-powered eDiscovery with organization engine (4 templates), custodian workflows, configurable YAML.", status: "ACTIVE -- email discovery" },
        { name: "gmail-intelligence-platform", purpose: "Purpose-driven semantic email extraction. AI analysis, sentiment, entity extraction, privilege detection, History API sync.", status: "ACTIVE -- email intelligence" },
      ],
      products: [
        { name: "Coyote Hyperloop OS", detail: "4 engines: COMPASS (goals), MACHINE (systems), RADAR (external intel), FORGE (overnight autoresearch). 9 agents (SCOUT through DEPLOYER). 12-min daily video briefing output. Einstein Creativity Framework for cross-domain invention.", maturity: 15 },
        { name: "SIBYL", detail: "Systematic Intelligence for Behavioral Yield and Likelihood. ORACLE + REDMOND defense unified. DRI = APEX x P where P = 1 - [Ui + Ua + Ue + Ud].", maturity: 30 },
        { name: "Prometheus Engine", detail: "10-layer meta-cognitive architecture. 5 functions: CLASSIFY, SELECT, DISPATCH, CROSS-REFERENCE, INVENT. Sub-skills: Framework Maker, Torchlight, Fine Print.", maturity: 25 },
      ],
      frameworks: [
        { name: "REDMOND EQUATION", formula: "P = 1 - [Ui + Ua + Ue + Ud]", description: "47 source frameworks, 48 gap-closing methods, 23 prediction frameworks for 5 actors" },
        { name: "TORCH GRID / OLYMPIC TORCH", formula: "8 activation regions, 5 phases", description: "Motion-specific prompt engineering with temperature settings" },
        { name: "VS PROTOCOL", formula: "5 categories x domain anchoring", description: "Verbalized Sampling: CONSERVATIVE, AGGRESSIVE, CONTRARIAN, TACTICAL, STRATEGIC" },
        { name: "12 L4 UNIVERSALS", formula: null, description: "Institutional Momentum, Arithmetic Before Rhetoric, Silence Doctrine, Constraint Stacking, Edge vs Centroid, Feedback Cache Loop, Right-to-Left Build, Black Hole Ingestion, Selective Prediction Gating, Weight Activation Multiplier, Elon Algorithm" },
      ],
    },
    {
      id: "cmo",
      name: "CMO / MARKETING",
      head: "MARKETING COMMANDER",
      headTitle: "Chief Marketing Officer",
      color: "#EC4899",
      machine: "QUICKS",
      maturity: 5,
      description: "Almost nothing built. Gates on CRO having a product to sell and CFO having cash for ad spend.",
      staff: [
        { name: "COPYWRITER (planned)", role: "Landing pages, email sequences, ad copy", model: "Sonnet 4.6", status: "NOT BUILT", repo: null },
        { name: "CAMPAIGN MANAGER (planned)", role: "A/B test variants, conversion tracking, funnel optimization", model: "Haiku 4.5", status: "NOT BUILT", repo: null },
      ],
      repos: [],
      products: [],
    },
  ],
  infrastructure: {
    machines: [
      { name: "WORKHORSE", role: "CEO + Builder", os: "macOS, M1 MacBook Pro 16GB", always_on: true, dispatch_paired: true },
      { name: "QUICKS", role: "Revenue Worker", os: "macOS, M1 MacBook Pro 16GB", always_on: true, dispatch_paired: false, note: "Battery issues" },
      { name: "ADMIN", role: "Legal Command", os: "macOS, M1 MacBook Pro 16GB", always_on: true, dispatch_paired: false },
      { name: "AZURE VM", role: "Cloud API + Database", os: "Ubuntu 24.04, D4s_v5 (4 vCPU, 16GB)", always_on: true, dispatch_paired: false },
      { name: "iPAD", role: "Chairman Interface", os: "iPadOS", always_on: false, dispatch_paired: true },
    ],
    azure: [
      { service: "SQL Database", name: "menagerie-sql", detail: "PostgreSQL 16, westus2, free tier" },
      { service: "Blob Storage", name: "menageriesa36965", detail: "Primary file backend, ~200GB migrating" },
      { service: "AI Search", name: "menagerie-search-37161", detail: "Integrated vectorization, semantic ranking, ~$75/mo" },
      { service: "Key Vault", name: "menagerie-kv-37040", detail: "Secrets management" },
      { service: "Communication Services", name: "menagerie-comms-37184", detail: "Email/SMS" },
      { service: "DevOps", name: "shannykelly23/Menagerie", detail: "CI/CD, repos mirror" },
    ],
    models: [
      { provider: "Anthropic", tier: "Tier 3", models: "Opus 4.6 ($5/$25), Sonnet 4.6 ($3/$15), Haiku 4.5 ($1/$5)", rpm: "2,000 RPM, 800K ITPM" },
      { provider: "OpenAI", tier: "Active", models: "GPT-4o, GPT-4o-mini", rpm: "Code fallback" },
      { provider: "Google", tier: "Active", models: "Gemini Flash, Gemini 1.5 Pro", rpm: "Data + long context" },
      { provider: "Groq", tier: "Active", models: "Llama 70B @ ~250 tok/sec", rpm: "Fast routing decisions" },
      { provider: "Cerebras", tier: "Planned", models: "Llama 70B @ 3,000 tok/sec", rpm: "Bulk GREEN zone" },
      { provider: "OpenRouter", tier: "Active", models: "All models via single API", rpm: "Catch-all failover" },
      { provider: "RunPod", tier: "Available", models: "Self-hosted GPU cluster", rpm: "Sustained throughput" },
    ],
  },
};

function MaturityBar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 6, backgroundColor: "#1E293B", borderRadius: 3 }}>
        <div style={{ width: `${value}%`, height: "100%", backgroundColor: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color, fontWeight: 700 }}>{value}%</span>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    "ACTIVE": "#10B981", "CODE BUILT": "#10B981", "BUILT": "#10B981", "HUMAN": "#3B82F6",
    "YAML DEFINED": "#F59E0B", "SPECCED": "#F59E0B", "BETA": "#F59E0B", "UI BUILT": "#F59E0B",
    "SCHEMA BUILT": "#F59E0B", "V1 BUILT (Python)": "#F59E0B", "EARLY": "#F59E0B",
    "PLANNED": "#64748B", "NOT BUILT": "#64748B", "REFERENCE": "#64748B",
    "CLOSED": "#EF4444", "PENDING": "#F59E0B",
    "SPECCED + PARTIAL CODE": "#F59E0B", "DATA READY (1.18M files)": "#F59E0B",
    "UI BUILT, not deployed": "#F59E0B", "CODE BUILT (11 modules, 114 tests)": "#10B981",
    "CODE BUILT (27 modules)": "#10B981", "ACTIVE -- primary legal UI": "#10B981",
  };
  const c = Object.entries(colors).find(([k]) => status.includes(k));
  return <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: c ? c[1] : "#64748B", marginRight: 6 }} />;
}

function DeptCard({ dept, expanded, onToggle }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={onToggle} style={{
        backgroundColor: "#1E293B", border: `1px solid ${dept.color}`, borderLeft: `4px solid ${dept.color}`,
        borderRadius: 4, padding: "12px 16px", cursor: "pointer",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, color: dept.color, letterSpacing: 2 }}>{dept.name}</span>
              <span style={{ fontSize: 10, color: "#64748B", fontFamily: "JetBrains Mono, monospace", backgroundColor: "#0F172A", padding: "1px 6px", borderRadius: 2 }}>{dept.machine}</span>
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{dept.head} -- {dept.headTitle}</div>
            <MaturityBar value={dept.maturity} color={dept.color} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#64748B" }}>
              {dept.staff.length} agents | {dept.repos.length} repos
            </div>
            <span style={{ color: "#475569", fontSize: 18 }}>{expanded ? "−" : "+"}</span>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ backgroundColor: "#0F172A", border: `1px solid ${dept.color}20`, borderTop: "none", borderRadius: "0 0 4px 4px", padding: 12 }}>
          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12, lineHeight: 1.5 }}>{dept.description}</div>

          {dept.staff.length > 0 && (
            <>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: dept.color, letterSpacing: 3, marginBottom: 6 }}>STAFF ({dept.staff.length})</div>
              {dept.staff.map((s, i) => (
                <div key={i} style={{ padding: "6px 8px", marginBottom: 3, backgroundColor: "#1E293B", borderRadius: 3, borderLeft: `2px solid ${dept.color}40` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "#E2E8F0" }}>
                      <StatusDot status={s.status} />{s.name}
                    </span>
                    <span style={{ fontSize: 9, color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>{s.model}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{s.role}</div>
                  {s.repo && <div style={{ fontSize: 9, color: "#475569", marginTop: 2, fontFamily: "JetBrains Mono, monospace" }}>{s.repo}</div>}
                </div>
              ))}
            </>
          )}

          {dept.repos.length > 0 && (
            <>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: dept.color, letterSpacing: 3, marginTop: 12, marginBottom: 6 }}>REPOS ({dept.repos.length})</div>
              {dept.repos.map((r, i) => (
                <div key={i} style={{ fontSize: 10, color: "#CBD5E1", padding: "4px 8px", marginBottom: 2, backgroundColor: "#1E293B", borderRadius: 2 }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{r.name}</span>
                  <span style={{ color: "#64748B", marginLeft: 6 }}>{r.purpose}</span>
                </div>
              ))}
            </>
          )}

          {dept.cases && (
            <>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: dept.color, letterSpacing: 3, marginTop: 12, marginBottom: 6 }}>ACTIVE CASES ({dept.cases.length})</div>
              {dept.cases.map((c, i) => (
                <div key={i} style={{ fontSize: 10, color: "#CBD5E1", padding: "4px 8px", marginBottom: 2, backgroundColor: "#1E293B", borderRadius: 2, display: "flex", justifyContent: "space-between" }}>
                  <span>{c.name} -- Judge {c.judge}</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: c.zone === "RED" ? "#EF4444" : "#F59E0B" }}>{c.zone} | {c.status}</span>
                </div>
              ))}
            </>
          )}

          {dept.reserves && (
            <>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: dept.color, letterSpacing: 3, marginTop: 12, marginBottom: 6 }}>RESERVE RECOVERY TARGETS</div>
              {dept.reserves.map((r, i) => (
                <div key={i} style={{ fontSize: 10, color: "#CBD5E1", padding: "4px 8px", marginBottom: 2, backgroundColor: "#1E293B", borderRadius: 2, display: "flex", justifyContent: "space-between" }}>
                  <span>{r.name}: {r.amount}</span>
                  <span style={{ color: "#64748B", fontSize: 9 }}>{r.status}</span>
                </div>
              ))}
            </>
          )}

          {dept.assets && (
            <>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: dept.color, letterSpacing: 3, marginTop: 12, marginBottom: 6 }}>ASSETS TO LIQUIDATE</div>
              {dept.assets.map((a, i) => (
                <div key={i} style={{ fontSize: 10, color: "#CBD5E1", padding: "4px 8px", marginBottom: 2, backgroundColor: "#1E293B", borderRadius: 2 }}>
                  {a.name}: {a.detail}
                </div>
              ))}
            </>
          )}

          {dept.products && dept.products.length > 0 && (
            <>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: dept.color, letterSpacing: 3, marginTop: 12, marginBottom: 6 }}>PRODUCTS</div>
              {dept.products.map((p, i) => {
                const prod = typeof p === "string" ? { name: p } : p;
                return (
                  <div key={i} style={{ fontSize: 10, color: "#CBD5E1", padding: "4px 8px", marginBottom: 2, backgroundColor: "#1E293B", borderRadius: 2 }}>
                    <span style={{ fontWeight: 700 }}>{prod.name}</span>
                    {prod.detail && <span style={{ color: "#64748B", marginLeft: 6 }}>{prod.detail}</span>}
                    {prod.maturity !== undefined && <MaturityBar value={prod.maturity} color={dept.color} />}
                  </div>
                );
              })}
            </>
          )}

          {dept.frameworks && (
            <>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: dept.color, letterSpacing: 3, marginTop: 12, marginBottom: 6 }}>FRAMEWORKS</div>
              {dept.frameworks.map((f, i) => (
                <div key={i} style={{ fontSize: 10, color: "#CBD5E1", padding: "4px 8px", marginBottom: 2, backgroundColor: "#1E293B", borderRadius: 2 }}>
                  <span style={{ fontWeight: 700, color: "#E2E8F0" }}>{f.name}</span>
                  {f.formula && <span style={{ fontFamily: "JetBrains Mono, monospace", color: dept.color, marginLeft: 6, fontSize: 9 }}>{f.formula}</span>}
                  <div style={{ color: "#64748B", marginTop: 2, fontSize: 9 }}>{f.description}</div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [expanded, setExpanded] = useState({ clo: false, cio: false });
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const totalAgents = ORG.departments.reduce((s, d) => s + d.staff.length, 0);
  const totalRepos = ORG.departments.reduce((s, d) => s + d.repos.length, 0);
  const avgMaturity = Math.round(ORG.departments.reduce((s, d) => s + d.maturity, 0) / ORG.departments.length);

  return (
    <div style={{
      backgroundColor: "#050810", minHeight: "100vh", padding: 16, fontFamily: "Inter, sans-serif",
      backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)",
      backgroundSize: "100px 100px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#64748B", letterSpacing: 4 }}>DIGITAL PRINCIPLES CORP</div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 22, fontWeight: 700, color: "#3B82F6", letterSpacing: 6, marginTop: 4 }}>REDMOND OS</div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
          {totalAgents} agents | {totalRepos} repos | {avgMaturity}% avg maturity | 67 repos total
        </div>
      </div>

      <div style={{
        backgroundColor: "#1E293B", border: "1px solid #F59E0B", borderRadius: 4, padding: 12, marginBottom: 12, textAlign: "center",
      }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700, color: "#F59E0B", letterSpacing: 2 }}>
          {ORG.chairman.name}
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>{ORG.chairman.title} | {ORG.chairman.surface}</div>
        <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>{ORG.chairman.notes}</div>
      </div>

      {ORG.departments.map(dept => (
        <DeptCard key={dept.id} dept={dept} expanded={!!expanded[dept.id]} onToggle={() => toggle(dept.id)} />
      ))}

      <div style={{ marginTop: 12, padding: 10, backgroundColor: "#0F172A", borderRadius: 4, border: "1px solid #1E293B" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#3B82F6", letterSpacing: 3, marginBottom: 6 }}>INFRASTRUCTURE</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 4 }}>
          {ORG.infrastructure.machines.map((m, i) => (
            <div key={i} style={{ backgroundColor: "#1E293B", borderRadius: 3, padding: "6px 8px", fontSize: 10 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "#E2E8F0", fontSize: 11 }}>{m.name}</div>
              <div style={{ color: "#64748B" }}>{m.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
