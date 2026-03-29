import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// REDMOND DOCTRINE — CREATION PLAN
// Extracted from 4 conversations | March 28, 2026
// US v. Redmond, EDPA 5:24-cr-376 | Trial: September 14, 2026
// VERDICT: Strategy 95% | Execution 0%
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#050810", card: "#1E293B", cardAlt: "#0F172A",
  blue: "#3B82F6", cyan: "#06B6D4", green: "#10B981",
  amber: "#F59E0B", red: "#EF4444", purple: "#8B5CF6",
  text: "#E2E8F0", dim: "#64748B",
  border: "rgba(100,116,139,0.15)",
};

const TRIAL_DATE = new Date("2026-09-14T09:00:00-04:00");
const daysLeft = () => Math.ceil((TRIAL_DATE - new Date()) / 86400000);

// ═══════════════════════════════════════════════════════════════
// SECTION A: WHAT WAS BUILT (across all 4 conversations)
// ═══════════════════════════════════════════════════════════════
const BUILT = [
  { item: "Master Plan v1 PDF", pages: 21, sections: 18, conv: "Over", status: "SUPERSEDED" },
  { item: "Master Plan v3 PDF", pages: 69, sections: 25, conv: "Call analysis", status: "CURRENT" },
  { item: "Rocket Manual PPTX", pages: 15, sections: null, conv: "Over", status: "SUPERSEDED" },
  { item: "Blueprint HTML", pages: null, sections: 7, conv: "Over", status: "CURRENT" },
  { item: "Design System CSS", pages: null, sections: 10, conv: "Over", status: "CURRENT" },
  { item: "War Room v1 (brain.jsx)", pages: null, sections: 5, conv: "Over", status: "SUPERSEDED" },
  { item: "War Room v2 JSX", pages: null, sections: 6, conv: "Over", status: "SUPERSEDED" },
  { item: "War Room v3.1 JSX", pages: null, sections: 8, conv: "Done2", status: "CURRENT" },
  { item: "Gap Register v2 XLSX", pages: null, sections: 6, conv: "Over", status: "CURRENT" },
  { item: "Enhanced Handoff v2 MD", pages: null, sections: 11, conv: "Done2", status: "CURRENT" },
  { item: "BUXTON_FINAL_BELFAST.md", pages: null, sections: null, conv: "Axelrod", status: "CURRENT" },
  { item: "AXELROD_EMILIA_DOCKET.xlsx", pages: null, sections: 5, conv: "Axelrod", status: "CURRENT" },
  { item: "PROSECUTION_PROFILE.pdf", pages: 2, sections: null, conv: "Axelrod", status: "CURRENT" },
  { item: "CRAWLEY_DALKE_CASE_LIST.xlsx", pages: null, sections: 8, conv: "Axelrod", status: "CURRENT" },
  { item: "ALL_77_TABLES_MASTER.xlsx", pages: null, sections: null, conv: "Axelrod", status: "CURRENT" },
  { item: "AZURE_SCHEMA_AXELROD.xlsx", pages: null, sections: 26, conv: "Axelrod", status: "CURRENT" },
  { item: "AXELROD_UNIVERSE_FINAL.xlsx", pages: null, sections: 32, conv: "Axelrod", status: "CURRENT" },
  { item: "Thinking Traces (3 sessions)", pages: null, sections: null, conv: "Multiple", status: "PUSHED" },
  { item: "whats-missing/ folder (5 files)", pages: null, sections: null, conv: "Done2", status: "PUSHED" },
  { item: "Complete Register CSV", pages: null, sections: 8, conv: "Over", status: "CURRENT" },
];

