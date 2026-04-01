#!/usr/bin/env bash
# install.sh — claude-skills MCP server installer
# Run on WORKHORSE, ADMIN, QUICKS
# Usage: bash install.sh

set -e

REPO="https://github.com/alanredmond23-bit/claude-skills.git"
SKILLS_DIR="$HOME/claude-skills"
MCP_DIR="$HOME/claude-skills-mcp"
SERVER_SCRIPT="$MCP_DIR/server.py"

echo "=== claude-skills MCP installer ==="

# 1. Clone/pull skills repo
if [ -d "$SKILLS_DIR/.git" ]; then
  echo "[1/4] Pulling latest skills..."
  git -C "$SKILLS_DIR" pull origin main
else
  echo "[1/4] Cloning skills repo..."
  git clone "$REPO" "$SKILLS_DIR"
fi

# 2. Install mcp dependency
echo "[2/4] Installing mcp Python package..."
pip3 install --break-system-packages --quiet "mcp[cli]>=1.0.0"

# 3. Copy server.py into place
echo "[3/4] Installing server.py to $MCP_DIR..."
mkdir -p "$MCP_DIR"
cp "$(dirname "$0")/server.py" "$SERVER_SCRIPT"
chmod +x "$SERVER_SCRIPT"

# 4. Patch ~/.mcp.json
echo "[4/4] Registering in ~/.mcp.json..."
MCP_JSON="$HOME/.mcp.json"

NEW_ENTRY=$(cat <<EOF
{
  "mcpServers": {
    "claude-skills": {
      "command": "python3",
      "args": ["$SERVER_SCRIPT"],
      "env": {
        "SKILLS_ROOT": "$SKILLS_DIR"
      }
    }
  }
}
EOF
)

if [ -f "$MCP_JSON" ]; then
  # Merge — requires python3
  python3 - <<PYEOF
import json, sys

with open("$MCP_JSON") as f:
    config = json.load(f)

if "mcpServers" not in config:
    config["mcpServers"] = {}

config["mcpServers"]["claude-skills"] = {
    "command": "python3",
    "args": ["$SERVER_SCRIPT"],
    "env": {"SKILLS_ROOT": "$SKILLS_DIR"}
}

with open("$MCP_JSON", "w") as f:
    json.dump(config, f, indent=2)

print("Merged into existing ~/.mcp.json")
PYEOF
else
  echo "$NEW_ENTRY" > "$MCP_JSON"
  echo "Created new ~/.mcp.json"
fi

echo ""
echo "=== DONE ==="
echo "Server : $SERVER_SCRIPT"
echo "Skills : $SKILLS_DIR"
echo "Config : $MCP_JSON"
echo ""
echo "Test now:"
echo "  claude mcp list"
echo "  echo '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}' | python3 $SERVER_SCRIPT"
