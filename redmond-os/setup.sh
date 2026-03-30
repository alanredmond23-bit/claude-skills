#!/bin/bash
# =============================================================
# REDMOND OS: ONE-COMMAND SETUP
# Run this on WORKHORSE. It does everything.
# =============================================================
set -e

echo "============================================"
echo "  REDMOND OS: DISPATCH SYSTEM SETUP"
echo "============================================"

# ─── LOAD SECRETS ─────────────────────────────────────────────
source ~/MASTER_RULES/load_secrets.sh 2>/dev/null || true

# Verify required env vars
if [ -z "$SUPABASE_URL" ]; then
    export SUPABASE_URL="https://fifybuzwfaegloijrmqb.supabase.co"
fi
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "ERROR: SUPABASE_SERVICE_KEY not set. Add to MASTER_RULES/SECRETS.env"
    exit 1
fi
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "ERROR: ANTHROPIC_API_KEY not set. Add to MASTER_RULES/SECRETS.env"
    exit 1
fi

echo "[1/5] Installing Python dependencies..."
pip install httpx anthropic --break-system-packages -q 2>/dev/null || \
pip install httpx anthropic -q

echo "[2/5] Running Supabase migration..."
# Use Supabase Management API or SQL Editor
# For now, print instructions
echo "  >> Open Supabase SQL Editor: https://supabase.com/dashboard/project/fifybuzwfaegloijrmqb/sql"
echo "  >> Paste contents of sql/001_dispatch_system.sql"
echo "  >> Click RUN"
echo "  >> Press ENTER when done..."
read -r

echo "[3/5] Testing Supabase connection..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    "$SUPABASE_URL/rest/v1/agent_registry" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY")

if [ "$HTTP_CODE" = "200" ]; then
    echo "  >> Supabase connection OK"
else
    echo "  >> Supabase returned HTTP $HTTP_CODE. Check your service key."
    exit 1
fi

echo "[4/5] Setting up tmux sessions..."
# Create the war room: CEO + VP + 3 workers
tmux new-session -d -s redmond-os -n CEO 2>/dev/null || true

# CEO pane
tmux send-keys -t redmond-os:CEO "cd $(pwd)/ceo && python ceo.py --monitor" Enter

# VP pane
tmux new-window -t redmond-os -n VP
tmux send-keys -t redmond-os:VP "cd $(pwd)/vp && python vp.py" Enter

# Worker panes
for i in 1 2 3; do
    tmux new-window -t redmond-os -n "WORKER-$i"
    tmux send-keys -t redmond-os:WORKER-$i "export AGENT_ID=WORKER-WORKHORSE-$i && export MACHINE_NAME=WORKHORSE" Enter
    tmux send-keys -t redmond-os:WORKER-$i "echo 'Worker $i ready. Run: claude --dangerously-skip-permissions'" Enter
done

echo "[5/5] Setup complete."
echo ""
echo "============================================"
echo "  WAR ROOM READY"
echo "============================================"
echo ""
echo "  tmux attach -t redmond-os     # Enter the war room"
echo "  Ctrl+B, N                      # Switch between agents"
echo ""
echo "  TO DISPATCH A MISSION:"
echo "  python ceo/ceo.py \"Build a Franks motion targeting Simmons\""
echo ""
echo "  TO CHECK STATUS:"
echo "  python ceo/ceo.py --status"
echo ""
echo "============================================"