// ═══════════════════════════════════════════════════════════════
// SECTION B: WHAT NEEDS TO BE CREATED (extracted from tail ends)
// ═══════════════════════════════════════════════════════════════
const TO_CREATE = [
  // FROM HANDOFF P0
  { id: "C01", item: "Run 30 sweep queries", source: "Handoff P0 #1", time: "1 hr", priority: "P0", zone: "GREEN", status: "NOT STARTED", detail: "30 semantic searches from gap register Tab 2. Revenue, experts, custody, foreclosure, Walsh/Barrera, per-count elements, congressional, motion drafts already written.", blocker: null },
  { id: "C02", item: "Master Plan v2 PDF (60-80 pages)", source: "Handoff P0 #2", time: "2 hr", priority: "P0", zone: "YELLOW", status: "PARTIALLY DONE", detail: "v1 (21p) exists. v3 (69p) from Call Analysis session exists. Need: merge v3 + all 76 gaps + 7 new sections (S19-S25) + design system + war room spec. WARNING: >2hr task.", blocker: "v3 may already satisfy this. VERIFY before rebuilding." },
  { id: "C03", item: "War Room v3 JSX with sidebar", source: "Handoff P0 #3", time: "DONE", priority: "DONE", zone: "GREEN", status: "COMPLETE", detail: "Built in Done2 session. v3.1, 1,556 lines, 115KB, all 18 gaps patched, pushed to repo.", blocker: null },

  // FROM HANDOFF P1
  { id: "C04", item: "Final merged PDF (all artifacts)", source: "Handoff P1 #4", time: "30 min", priority: "P1", zone: "YELLOW", status: "NOT STARTED", detail: "Master Plan v2/v3 + Blueprint + War Room Spec + Design System. Single document for counsel handoff.", blocker: "Depends on C02 resolution." },
  { id: "C05", item: "Simmons cross-exam script", source: "Handoff P1 #5", time: "30 min", priority: "P1", zone: "RED", status: "FRAMEWORK EXISTS", detail: "3 phases: AOPC destruction (S-01 to S-05), Five9 ambush (S-06 to S-09), close. Framework in Complete Register Tab 8. Needs full buildout with exhibit references.", blocker: "Need Simmons prior affidavits for template detection comparison." },
  { id: "C06", item: "Junior agent cross-exam script", source: "Handoff P1 #6", time: "30 min", priority: "P1", zone: "RED", status: "FRAMEWORK EXISTS", detail: "Handshake extraction. 7 questions in Complete Register Tab 8 (J-01 to J-07). Agent IDs unknown. Needs adaptation once specific agent identified.", blocker: "Agent IDs from discovery request." },
  { id: "C07", item: "Discovery request (law enforcement at May 8)", source: "Handoff P1 #7", time: "30 min", priority: "P1", zone: "RED", status: "NOT STARTED", detail: "Request identities of all law enforcement present at May 8, 2025 superseding hearing. This unlocks handshake witness IDs.", blocker: "None. Can file immediately." },

  // FROM HANDOFF P2
  { id: "C08", item: "Execute build steps 01-05 (Rocket Manual)", source: "Handoff P2 #8", time: "2 hr", priority: "P2", zone: "YELLOW", status: "NOT STARTED", detail: "Azure Blob + Immutable Storage (15min), PostgreSQL schema 57 tables (15min), Cursor SSH pipeline (30min), Discovery 427GB ingest (1hr), AI Search index (30min).", blocker: "Azure subscription access. Movebot for cloud-to-cloud transfer." },
  { id: "C09", item: "CourtListener scrape (Schmehl + Matcalf)", source: "Handoff P2 #9", time: "1 hr", priority: "P2", zone: "GREEN", status: "PARTIAL", detail: "74 Schmehl opinions already pulled. 8 rulings extracted. 2 sentencing records. Matcalf: too junior for opinions, track docket outcomes instead. CourtListener API token: f22ede6af8adbbe2fb44004f58c2f5cd410b2e24.", blocker: "Rate limit 5K/day. Mitigation: paginate + DocketBird supplement." },
  { id: "C10", item: "PACER pull (Simmons prior affidavits)", source: "Handoff P2 #10", time: "30 min", priority: "P2", zone: "GREEN", status: "NOT STARTED", detail: "Search for Simmons as affiant in other EDPA cases. Template detection requires comparing language across multiple AOPCs. RECAP archive first (free), PACER for gaps.", blocker: "Affidavits may be sealed. Mitigation: FOIA for unsealed + public testimony transcripts." },

  // FROM AXELROD CONVERSATION (tail end - 3 unbuilt items)
  { id: "C11", item: "30-page expanded PDF", source: "Axelrod tail", time: "1 hr", priority: "P1", zone: "YELLOW", status: "NOT STARTED", detail: "Requested at end of Axelrod session. Expanded version of all deliverables from that session. Would include Axelrod recruitment package, prosecution profiles, CourtListener research, schema design.", blocker: "None." },
  { id: "C12", item: "Framework skill builder", source: "Axelrod tail", time: "1 hr", priority: "P2", zone: "GREEN", status: "NOT STARTED", detail: "Custom Claude skill for the Redmond Doctrine frameworks. Would encode all 10 Legends, 10 Game Changers, filing taxonomy, quality gates into a reusable skill file for Claude Code.", blocker: "None." },
  { id: "C13", item: "Prometheus Engine document", source: "Axelrod tail", time: "1 hr", priority: "P2", zone: "GREEN", status: "NOT STARTED", detail: "Meta-cognitive operating system spanning legal intelligence, business operations, AI agent orchestration, strategic planning. Conceptual architecture document.", blocker: "None. Conceptual work." },

  // FROM CALL ANALYSIS CONVERSATION (tail end - critical items)
  { id: "C14", item: "Fix JSX rendering issues", source: "Call analysis tail", time: "10 min", priority: "P0", zone: "GREEN", status: "RESOLVED", detail: "Heredoc delivery corrupted template literal interpolations. Fixed in Done2 session by building War Room v3.1 as proper JSX artifact.", blocker: null },
  { id: "C15", item: "6 Rule 12 waivable motions", source: "Call analysis tail", time: "2 hr", priority: "CRITICAL", zone: "RED", status: "NOT STARTED", detail: "PERMANENTLY FORFEITED IF NOT RAISED PRETRIAL: (1) Multiplicity, (2) Failure to state an offense, (3) Duplicity, (4) Vindictive prosecution, (5) Pre-accusatory delay, (6) Venue challenges. These are time-bombs.", blocker: "Per-count element analysis must be completed first to know which apply." },

  // FROM DONE2 CONVERSATION (whats-missing extraction)
  { id: "C16", item: "11 motions (0 drafted)", source: "Done2 whats-missing", time: "5+ hr total", priority: "P1", zone: "RED", status: "NOT STARTED", detail: "Motion to Compel, Brady/Giglio demand, MTD 7202 (ERC), Franks motion, Kousisis materiality, Bill of Particulars, Rush Abandonment, Faretta (pro se), Rule 29 (acquittal), Motions in Limine, Daubert. NONE drafted.", blocker: "Per-count analysis. Sentencing guidelines. Expert witness identification." },
  { id: "C17", item: "11 models (0 operational)", source: "Done2 whats-missing", time: "8+ hr total", priority: "P2", zone: "YELLOW", status: "0/11 OPERATIONAL", detail: "Judge Simulator, Matcalf Profiler, Simmons Analyzer, Bayesian Posterior, Kill Chain Mapper, Contradiction Engine, Kousisis Scorer, Willfulness Chain, Jury Genome, Financial Counter-Engine, Network Map. 7 partial, 4 inoperable.", blocker: "Data collection (CourtListener, PACER, Census ACS, USSG Manual)." },
  { id: "C18", item: "Read Malcolm Smith letter", source: "Done2 whats-missing", time: "10 min", priority: "CRITICAL", zone: "RED", status: "NOT DONE", detail: "THE SINGLE HIGHEST LEVERAGE ACTION. If letter contains explicit language linking ERC credits to satisfaction of employment tax obligations = 7 counts potentially collapse (Epsilon scenario). 10 minutes. Determines if 7 counts live or die.", blocker: "Physical access to the letter." },
  { id: "C19", item: "Sentencing guidelines calculation", source: "Done2/Handoff v2", time: "30 min", priority: "P0", zone: "RED", status: "NOT DONE", detail: "No sentencing exposure number exists. Cannot evaluate plea offers without knowing guidelines range. Need: loss amount + 2025 USSG Manual + criminal history category. Financial Counter-Engine (Legend 8) designed to minimize.", blocker: "Gov loss methodology unknown. Need discovery." },
  { id: "C20", item: "Per-count element breakdown (27 counts)", source: "Done2/Handoff v2", time: "1 hr", priority: "P0", zone: "RED", status: "NOT DONE", detail: "27 counts, each with specific legal elements, specific wires, specific tax periods. Without this, motions cannot target individual counts. Blocks Rule 12 analysis, Kousisis scoring, multiplicity challenge.", blocker: "None. Can do from indictment text." },
  { id: "C21", item: "Expert witness identification + retention", source: "Done2/Handoff v2", time: "1 hr", priority: "P1", zone: "RED", status: "0 IDENTIFIED", detail: "6 categories needed: CPA/forensic accountant, telecom expert (Five9/IVR), tax law expert (7202/ERC), FBI procedure expert (AOPC/DIOG), linguistics expert (optional), sentencing expert (optional). Zero identified, zero retained, no budget captured.", blocker: "Budget. CJA funding if appointed." },
  { id: "C22", item: "Co-defendant analysis (Walsh + Barrera)", source: "Done2/Handoff v2", time: "30 min", priority: "P1", zone: "YELLOW", status: "NOT STARTED", detail: "Zero information beyond names. Severance strategy not documented. Cooperation risk not assessed. If Barrera flips = another cooperator. Bruton issues for trial.", blocker: "Need PACER docket pulls for Walsh and Barrera." },
];

