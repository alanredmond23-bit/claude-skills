---
name: project-memory
description: Manage persistent project memories, knowledge, and settings across conversations. Use this skill whenever the user says "update memory", "remember this", "add to project", "update settings", "store this", "knowledge update", "status update", "project update", "save context", "handoff", "checkpoint", or references updating/modifying/adding/removing project-level information that should persist. Also trigger when the user mentions any project by name and wants to change its status, add findings, update tech stack, record decisions, or modify any persistent context. This is the PRIMARY skill for any cross-conversation state management. Trigger even for casual mentions like "oh btw we switched to X" or "trial got moved to Y" -- any factual update about projects, legal cases, infrastructure, revenue, or decisions.
---

# Project Memory Manager

Persistent knowledge management system for projects, settings, and operational context.

## CORE PRINCIPLE

All persistent data flows through `memory_user_edits`. This is the ONLY mechanism that survives across conversations. Every update MUST result in a `memory_user_edits` tool call or the data is lost.

## COMMANDS

The user can invoke updates in natural language. Parse intent and map to operations:

| Intent | Action | Example |
|--------|--------|---------|
| Add project info | `memory_user_edits add` | "remember that Menagerie uses PostgreSQL 51 tables" |
| Update existing | `memory_user_edits replace` | "update: trial moved to October 2026" |
| Remove info | `memory_user_edits remove` | "forget about the Orbital cluster" |
| View current | `memory_user_edits view` | "show me what you remember" |
| Bulk update | Multiple `add/replace` calls | "here's a status dump: ..." |
| Checkpoint | View + summarize | "checkpoint" |

## WORKFLOW

### Step 1: Parse the Update

Extract structured data from the user's message:
- **Subject**: What project/entity/system is being updated?
- **Attribute**: What specific thing changed? (status, tech, decision, finding, deadline, etc.)
- **Value**: What is the new state?
- **Action**: Add new / Replace existing / Remove

### Step 2: Check Current State

ALWAYS run `memory_user_edits view` FIRST before any modifications to:
- Avoid duplicates
- Find the correct line number for replacements
- Detect conflicts with existing entries

### Step 3: Format the Memory Entry

Entries MUST be concise. Follow this format:

```
[CATEGORY] Subject: key=value, key=value
```

Categories:
- `[PROJECT]` - Project status, tech stack, milestones
- `[LEGAL]` - Case numbers, deadlines, filings, rulings
- `[INFRA]` - Infrastructure, deployments, credentials, endpoints
- `[REVENUE]` - Revenue targets, metrics, pipeline
- `[SETTING]` - User preferences, workflow configs
- `[DECISION]` - Architectural or strategic decisions made
- `[BLOCKER]` - Active blockers and their resolution paths
- `[CONTACT]` - People, roles, relationships

### Step 4: Execute the Update

Use `memory_user_edits` with the appropriate command:

- **New info**: `command="add"`, `control="[CATEGORY] formatted entry"`
- **Changed info**: `command="replace"`, `line_number=N`, `replacement="[CATEGORY] updated entry"`
- **Obsolete info**: `command="remove"`, `line_number=N` (confirm with user first)

### Step 5: Confirm

After every update, output a confirmation block:

```
MEMORY UPDATE CONFIRMED
Action: [add/replace/remove]
Entry: [the formatted entry]
Line: [line number]
```

## BULK UPDATES (Handoffs / Checkpoints)

When the user provides a large status dump or says "checkpoint":

1. Run `memory_user_edits view` to get current state
2. Parse ALL updates from the user's message
3. For each update:
   - If new topic: `add`
   - If existing topic changed: `replace` (match by subject)
   - If topic explicitly removed: `remove` (confirm first)
4. Present a summary table of all changes made

## CHECKPOINT PROTOCOL

When user says "checkpoint" or "save state":

1. View all current memories
2. Summarize active state across all categories
3. Ask if any updates needed
4. If user provides updates, execute them
5. Output final state summary

## CONFLICT RESOLUTION

If an update conflicts with existing memory:
- Show the conflict: "Current: [X] vs New: [Y]"
- Ask which to keep, or if both should be stored
- Never silently overwrite without showing the user

## ENTRY SIZE LIMITS

- Each entry: max 500 characters (tool limit)
- Total entries: max 30 (tool limit)
- If data exceeds 500 chars, split into multiple categorized entries
- Use abbreviations to compress: "EDPA" not "Eastern District of Pennsylvania"

## FORMATTING RULES

- No fluff, no prose. Key=value pairs.
- Dates in YYYY-MM-DD format
- Case numbers in standard format (e.g., 4:24-bk-13093)
- Dollar amounts abbreviated ($500K not $500,000)
- Status values: ACTIVE, BLOCKED, COMPLETE, PENDING, CANCELLED

## EXAMPLES

**User**: "Remember that we switched from Nexio to Stripe for payment processing"
**Action**:
1. `view` - check for existing payment processor entries
2. If found: `replace` with `[INFRA] Payment processing: provider=Stripe, previous=Nexio, switched=2026-03-26`
3. If not found: `add` with same entry

**User**: "Update: Joel Ready adversary trial scheduled for May 2026"
**Action**:
1. `view` - find existing Joel Ready entry
2. `replace` line N with `[LEGAL] Joel Ready adversary (AP 25-00254): status=ACTIVE, trial=2026-05, filed=2025-12-29`

**User**: "Checkpoint"
**Action**:
1. `view` all memories
2. Group by category
3. Present organized summary
4. Ask: "Any updates to add?"

## NEGATIVE SPACE -- WHAT NOT TO STORE

- API keys or secrets (security risk -- memory system is not a vault)
- Temporary debugging states
- One-off questions that don't affect future conversations
- Verbatim instructions like "always do X" (these belong in userPreferences, not memory)
- Information already well-covered in the existing userMemories block
