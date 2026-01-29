# Claude Skills

Reusable Claude Code skills and tools deployed across the fleet (WORKHORSE, ADMIN, QUICKS).

## Skills

### bulk-interview
Terminal TUI for collecting structured answers fast. Presents 30-50 questions at once instead of 4-at-a-time via AskUserQuestion.

```bash
# Run directly
python ~/claude-skills/bulk-interview/interview.py questions/drive-organization.json

# Run via Claude Code skill
/bulk-interview questions/drive-organization.json
```

**Question sets:**
- `drive-organization.json` - 30 questions for digital estate organization
- `legal-intake.json` - 20 questions for legal case intake

**Features:** choice/multi/text/textarea/yesno types, keyboard nav, resume support, JSON+MD output, zero dependencies.

## Adding New Skills

1. Create a folder under this repo: `skill-name/`
2. Add a Claude Code command file: `~/.claude/commands/skill-name.md`
3. Push and pull on all machines

## Fleet Deployment

Clone on each machine:
```bash
git clone https://github.com/alanredmond23-bit/claude-skills.git ~/claude-skills
```

Update on all machines:
```bash
cd ~/claude-skills && git pull
```