// ═══════════════════════════════════════════════════════════════
// SECTION C: WHAT'S NEEDED FOR THE CREATION PLAN
// (inputs, prerequisites, blockers, dependencies)
// ═══════════════════════════════════════════════════════════════
const PREREQUISITES = [
  { category: "DOCUMENTS TO READ", items: [
    { item: "Malcolm Smith CPA letter", purpose: "Determines if 7 tax counts collapse", time: "10 min", priority: "HIGHEST LEVERAGE", status: "UNREAD" },
    { item: "Superseding indictment (full text)", purpose: "Per-count element breakdown", time: "30 min", priority: "P0", status: "IN POSSESSION" },
    { item: "Groff plea agreement", purpose: "What he admitted, cooperation scope", time: "10 min", priority: "P0", status: "NOT IN POSSESSION (Brady request needed)" },
    { item: "Gov sentencing memo / loss methodology", purpose: "Guidelines range calculation", time: "10 min", priority: "P0", status: "NOT IN POSSESSION" },
    { item: "2025 USSG Manual (loss table)", purpose: "Base offense level calculation", time: "5 min", priority: "P0", status: "NOT PULLED (web search)" },
    { item: "Simmons AOPC (full text with paragraphs)", purpose: "Line-by-line contradiction analysis", time: "30 min", priority: "P1", status: "IN POSSESSION" },
  ]},
  { category: "DATA TO COLLECT", items: [
    { item: "PACER: Simmons prior affidavits", purpose: "Template detection for Franks", time: "30 min", priority: "P2", status: "NOT COLLECTED" },
    { item: "PACER: Walsh docket", purpose: "Co-defendant status, cooperation risk", time: "10 min", priority: "P1", status: "NOT COLLECTED" },
    { item: "PACER: Barrera docket", purpose: "Co-defendant status, cooperation risk", time: "10 min", priority: "P1", status: "NOT COLLECTED" },
    { item: "Census ACS 2024 (Berks County)", purpose: "Jury Genome demographics", time: "30 min", priority: "P2", status: "NOT COLLECTED" },
    { item: "PA voter registration (Berks)", purpose: "Jury Genome party affiliation", time: "30 min", priority: "P2", status: "NOT COLLECTED" },
    { item: "USSC Sourcebook 2024 base rates", purpose: "Bayesian model calibration", time: "10 min", priority: "P1", status: "NOT PULLED" },
    { item: "CourtListener: Matcalf filing patterns", purpose: "Adversary profiling", time: "1 hr", priority: "P2", status: "NOT COLLECTED" },
  ]},
  { category: "DECISIONS PENDING", items: [
    { item: "Supabase vs Azure SQL", purpose: "Database architecture: migrate or parallel?", time: "5 min decision", priority: "P0", status: "UNDECIDED" },
    { item: "Pro se vs Axelrod timeline", purpose: "30-day sprint then handoff, or recruit now?", time: "Strategic", priority: "P0", status: "UNDECIDED" },
    { item: "Faretta motion timing", purpose: "File now to preserve record, or wait?", time: "5 min", priority: "P1", status: "UNDECIDED" },
    { item: "Schmehl recusal", purpose: "Analysis concluded: DON'T recuse. Reassignment risk too high.", time: "DECIDED", priority: "DECIDED", status: "DECIDED: NO RECUSAL" },
    { item: "Found Bank contingency", purpose: "DPC ($63K) + ABN frozen. Deadline Apr 13. PNC alternative.", time: "URGENT", priority: "P0", status: "16 DAYS LEFT" },
  ]},
  { category: "INFRASTRUCTURE TO DEPLOY", items: [
    { item: "Azure VM (Ubuntu 24)", purpose: "Host all models, scrapers, pipelines", time: "15 min", priority: "P2", status: "NOT PROVISIONED" },
    { item: "PostgreSQL schema (57 tables)", purpose: "Case intelligence database", time: "15 min", priority: "P2", status: "DESIGNED, NOT DEPLOYED" },
    { item: "Azure Blob + Immutable Storage", purpose: "Evidence lake, sovereign record", time: "15 min", priority: "P2", status: "CONTAINER EXISTS, IMMUTABLE NOT SET" },
    { item: "Azure AI Search index", purpose: "427GB discovery searchable in ms", time: "30 min after ingest", priority: "P2", status: "SERVICE EXISTS, NOT CONFIGURED" },
    { item: "Discovery 427GB ingest", purpose: "Raw evidence into blob storage", time: "1 hr (Movebot)", priority: "P2", status: "NOT STARTED" },
  ]},
];

