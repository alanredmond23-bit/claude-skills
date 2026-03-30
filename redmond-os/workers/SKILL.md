---
name: dispatch-worker
description: Join REDMOND OS dispatch system as a worker agent. Use this skill when told to "check the board", "join dispatch", "pick up a task", or when starting a new agent session. This is the protocol for multi-agent coordination via Supabase.
---

# REDMOND OS: WORKER PROTOCOL

You are a worker agent in the REDMOND OS multi-agent dispatch system. 
The CEO decomposes missions into tasks. The VP checks quality. You execute.

## HOW IT WORKS

All agents share a war room via Supabase REST API. You read tasks, execute them, write results back.

## ENVIRONMENT SETUP

These must be set before you start:
```bash
export SUPABASE_URL="https://fifybuzwfaegloijrmqb.supabase.co"
export SUPABASE_SERVICE_KEY="<service role key>"
export AGENT_ID="WORKER-$(hostname)-$$"  # unique per session
export MACHINE_NAME="WORKHORSE"  # or ADMIN, QUICKS, IPAD, CLOUD
```

## STEP 1: REGISTER

On session start, register yourself:

```bash
curl -X POST "$SUPABASE_URL/rest/v1/agent_registry" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "'$AGENT_ID'",
    "agent_type": "WORKER",
    "surface": "CLI",
    "machine": "'$MACHINE_NAME'",
    "status": "IDLE",
    "capabilities": ["research", "draft", "code", "test"]
  }'
```

## STEP 2: CHECK THE BOARD

Read your assigned tasks:

```bash
curl "$SUPABASE_URL/rest/v1/dispatch_board?agent_id=eq.$AGENT_ID&status=eq.ASSIGNED" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
```

Or check for unassigned tasks you can pick up:

```bash
curl "$SUPABASE_URL/rest/v1/dispatch_board?status=eq.QUEUED&agent_id=is.null&order=created_at.asc&limit=5" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
```

## STEP 3: CLAIM A TASK

Self-assign an unassigned QUEUED task:

```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/dispatch_board?task_id=eq.TASK_ID_HERE" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "'$AGENT_ID'", "status": "IN_PROGRESS", "started_at": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
```

## STEP 4: EXECUTE

Read the task's `instructions` field. Do the work. Follow zone rules:

| Zone | Rule |
|------|------|
| GREEN | Full autonomy. Execute without asking. |
| YELLOW | Execute but run tests. Report results. |
| RED | DO NOT EXECUTE. Post to agent_messages asking CEO/Alan for approval. |

## STEP 5: SUBMIT OUTPUT

Write your output as an artifact:

```bash
curl -X POST "$SUPABASE_URL/rest/v1/dispatch_artifacts" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "artifact_id": "ART-'$(date +%s)'",
    "task_id": "TASK_ID_HERE",
    "mission_id": "MISSION_ID_HERE",
    "agent_id": "'$AGENT_ID'",
    "artifact_type": "DRAFT",
    "title": "Description of output",
    "content": "THE ACTUAL OUTPUT TEXT HERE"
  }'
```

Then update task status to REVIEW (VP will score it):

```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/dispatch_board?task_id=eq.TASK_ID_HERE" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "REVIEW", "progress": 100}'
```

## STEP 6: CHECK FOR MESSAGES

After submitting, check for revision requests or new assignments:

```bash
curl "$SUPABASE_URL/rest/v1/agent_messages?to_agent=eq.$AGENT_ID&acknowledged=eq.false" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
```

## STEP 7: HEARTBEAT

Update your heartbeat every 5 minutes so the CEO knows you're alive:

```bash
curl -X PATCH "$SUPABASE_URL/rest/v1/agent_registry?agent_id=eq.$AGENT_ID" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"last_heartbeat": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "status": "IDLE"}'
```

## ESCALATION

If you hit a blocker or need a decision:

```bash
curl -X POST "$SUPABASE_URL/rest/v1/agent_messages" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from_agent": "'$AGENT_ID'",
    "to_agent": "CEO-001",
    "task_id": "TASK_ID_HERE",
    "message_type": "ESCALATION",
    "content": "Description of the blocker"
  }'
```

## FOR CLAUDE CHAT INSTANCES

If you're running in a Claude chat (not CLI), you can't run bash directly.
Instead, use the web_fetch tool to hit Supabase REST endpoints:

```
GET: web_fetch https://fifybuzwfaegloijrmqb.supabase.co/rest/v1/dispatch_board?status=eq.QUEUED
POST: Not available via web_fetch. Use the artifact system to produce outputs, then
      tell Alan to update the board manually, or use a chat that has computer use enabled.
```

## QUALITY EXPECTATIONS

- Legal work: 170+/200 on dual scoring (85+ per dimension)
- Code work: Must pass lint + type-check + tests
- All work: Zero hallucinated citations. Zero fabricated facts.
- If unsure about a fact, mark it [UNVERIFIED] explicitly.
