#!/usr/bin/env python3
"""
claude-skills MCP Server
Exposes the ~/claude-skills repo as callable tools via stdio MCP.
Install: pip install mcp
Register: add to ~/.mcp.json or Claude Desktop config
"""

import os
import json
import subprocess
import glob
from pathlib import Path
from typing import Optional
from mcp.server.fastmcp import FastMCP

SKILLS_ROOT = Path(os.environ.get("SKILLS_ROOT", Path.home() / "claude-skills"))

mcp = FastMCP(
    name="claude-skills",
    instructions=(
        "Provides tools to list, read, and run skills from the ~/claude-skills repo. "
        "Use skills_list to discover available skills, skills_read to inspect files, "
        "skills_run to execute a skill script, and skills_pull to sync latest from GitHub."
    ),
)


# ── helpers ──────────────────────────────────────────────────────────────────

def _skill_dirs() -> list[str]:
    """Return all top-level skill folder names."""
    if not SKILLS_ROOT.exists():
        return []
    return sorted(
        d.name for d in SKILLS_ROOT.iterdir()
        if d.is_dir() and not d.name.startswith(".")
    )


def _read_file_safe(path: Path, max_bytes: int = 32_000) -> str:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
        if len(text) > max_bytes:
            return text[:max_bytes] + f"\n\n[TRUNCATED — {len(text)} total chars]"
        return text
    except Exception as e:
        return f"ERROR reading {path}: {e}"


# ── tools ─────────────────────────────────────────────────────────────────────

@mcp.tool(
    annotations={"readOnlyHint": True, "destructiveHint": False}
)
def skills_list() -> str:
    """
    List every skill available in ~/claude-skills with its README summary.
    Returns a JSON array of {name, path, files, readme_preview}.
    """
    skills = []
    for name in _skill_dirs():
        skill_dir = SKILLS_ROOT / name
        files = [f.name for f in skill_dir.rglob("*") if f.is_file()]
        readme_path = skill_dir / "README.md"
        readme = _read_file_safe(readme_path, 500) if readme_path.exists() else "(no README)"
        skills.append({
            "name": name,
            "path": str(skill_dir),
            "files": files,
            "readme_preview": readme[:300],
        })

    if not skills:
        return json.dumps({
            "error": f"No skills found at {SKILLS_ROOT}. Run skills_pull first.",
            "skills_root": str(SKILLS_ROOT)
        }, indent=2)

    return json.dumps({"skills_root": str(SKILLS_ROOT), "count": len(skills), "skills": skills}, indent=2)


@mcp.tool(
    annotations={"readOnlyHint": True, "destructiveHint": False}
)
def skills_read(skill: str, file: str = "README.md") -> str:
    """
    Read a specific file inside a skill folder.

    Args:
        skill: Skill folder name (e.g. 'bulk-interview', 'project-memory')
        file:  Relative path inside the skill folder. Default: README.md
    """
    target = SKILLS_ROOT / skill / file
    if not target.exists():
        # Try listing what's available
        skill_dir = SKILLS_ROOT / skill
        if not skill_dir.exists():
            available = _skill_dirs()
            return json.dumps({"error": f"Skill '{skill}' not found.", "available": available})
        files = [str(f.relative_to(skill_dir)) for f in skill_dir.rglob("*") if f.is_file()]
        return json.dumps({"error": f"File '{file}' not found in skill '{skill}'.", "available_files": files})

    return _read_file_safe(target)


@mcp.tool(
    annotations={"readOnlyHint": False, "destructiveHint": False, "idempotentHint": False}
)
def skills_run(
    skill: str,
    script: str,
    args: Optional[list[str]] = None,
    cwd: Optional[str] = None,
    timeout: int = 60,
) -> str:
    """
    Execute a Python or shell script inside a skill folder.

    Args:
        skill:   Skill folder name (e.g. 'bulk-interview')
        script:  Script filename to run (e.g. 'interview.py')
        args:    Optional list of CLI arguments
        cwd:     Working directory override (default: skill folder)
        timeout: Max seconds to wait (default: 60)
    """
    skill_dir = SKILLS_ROOT / skill
    if not skill_dir.exists():
        return json.dumps({"error": f"Skill '{skill}' not found.", "available": _skill_dirs()})

    script_path = skill_dir / script
    if not script_path.exists():
        files = [f.name for f in skill_dir.iterdir() if f.is_file()]
        return json.dumps({"error": f"Script '{script}' not found.", "available_files": files})

    work_dir = cwd or str(skill_dir)
    cmd: list[str]

    if script.endswith(".py"):
        cmd = ["python3", str(script_path)] + (args or [])
    elif script.endswith(".sh"):
        cmd = ["bash", str(script_path)] + (args or [])
    else:
        cmd = [str(script_path)] + (args or [])

    try:
        result = subprocess.run(
            cmd,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return json.dumps({
            "returncode": result.returncode,
            "stdout": result.stdout[-8000:] if result.stdout else "",
            "stderr": result.stderr[-2000:] if result.stderr else "",
            "cmd": " ".join(cmd),
        }, indent=2)
    except subprocess.TimeoutExpired:
        return json.dumps({"error": f"Script timed out after {timeout}s.", "cmd": " ".join(cmd)})
    except Exception as e:
        return json.dumps({"error": str(e), "cmd": " ".join(cmd)})


@mcp.tool(
    annotations={"readOnlyHint": False, "destructiveHint": False, "idempotentHint": True}
)
def skills_pull(branch: str = "main") -> str:
    """
    Pull the latest skills from GitHub (git pull origin <branch>).
    Run this after pushing new skills to the repo.

    Args:
        branch: Branch to pull (default: main)
    """
    if not SKILLS_ROOT.exists():
        # clone fresh
        parent = SKILLS_ROOT.parent
        try:
            result = subprocess.run(
                ["git", "clone", "https://github.com/alanredmond23-bit/claude-skills.git",
                 str(SKILLS_ROOT)],
                cwd=str(parent),
                capture_output=True,
                text=True,
                timeout=60,
            )
            return json.dumps({
                "action": "clone",
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
            }, indent=2)
        except Exception as e:
            return json.dumps({"error": str(e)})

    try:
        result = subprocess.run(
            ["git", "pull", "origin", branch],
            cwd=str(SKILLS_ROOT),
            capture_output=True,
            text=True,
            timeout=60,
        )
        return json.dumps({
            "action": "pull",
            "branch": branch,
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "skills_available": _skill_dirs(),
        }, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool(
    annotations={"readOnlyHint": True, "destructiveHint": False}
)
def skills_search(query: str) -> str:
    """
    Full-text search across all skill files for a keyword or phrase.

    Args:
        query: Search string (case-insensitive)
    """
    results = []
    if not SKILLS_ROOT.exists():
        return json.dumps({"error": "Skills root not found. Run skills_pull."})

    for path in SKILLS_ROOT.rglob("*"):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
            lower = text.lower()
            q = query.lower()
            if q in lower:
                idx = lower.find(q)
                snippet = text[max(0, idx - 80): idx + 200].replace("\n", " ")
                results.append({
                    "file": str(path.relative_to(SKILLS_ROOT)),
                    "snippet": snippet,
                })
        except Exception:
            pass

    return json.dumps({"query": query, "matches": len(results), "results": results}, indent=2)


if __name__ == "__main__":
    mcp.run()