// ═══════════════════════════════════════════════════════════════
// SECTION D: EXECUTION SEQUENCE (critical path)
// ═══════════════════════════════════════════════════════════════
const EXECUTION = [
  { phase: "PHASE 0: TRIAGE (Today)", time: "1 hr total", items: [
    { task: "READ Malcolm Smith letter", time: "10 min", why: "Determines if 7 counts live or die. Everything else is sequenced wrong if this letter says what it might say.", id: "C18" },
    { task: "Per-count element breakdown (27 counts)", time: "30 min", why: "Blocks every motion. Blocks Rule 12 analysis. Blocks Kousisis scoring. Do from indictment text.", id: "C20" },
    { task: "Pull 2025 USSG loss table (web search)", time: "5 min", why: "Need base offense level for sentencing calculation.", id: "C19" },
    { task: "Calculate sentencing guidelines range", time: "15 min", why: "Cannot evaluate ANY plea offer without this number.", id: "C19" },
  ]},
  { phase: "PHASE 1: LEGAL WEAPONS (This week)", time: "4 hr total", items: [
    { task: "Discovery request: law enforcement at May 8 superseding", time: "30 min", why: "Unlocks junior agent IDs for handshake cross-exam at trial.", id: "C07" },
    { task: "Motion to Compel (indexing)", time: "30 min", why: "90% success probability. Forces gov to organize 427GB. Opens Contradiction Engine.", id: "C16" },
    { task: "Brady/Giglio demand letter", time: "30 min", why: "85% success. Forces Groff 302 production. Impeachment material.", id: "C16" },
    { task: "Rule 12 waivable motion assessment", time: "1 hr", why: "6 motions PERMANENTLY FORFEITED if not raised pretrial. Clock is ticking.", id: "C15" },
    { task: "Bill of Particulars", time: "30 min", why: "Lock move from 30-Day Sprint. Forces gov to specify per-count facts. Can't shift theory at trial.", id: "C16" },
    { task: "Simmons cross-exam script (full build)", time: "30 min", why: "Framework exists in Register Tab 8. Needs exhibit references.", id: "C05" },
  ]},
  { phase: "PHASE 2: INTELLIGENCE (Next 2 weeks)", time: "5 hr total", items: [
    { task: "Run 30 sweep queries", time: "1 hr", why: "Fills intelligence gaps across all domains. Revenue, experts, custody, Walsh/Barrera, congressional.", id: "C01" },
    { task: "PACER pulls: Walsh, Barrera, Simmons", time: "1 hr", why: "Co-defendant status, cooperation risk, template detection.", id: "C10" },
    { task: "Expert witness research + retention", time: "1 hr", why: "CPA, telecom, tax, FBI procedure. Zero identified.", id: "C21" },
    { task: "Co-defendant analysis", time: "30 min", why: "Severance? Bruton? If Barrera flips, another cooperator.", id: "C22" },
    { task: "Final merged PDF", time: "30 min", why: "All artifacts in one document for counsel handoff.", id: "C04" },
    { task: "30-page expanded PDF (Axelrod package)", time: "1 hr", why: "Requested, never built. Complete recruitment intelligence.", id: "C11" },
  ]},
  { phase: "PHASE 3: INFRASTRUCTURE (Parallel track)", time: "5 hr total", items: [
    { task: "Azure VM + SSH + Git repo", time: "30 min", why: "Foundation for everything.", id: "C08" },
    { task: "PostgreSQL schema deploy (57 tables)", time: "15 min", why: "Case intelligence database.", id: "C08" },
    { task: "Discovery 427GB ingest", time: "1 hr", why: "Evidence lake populated.", id: "C08" },
    { task: "AI Search index configuration", time: "30 min", why: "427GB searchable.", id: "C08" },
    { task: "Framework skill builder", time: "1 hr", why: "Encodes Doctrine into reusable Claude Code skill.", id: "C12" },
    { task: "Prometheus Engine document", time: "1 hr", why: "Meta-cognitive architecture documentation.", id: "C13" },
  ]},
];

