-- =============================================================
-- REDMOND OS: DISPATCH SYSTEM
-- Run this on Supabase SQL Editor once. Creates the war room.
-- =============================================================

-- AGENT REGISTRY: Who's in the room
CREATE TABLE IF NOT EXISTS agent_registry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id TEXT UNIQUE NOT NULL,           -- e.g. 'CEO', 'VP', 'RESEARCHER-1', 'DRAFTER-1'
    agent_type TEXT NOT NULL,                -- 'CEO', 'VP', 'WORKER'
    surface TEXT NOT NULL,                   -- 'CLI', 'CHAT', 'API'
    machine TEXT,                            -- 'WORKHORSE', 'ADMIN', 'QUICKS', 'IPAD', 'CLOUD'
    model TEXT DEFAULT 'sonnet-4.6',         -- which model this agent runs
    status TEXT DEFAULT 'IDLE',              -- 'IDLE', 'WORKING', 'BLOCKED', 'OFFLINE'
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    capabilities JSONB DEFAULT '[]',         -- ['legal', 'code', 'research', 'draft']
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MISSIONS: Top-level commands from Alan
CREATE TABLE IF NOT EXISTS missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mission_id TEXT UNIQUE NOT NULL,         -- e.g. 'FRANKS-MOTION-001'
    command TEXT NOT NULL,                    -- Alan's raw command
    zone TEXT NOT NULL DEFAULT 'YELLOW',     -- 'RED', 'YELLOW', 'GREEN'
    status TEXT DEFAULT 'PLANNING',          -- 'PLANNING', 'ACTIVE', 'REVIEW', 'COMPLETE', 'FAILED'
    priority INTEGER DEFAULT 5,              -- 1=critical, 10=low
    decomposition JSONB,                     -- CEO's task breakdown
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by TEXT DEFAULT 'ALAN'
);

-- DISPATCH BOARD: Individual tasks assigned to agents
CREATE TABLE IF NOT EXISTS dispatch_board (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id TEXT UNIQUE NOT NULL,            -- e.g. 'FRANKS-001-RESEARCH'
    mission_id TEXT REFERENCES missions(mission_id),
    agent_id TEXT,                           -- assigned agent
    task_type TEXT NOT NULL,                 -- 'RESEARCH', 'DRAFT', 'CITE_CHECK', 'REVIEW', 'FORMAT', 'CODE', 'TEST'
    title TEXT NOT NULL,                     -- human-readable task name
    instructions TEXT NOT NULL,              -- detailed instructions for the agent
    dependencies TEXT[] DEFAULT '{}',        -- task_ids that must complete first
    zone TEXT DEFAULT 'GREEN',              -- inherited or overridden from mission
    status TEXT DEFAULT 'QUEUED',           -- 'QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETE', 'FAILED'
    progress INTEGER DEFAULT 0,             -- 0-100
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_estimate_min INTEGER,              -- estimated minutes
    time_actual_min INTEGER,                -- actual minutes
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISPATCH ARTIFACTS: Outputs from agents
CREATE TABLE IF NOT EXISTS dispatch_artifacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artifact_id TEXT UNIQUE NOT NULL,
    task_id TEXT REFERENCES dispatch_board(task_id),
    mission_id TEXT REFERENCES missions(mission_id),
    agent_id TEXT NOT NULL,
    artifact_type TEXT NOT NULL,             -- 'DRAFT', 'RESEARCH_BRIEF', 'CASE_LAW', 'SCORE_REPORT', 'CODE', 'FILE'
    title TEXT NOT NULL,
    content TEXT,                            -- the actual output (text/markdown/json)
    file_path TEXT,                          -- if stored as file
    score INTEGER,                          -- quality score 0-200 (dual scoring)
    review_status TEXT DEFAULT 'PENDING',   -- 'PENDING', 'APPROVED', 'REJECTED', 'REVISION_NEEDED'
    review_notes TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENT MESSAGES: How agents talk to each other
CREATE TABLE IF NOT EXISTS agent_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_agent TEXT NOT NULL,
    to_agent TEXT NOT NULL,                  -- or 'ALL' for broadcast, 'CEO' for escalation
    mission_id TEXT,
    task_id TEXT,
    message_type TEXT NOT NULL,             -- 'STATUS', 'QUESTION', 'HANDOFF', 'ESCALATION', 'RED_ALERT', 'COMPLETE'
    content TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUALITY GATES: VP's quality checkpoints
CREATE TABLE IF NOT EXISTS quality_gates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id TEXT REFERENCES dispatch_board(task_id),
    gate_type TEXT NOT NULL,                -- 'CITE_CHECK', 'SCORE', 'LINT', 'TEST', 'HUMAN_REVIEW'
    passed BOOLEAN,
    score INTEGER,
    details JSONB,                          -- structured gate results
    checked_by TEXT NOT NULL,               -- agent_id of checker
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for speed
CREATE INDEX idx_dispatch_board_status ON dispatch_board(status);
CREATE INDEX idx_dispatch_board_agent ON dispatch_board(agent_id);
CREATE INDEX idx_dispatch_board_mission ON dispatch_board(mission_id);
CREATE INDEX idx_agent_messages_to ON agent_messages(to_agent, acknowledged);
CREATE INDEX idx_agent_registry_status ON agent_registry(status);
CREATE INDEX idx_missions_status ON missions(status);

-- REALTIME: Enable for live dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE dispatch_board;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE missions;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_registry;

-- AUTO-UPDATE timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dispatch_board_updated
    BEFORE UPDATE ON dispatch_board
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER missions_updated
    BEFORE UPDATE ON missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