// ═══════════════════════════════════════════════════════════════
// SECTION E: TIME BOMBS (from Call Analysis conversation)
// ═══════════════════════════════════════════════════════════════
const TIME_BOMBS = [
  { bomb: "6 Rule 12 motions", deadline: "PRETRIAL (no specific date set)", consequence: "PERMANENTLY FORFEITED. Cannot raise on appeal. Cannot raise post-trial. Gone forever.", motions: "Multiplicity, Failure to state offense, Duplicity, Vindictive prosecution, Pre-accusatory delay, Venue", urgency: "CRITICAL" },
  { bomb: "Found Bank closure", deadline: "April 13, 2026 (16 days)", consequence: "DPC ($63K) + ABN frozen. Payment processing stops. Revenue stops.", urgency: "P0" },
  { bomb: "SNAP/OSIG investigation", deadline: "UNKNOWN", consequence: "Bail revocation under 18 USC 3148. Pretrial detention.", urgency: "CRITICAL" },
  { bomb: "Trial date", deadline: "September 14, 2026", consequence: "170 days. Everything converges.", urgency: "BACKDROP" },
  { bomb: "Axelrod window", deadline: "SELF-IMPOSED (30-day sprint)", consequence: "If 30-day sprint shows results, Axelrod recruitment becomes viable. If not, trial prep solo.", urgency: "STRATEGIC" },
];

// ═══════════════════════════════════════════════════════════════
// SECTION F: CONVERSATION SOURCE MAP
// ═══════════════════════════════════════════════════════════════
const CONVERSATIONS = [
  { id: 1, title: "Over (Origin Session)", url: "https://claude.ai/chat/981ac970-d0f6-4837-a30a-a27bcc1d8641", hours: 8, model: "Sonnet", tailEnd: "EFA v4 complete. 10 Legends designed. 10 Game Changers mapped. Belfast dictation corrections saved. All framework architecture finalized. NOTHING DEPLOYED.", artifacts: "brain.jsx, war_room_v2.jsx, blueprint.html, design system, gap register, master plan v1", key: "Architecture genesis. Everything starts here." },
  { id: 2, title: "Recruiting Axelrod", url: "https://claude.ai/chat/5105df7c-eab5-4bfc-9297-b4783680bcc7", hours: 6, model: "Mixed", tailEnd: "3 UNBUILT REQUESTS: 30-page expanded PDF, framework skill builder, Prometheus Engine doc. Axelrod Universe 32-tab xlsx delivered. Prosecution profiles complete. PostgreSQL schema: 77 tables. Dalke = Haverford (Paoli line connection).", artifacts: "BUXTON letter, 5 xlsx files, prosecution profile PDF", key: "Axelrod recruitment intelligence. 3 deliverables still owed." },
  { id: 3, title: "Call Analysis Blueprint", url: "https://claude.ai/chat/0edf44ce-eef0-4260-9c0e-d51d1758df9e", hours: 10, model: "Mixed", tailEnd: "Master v3 PDF (69 pages). Azure SQL 35 tables. 30 defense gaps identified including 6 RULE 12 WAIVABLE (permanent forfeiture). JSX rendering broken (fixed in Done2). Recording 109657236 (Christina Loring, 8:10, 4 verbal agreements, 4 press-9 declines, 2 self-corrections, COO on call).", artifacts: "Master Plan v3 PDF (69p), React JSX app (broken)", key: "Rule 12 time bombs. Master Plan expansion. Christina Loring recording." },
  { id: 4, title: "Done2", url: "https://claude.ai/chat/e70e82d6-d41a-4b0c-ad4a-1f699c80e861", hours: 4, model: "Sonnet + Opus", tailEnd: "War Room v3.1 (1,556 lines, 115KB). Enhanced Handoff v2 (51KB). 18 gaps patched. whats-missing/ repo folder (5 files). GitHub repo: 5 commits. VERDICT: Strategy 95%, Execution 0%. SINGLE HIGHEST ACTION: Read Malcolm Smith letter (10 min).", artifacts: "War Room v3.1 JSX, Handoff v2 MD, Thinking Traces, whats-missing/", key: "The honest mirror. Everything designed, nothing built." },
];

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════
const Tag = ({ color, children }) => (
  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", padding: "2px 8px", borderRadius: 2, background: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: 1, textTransform: "uppercase" }}>{children}</span>
);

const statusColor = (s) => {
  if (s === "COMPLETE" || s === "CURRENT" || s === "DONE" || s === "PUSHED") return C.green;
  if (s === "SUPERSEDED" || s === "DECIDED: NO RECUSAL") return C.dim;
  if (s === "PARTIAL" || s === "PARTIALLY DONE" || s === "FRAMEWORK EXISTS") return C.amber;
  if (s?.includes("NOT") || s === "UNREAD" || s === "UNDECIDED") return C.red;
  if (s?.includes("CRITICAL")) return C.red;
  return C.dim;
};

const priorityColor = (p) => {
  if (p === "CRITICAL" || p === "HIGHEST LEVERAGE") return C.red;
  if (p === "P0") return C.amber;
  if (p === "P1") return C.blue;
  if (p === "P2") return C.cyan;
  if (p === "DONE" || p === "DECIDED") return C.green;
  return C.dim;
};

const Section = ({ title, color, children }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 4, color, textTransform: "uppercase", marginBottom: 12, borderBottom: `1px solid ${color}33`, paddingBottom: 8 }}>{title}</div>
    {children}
  </div>
);

const Card = ({ children, accent }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: accent ? `3px solid ${accent}` : `1px solid ${C.border}`, padding: "12px 16px", marginBottom: 8, borderRadius: 2 }}>
    {children}
  </div>
);

export default function CreationPlan() {
  const [tab, setTab] = useState("EXEC");
  const tabs = ["EXEC", "CREATE", "PREREQS", "BOMBS", "BUILT", "SOURCES"];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "'Inter', sans-serif", fontSize: 13, backgroundImage: "linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      {/* HEADER */}
      <div style={{ padding: "20px 24px 0", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, letterSpacing: 6, color: C.blue, textTransform: "uppercase" }}>REDMOND DOCTRINE</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, letterSpacing: 2, marginTop: 4 }}>CREATION PLAN</div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>Extracted from 4 conversations | {daysLeft()} days to trial</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, color: C.red }}>{daysLeft()}</div>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: 2 }}>DAYS TO TRIAL</div>
          </div>
        </div>

        {/* VERDICT BAR */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {[
            { label: "STRATEGY", value: "95%", color: C.green },
            { label: "EXECUTION", value: "0%", color: C.red },
            { label: "MOTIONS DRAFTED", value: "0/11", color: C.red },
            { label: "MODELS LIVE", value: "0/11", color: C.red },
            { label: "QUERIES RUN", value: "0/30", color: C.red },
            { label: "SMITH LETTER", value: "UNREAD", color: C.red },
          ].map((m, i) => (
            <div key={i} style={{ flex: 1, background: C.cardAlt, padding: "8px 12px", borderRadius: 2, border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 2, color: C.dim }}>{m.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: m.color, marginTop: 2 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, padding: "8px 20px", background: tab === t ? C.card : "transparent", color: tab === t ? C.blue : C.dim, border: "none", cursor: "pointer", borderBottom: tab === t ? `2px solid ${C.blue}` : "2px solid transparent", transition: "all 0.15s" }}>{t}</button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 24, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>

        {/* EXECUTION SEQUENCE */}
        {tab === "EXEC" && (
          <div>
            <div style={{ background: `${C.red}11`, border: `1px solid ${C.red}33`, padding: 16, marginBottom: 24, borderRadius: 2 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.red, letterSpacing: 2 }}>SINGLE HIGHEST LEVERAGE ACTION</div>
              <div style={{ fontSize: 15, marginTop: 8 }}>Read the Malcolm Smith letter. 10 minutes. Determines whether 7 counts live or die.</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>If letter contains explicit language linking ERC credits to satisfaction of employment tax obligations = Epsilon scenario activates = 7 tax counts (21-27) potentially collapse. This single document is the butterfly.</div>
            </div>

            {EXECUTION.map((phase, pi) => (
              <Section key={pi} title={phase.phase} color={pi === 0 ? C.red : pi === 1 ? C.amber : pi === 2 ? C.blue : C.cyan}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 12 }}>Total time: {phase.time}</div>
                {phase.items.map((item, ii) => (
                  <Card key={ii} accent={pi === 0 ? C.red : pi === 1 ? C.amber : pi === 2 ? C.blue : C.cyan}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: C.text }}>{item.task}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>{item.why}</div>
                      </div>
                      <div style={{ textAlign: "right", marginLeft: 16 }}>
                        <Tag color={pi === 0 ? C.red : C.blue}>{item.time}</Tag>
                        <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{item.id}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Section>
            ))}
          </div>
        )}

        {/* CREATION ITEMS */}
        {tab === "CREATE" && (
          <div>
            {TO_CREATE.map((item, i) => {
              const pc = priorityColor(item.priority);
              const sc = statusColor(item.status);
              return (
                <Card key={i} accent={pc}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.dim }}>{item.id}</span>
                        <Tag color={pc}>{item.priority}</Tag>
                        <Tag color={item.zone === "RED" ? C.red : item.zone === "YELLOW" ? C.amber : C.green}>{item.zone}</Tag>
                        <Tag color={sc}>{item.status}</Tag>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginBottom: 4 }}>{item.item}</div>
                      <div style={{ fontSize: 11, color: C.dim }}>{item.detail}</div>
                      {item.blocker && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>BLOCKER: {item.blocker}</div>}
                    </div>
                    <div style={{ textAlign: "right", marginLeft: 16 }}>
                      <Tag color={C.blue}>{item.time}</Tag>
                      <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{item.source}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* PREREQUISITES */}
        {tab === "PREREQS" && (
          <div>
            {PREREQUISITES.map((cat, ci) => (
              <Section key={ci} title={cat.category} color={ci === 0 ? C.red : ci === 1 ? C.cyan : ci === 2 ? C.amber : C.purple}>
                {cat.items.map((item, ii) => (
                  <Card key={ii} accent={statusColor(item.status)}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{item.item}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{item.purpose}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Tag color={priorityColor(item.priority)}>{item.priority}</Tag>
                        <div style={{ marginTop: 4 }}><Tag color={statusColor(item.status)}>{item.status}</Tag></div>
                        <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{item.time}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Section>
            ))}
          </div>
        )}

        {/* TIME BOMBS */}
        {tab === "BOMBS" && (
          <div>
            {TIME_BOMBS.map((bomb, i) => (
              <Card key={i} accent={bomb.urgency === "CRITICAL" ? C.red : bomb.urgency === "P0" ? C.amber : C.blue}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <Tag color={bomb.urgency === "CRITICAL" ? C.red : bomb.urgency === "P0" ? C.amber : C.blue}>{bomb.urgency}</Tag>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, marginBottom: 4 }}>{bomb.bomb}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{bomb.consequence}</div>
                    {bomb.motions && <div style={{ fontSize: 11, color: C.amber, marginTop: 8 }}>{bomb.motions}</div>}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: bomb.urgency === "CRITICAL" ? C.red : C.amber, whiteSpace: "nowrap", marginLeft: 16 }}>{bomb.deadline}</div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* BUILT */}
        {tab === "BUILT" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {BUILT.map((item, i) => (
                <Card key={i} accent={statusColor(item.status)}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{item.item}</div>
                      <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{item.conv}{item.pages ? ` | ${item.pages}p` : ""}{item.sections ? ` | ${item.sections} sections` : ""}</div>
                    </div>
                    <Tag color={statusColor(item.status)}>{item.status}</Tag>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* SOURCES */}
        {tab === "SOURCES" && (
          <div>
            {CONVERSATIONS.map((conv, i) => (
              <Card key={i} accent={C.blue}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>CONV {conv.id}: {conv.title}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{conv.hours} hours | {conv.model}</div>
                  </div>
                  <a href={conv.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: C.cyan, textDecoration: "none" }}>OPEN</a>
                </div>
                <div style={{ fontSize: 12, color: C.text, marginBottom: 8 }}><span style={{ color: C.amber }}>KEY: </span>{conv.key}</div>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}><span style={{ color: C.green }}>TAIL END: </span>{conv.tailEnd}</div>
                <div style={{ fontSize: 10, color: C.dim }}><span style={{ color: C.purple }}>ARTIFACTS: </span>{conv.artifacts}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}