#!/usr/bin/env python3
"""
Bulk Interview Tool - Terminal TUI for collecting structured answers fast.

Usage:
    python interview.py questions/file1.json [file2.json ...] [--output dir] [--resume file.json]

Features:
    - Presents all questions in a clean terminal UI with ANSI colors
    - Keyboard navigation: numbers, arrows, back, skip, jump-to-section
    - Saves answers to JSON + Markdown
    - Resume support for interrupted sessions
    - Multi-file question set merging
"""

import json
import os
import sys
import textwrap
import shutil
import datetime
import re
import signal
import termios
import tty
from pathlib import Path

# ── ANSI Colors ──────────────────────────────────────────────────────────────

class C:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    UNDERLINE = "\033[4m"
    # Foreground
    RED     = "\033[31m"
    GREEN   = "\033[32m"
    YELLOW  = "\033[33m"
    BLUE    = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN    = "\033[36m"
    WHITE   = "\033[37m"
    GRAY    = "\033[90m"
    # Background
    BG_BLUE = "\033[44m"
    BG_GRAY = "\033[100m"

# ── Box drawing ──────────────────────────────────────────────────────────────

BOX_H  = "═"
BOX_V  = "║"
BOX_TL = "╔"
BOX_TR = "╗"
BOX_BL = "╚"
BOX_BR = "╝"
BOX_ML = "╠"
BOX_MR = "╣"

def get_term_width():
    return min(shutil.get_terminal_size().columns, 80)

def box_line(left, fill, right, width):
    return f"{left}{fill * (width - 2)}{right}"

def box_text(text, width, align="left", color=""):
    inner = width - 4  # 2 for borders, 2 for padding
    if len(strip_ansi(text)) > inner:
        text = text[:inner]
    stripped_len = len(strip_ansi(text))
    if align == "center":
        pad_left = (inner - stripped_len) // 2
        pad_right = inner - stripped_len - pad_left
        return f"{BOX_V} {' ' * pad_left}{color}{text}{C.RESET}{' ' * pad_right} {BOX_V}"
    elif align == "right":
        pad = inner - stripped_len
        return f"{BOX_V} {' ' * pad}{color}{text}{C.RESET} {BOX_V}"
    else:
        pad = inner - stripped_len
        return f"{BOX_V} {color}{text}{C.RESET}{' ' * pad} {BOX_V}"

def strip_ansi(text):
    return re.sub(r'\033\[[0-9;]*m', '', text)

# ── Progress bar ─────────────────────────────────────────────────────────────

def progress_bar(current, total, width=20):
    filled = int(width * current / max(total, 1))
    bar = "█" * filled + "░" * (width - filled)
    return f"[{bar}] {current}/{total}"

# ── Screen helpers ───────────────────────────────────────────────────────────

def clear_screen():
    print("\033[2J\033[H", end="", flush=True)

def read_key():
    """Read a single keypress, handling escape sequences."""
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
        if ch == '\x1b':  # Escape sequence
            ch2 = sys.stdin.read(1)
            if ch2 == '[':
                ch3 = sys.stdin.read(1)
                if ch3 == 'A': return 'UP'
                if ch3 == 'B': return 'DOWN'
                if ch3 == 'C': return 'RIGHT'
                if ch3 == 'D': return 'LEFT'
                return f'ESC[{ch3}'
            return 'ESC'
        if ch == '\r' or ch == '\n':
            return 'ENTER'
        if ch == '\x7f' or ch == '\x08':
            return 'BACKSPACE'
        if ch == '\x03':  # Ctrl+C
            return 'CTRL_C'
        return ch
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

def read_line(prompt="", prefill=""):
    """Read a line of input with basic editing support."""
    sys.stdout.write(prompt + prefill)
    sys.stdout.flush()
    buf = list(prefill)
    while True:
        key = read_key()
        if key == 'ENTER':
            print()
            return ''.join(buf)
        elif key == 'BACKSPACE':
            if buf:
                buf.pop()
                sys.stdout.write('\b \b')
                sys.stdout.flush()
        elif key == 'CTRL_C':
            raise KeyboardInterrupt
        elif key == 'ESC':
            return None  # Signal cancel
        elif isinstance(key, str) and len(key) == 1 and key.isprintable():
            buf.append(key)
            sys.stdout.write(key)
            sys.stdout.flush()
    return ''.join(buf)

def read_multiline(prompt=""):
    """Read multiple lines. Empty line + Enter to finish."""
    print(prompt)
    print(f"  {C.DIM}(Type your answer. Press Enter twice to finish, ESC to cancel){C.RESET}")
    lines = []
    empty_count = 0
    while True:
        line = read_line("  ")
        if line is None:
            return None
        if line == "":
            empty_count += 1
            if empty_count >= 1 and lines:
                return '\n'.join(lines)
            if not lines:
                return ""
        else:
            empty_count = 0
            lines.append(line)
    return '\n'.join(lines)


# ── Question loading ─────────────────────────────────────────────────────────

def load_questions(filepaths):
    """Load and merge question sets from one or more JSON files."""
    all_sections = []
    meta = {"title": "", "description": "", "files": []}

    for fp in filepaths:
        path = Path(fp)
        if not path.exists():
            # Try relative to script dir
            path = Path(__file__).parent / fp
        if not path.exists():
            print(f"{C.RED}Error: Question file not found: {fp}{C.RESET}")
            sys.exit(1)

        with open(path, 'r') as f:
            data = json.load(f)

        meta["files"].append(str(path))
        if not meta["title"]:
            meta["title"] = data.get("title", path.stem)
            meta["description"] = data.get("description", "")
        else:
            meta["title"] += f" + {data.get('title', path.stem)}"

        sections = data.get("sections", [])
        if not sections:
            # Flat question list - wrap in single section
            sections = [{"name": data.get("title", "Questions"), "questions": data.get("questions", [])}]
        all_sections.extend(sections)

    return meta, all_sections


def flatten_questions(sections):
    """Return flat list of (section_idx, section_name, question) tuples."""
    flat = []
    for si, section in enumerate(sections):
        for q in section.get("questions", []):
            flat.append((si, section["name"], q))
    return flat


# ── Answer persistence ───────────────────────────────────────────────────────

def find_resume_file(output_dir, title):
    """Find the most recent partial save for this interview title."""
    slug = slugify(title)
    candidates = []
    out = Path(output_dir)
    if not out.exists():
        return None
    for f in out.iterdir():
        if f.suffix == '.json' and slug in f.name and '_partial' in f.name:
            candidates.append(f)
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:50]


def save_answers(meta, sections, flat_questions, answers, output_dir, partial=False):
    """Save answers to JSON and Markdown files."""
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = slugify(meta["title"])
    suffix = "_partial" if partial else ""

    # JSON output
    json_path = out / f"{ts}_{slug}{suffix}.json"
    result = {
        "meta": {
            "title": meta["title"],
            "description": meta["description"],
            "source_files": meta["files"],
            "timestamp": datetime.datetime.now().isoformat(),
            "total_questions": len(flat_questions),
            "answered": sum(1 for a in answers.values() if a is not None and a != ""),
            "partial": partial,
        },
        "sections": []
    }

    for si, section in enumerate(sections):
        sec_data = {"name": section["name"], "answers": []}
        for q in section.get("questions", []):
            qid = q["id"]
            ans = answers.get(qid)
            sec_data["answers"].append({
                "id": qid,
                "question": q["text"],
                "type": q.get("type", "text"),
                "answer": ans,
                "skipped": ans is None or ans == "",
            })
        result["sections"].append(sec_data)

    with open(json_path, 'w') as f:
        json.dump(result, f, indent=2)

    # Markdown output
    md_path = out / f"{ts}_{slug}{suffix}.md"
    lines = [
        f"# {meta['title']}",
        f"",
        f"**Date:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"**Status:** {'Partial' if partial else 'Complete'}",
        f"**Answered:** {result['meta']['answered']}/{result['meta']['total_questions']}",
        f"",
        "---",
        "",
    ]

    for sec in result["sections"]:
        lines.append(f"## {sec['name']}")
        lines.append("")
        for a in sec["answers"]:
            ans_text = a["answer"] if a["answer"] else "*[skipped]*"
            if isinstance(ans_text, list):
                ans_text = ", ".join(ans_text)
            lines.append(f"**{a['question']}**")
            lines.append(f"> {ans_text}")
            lines.append("")
        lines.append("---")
        lines.append("")

    with open(md_path, 'w') as f:
        f.write('\n'.join(lines))

    # Clean up old partials if this is a complete save
    if not partial:
        for f in out.iterdir():
            if f.suffix == '.json' and slug in f.name and '_partial' in f.name:
                f.unlink()
            if f.suffix == '.md' and slug in f.name and '_partial' in f.name:
                f.unlink()

    return json_path, md_path


def load_partial_answers(filepath):
    """Load answers from a partial save file."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    answers = {}
    for sec in data.get("sections", []):
        for a in sec.get("answers", []):
            if not a.get("skipped", True):
                answers[a["id"]] = a["answer"]
    return answers


# ── Display functions ────────────────────────────────────────────────────────

def show_welcome(meta, total_questions, sections):
    """Display welcome screen."""
    w = get_term_width()
    clear_screen()
    print(f"{C.CYAN}{box_line(BOX_TL, BOX_H, BOX_TR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")
    print(f"{C.CYAN}{box_text(f'BULK INTERVIEW', w, 'center', C.BOLD + C.WHITE)}{C.RESET}")
    print(f"{C.CYAN}{box_text(meta['title'], w, 'center', C.YELLOW)}{C.RESET}")
    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_ML, BOX_H, BOX_MR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")

    if meta["description"]:
        # Wrap description
        inner_w = w - 6
        for line in textwrap.wrap(meta["description"], inner_w):
            print(f"{C.CYAN}{box_text(line, w, color=C.WHITE)}{C.RESET}")
        print(f"{C.CYAN}{box_text('', w)}{C.RESET}")

    print(f"{C.CYAN}{box_text(f'Total questions: {total_questions}', w, color=C.GREEN)}{C.RESET}")
    print(f"{C.CYAN}{box_text(f'Sections: {len(sections)}', w, color=C.GREEN)}{C.RESET}")
    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")

    for i, sec in enumerate(sections):
        qcount = len(sec.get("questions", []))
        sec_name = sec["name"]
        print(f"{C.CYAN}{box_text(f'  {i+1}. {sec_name} ({qcount} questions)', w, color=C.WHITE)}{C.RESET}")

    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_ML, BOX_H, BOX_MR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('Controls:', w, color=C.BOLD + C.WHITE)}{C.RESET}")
    print(f"{C.CYAN}{box_text('  [Enter] next   [b] back   [s] skip', w, color=C.DIM)}{C.RESET}")
    print(f"{C.CYAN}{box_text('  [j] jump       [r] review  [q] quit+save', w, color=C.DIM)}{C.RESET}")
    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_BL, BOX_H, BOX_BR, w)}{C.RESET}")
    print()
    print(f"  {C.BOLD}Press Enter to begin...{C.RESET}", end="", flush=True)

    while True:
        key = read_key()
        if key == 'ENTER':
            break
        if key == 'CTRL_C':
            raise KeyboardInterrupt
        if key == 'q':
            sys.exit(0)


def show_question(qi, total, section_idx, total_sections, section_name, question, answer, answered_count):
    """Display a single question with full UI chrome."""
    w = get_term_width()
    clear_screen()

    qtype = question.get("type", "text")
    required = question.get("required", False)
    options = question.get("options", [])

    # Header
    pbar = progress_bar(answered_count, total, 20)
    print(f"{C.CYAN}{box_line(BOX_TL, BOX_H, BOX_TR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text(f'BULK INTERVIEW', w, color=C.BOLD + C.WHITE)}{C.RESET}")
    sec_info = f"Section {section_idx+1}/{total_sections}: {section_name}"
    print(f"{C.CYAN}{box_text(f'{sec_info}    {pbar}', w, color=C.YELLOW)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_ML, BOX_H, BOX_MR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")

    # Question text (wrapped)
    req_marker = f" {C.RED}*{C.RESET}" if required else ""
    q_prefix = f"Q{qi+1}."
    inner_w = w - 8
    q_lines = textwrap.wrap(question["text"], inner_w)
    first = True
    for line in q_lines:
        prefix = f"  {q_prefix} " if first else "      "
        first = False
        print(f"{C.CYAN}{box_text(f'{prefix}{line}', w, color=C.BOLD + C.WHITE)}{C.RESET}")

    if required:
        print(f"{C.CYAN}{box_text(f'      (required)', w, color=C.RED)}{C.RESET}")

    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")

    # Options for choice/multi/yesno
    if qtype == "choice":
        for i, opt in enumerate(options):
            marker = f"  {C.GREEN}>{C.RESET}" if answer == opt else "  "
            print(f"{C.CYAN}{box_text(f'{marker} [{i+1}] {opt}', w, color=C.WHITE)}{C.RESET}")
    elif qtype == "multi":
        selected = answer if isinstance(answer, list) else []
        for i, opt in enumerate(options):
            check = f"{C.GREEN}✓{C.RESET}" if opt in selected else " "
            print(f"{C.CYAN}{box_text(f'  [{check}] [{i+1}] {opt}', w, color=C.WHITE)}{C.RESET}")
        print(f"{C.CYAN}{box_text('', w)}{C.RESET}")
        print(f"{C.CYAN}{box_text(f'  Enter numbers (comma-separated) or toggle:', w, color=C.DIM)}{C.RESET}")
    elif qtype == "yesno":
        y_mark = f"{C.GREEN}>{C.RESET}" if answer == "Yes" else " "
        n_mark = f"{C.GREEN}>{C.RESET}" if answer == "No" else " "
        print(f"{C.CYAN}{box_text(f' {y_mark} [1] Yes', w, color=C.WHITE)}{C.RESET}")
        print(f"{C.CYAN}{box_text(f' {n_mark} [2] No', w, color=C.WHITE)}{C.RESET}")
    elif qtype == "text":
        if answer:
            print(f"{C.CYAN}{box_text(f'  Current: {answer}', w, color=C.GREEN)}{C.RESET}")
    elif qtype == "textarea":
        if answer:
            for line in str(answer).split('\n')[:3]:
                print(f"{C.CYAN}{box_text(f'  {line}', w, color=C.GREEN)}{C.RESET}")
            if str(answer).count('\n') > 3:
                print(f"{C.CYAN}{box_text(f'  ...', w, color=C.DIM)}{C.RESET}")

    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")

    # Footer
    print(f"{C.CYAN}{box_line(BOX_ML, BOX_H, BOX_MR, w)}{C.RESET}")
    skip_txt = "[s] skip" if not required else f"{C.DIM}[s] skip{C.RESET}"
    print(f"{C.CYAN}{box_text(f'[Enter] next  [b] back  {skip_txt}  [j] jump  [q] quit', w, color=C.DIM)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_BL, BOX_H, BOX_BR, w)}{C.RESET}")
    print()


def show_jump_menu(sections, current_section):
    """Show section jump menu and return selected section index."""
    w = get_term_width()
    clear_screen()
    print(f"{C.CYAN}{box_line(BOX_TL, BOX_H, BOX_TR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('JUMP TO SECTION', w, 'center', C.BOLD + C.WHITE)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_ML, BOX_H, BOX_MR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")

    for i, sec in enumerate(sections):
        qcount = len(sec.get("questions", []))
        marker = f"{C.GREEN}>{C.RESET}" if i == current_section else " "
        sec_name = sec["name"]
        print(f"{C.CYAN}{box_text(f'{marker} [{i+1}] {sec_name} ({qcount}q)', w, color=C.WHITE)}{C.RESET}")

    print(f"{C.CYAN}{box_text('', w)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_ML, BOX_H, BOX_MR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('Enter section number (ESC to cancel):', w, color=C.DIM)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_BL, BOX_H, BOX_BR, w)}{C.RESET}")
    print()

    sys.stdout.write(f"  {C.BOLD}> {C.RESET}")
    sys.stdout.flush()
    result = read_line()
    if result is None:
        return None
    try:
        idx = int(result.strip()) - 1
        if 0 <= idx < len(sections):
            return idx
    except ValueError:
        pass
    return None


def show_review(meta, sections, flat_questions, answers):
    """Show all answers for review before final save."""
    w = get_term_width()
    clear_screen()
    print(f"{C.CYAN}{box_line(BOX_TL, BOX_H, BOX_TR, w)}{C.RESET}")
    print(f"{C.CYAN}{box_text('REVIEW ALL ANSWERS', w, 'center', C.BOLD + C.WHITE)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_ML, BOX_H, BOX_MR, w)}{C.RESET}")

    answered = sum(1 for a in answers.values() if a is not None and a != "")
    print(f"{C.CYAN}{box_text(f'Answered: {answered}/{len(flat_questions)}', w, color=C.GREEN)}{C.RESET}")
    print(f"{C.CYAN}{box_line(BOX_BL, BOX_H, BOX_BR, w)}{C.RESET}")
    print()

    for si, section in enumerate(sections):
        print(f"  {C.BOLD}{C.YELLOW}── {section['name']} ──{C.RESET}")
        for q in section.get("questions", []):
            qid = q["id"]
            ans = answers.get(qid)
            if ans is None or ans == "":
                ans_display = f"{C.DIM}[skipped]{C.RESET}"
            elif isinstance(ans, list):
                ans_display = f"{C.GREEN}{', '.join(ans)}{C.RESET}"
            else:
                ans_display = f"{C.GREEN}{ans}{C.RESET}"
            # Truncate long answers for display
            raw = strip_ansi(ans_display)
            if len(raw) > 60:
                ans_display = f"{C.GREEN}{raw[:57]}...{C.RESET}"
            print(f"    {C.WHITE}{q['text'][:50]}{'...' if len(q['text'])>50 else ''}{C.RESET}")
            print(f"    → {ans_display}")
        print()

    print(f"  {C.BOLD}Actions:{C.RESET}")
    print(f"    [Enter] Save and finish")
    print(f"    [e] Edit a question (enter Q number)")
    print(f"    [ESC]   Go back to questions")
    print()
    sys.stdout.write(f"  {C.BOLD}> {C.RESET}")
    sys.stdout.flush()

    result = read_line()
    if result is None:
        return "back"
    result = result.strip().lower()
    if result == "" or result == "save":
        return "save"
    if result == "e" or result.startswith("e"):
        return "back"
    return "back"


# ── Main interview loop ─────────────────────────────────────────────────────

def get_answer_for_question(question, current_answer):
    """Collect answer for a single question. Returns (answer, action).
    action: 'next', 'back', 'skip', 'jump', 'quit', 'review'
    """
    qtype = question.get("type", "text")
    options = question.get("options", [])
    required = question.get("required", False)

    sys.stdout.write(f"  {C.BOLD}> {C.RESET}")
    sys.stdout.flush()

    if qtype in ("choice", "yesno"):
        if qtype == "yesno":
            options = ["Yes", "No"]

        while True:
            key = read_key()
            if key == 'CTRL_C':
                raise KeyboardInterrupt
            if key == 'ENTER':
                if current_answer is not None and current_answer != "":
                    return current_answer, 'next'
                elif not required:
                    return current_answer, 'next'
                # Required but no answer - stay
                continue
            if key == 'b':
                print("back")
                return current_answer, 'back'
            if key == 's':
                if not required:
                    print("skip")
                    return None, 'next'
                continue
            if key == 'j':
                print("jump")
                return current_answer, 'jump'
            if key == 'q':
                print("quit")
                return current_answer, 'quit'
            if key == 'r':
                print("review")
                return current_answer, 'review'
            # Number selection
            if key.isdigit():
                idx = int(key) - 1
                if 0 <= idx < len(options):
                    print(f"{C.GREEN}{options[idx]}{C.RESET}")
                    return options[idx], 'next'

    elif qtype == "multi":
        while True:
            result = read_line()
            if result is None:  # ESC
                return current_answer, 'back'
            result = result.strip()

            if result == '':
                if current_answer and len(current_answer) > 0:
                    return current_answer, 'next'
                elif not required:
                    return [], 'next'
                continue
            if result == 'b':
                return current_answer, 'back'
            if result == 's' and not required:
                return [], 'next'
            if result == 'j':
                return current_answer, 'jump'
            if result == 'q':
                return current_answer, 'quit'
            if result == 'r':
                return current_answer, 'review'

            # Parse comma-separated numbers
            try:
                indices = [int(x.strip()) - 1 for x in result.split(',')]
                selected = [options[i] for i in indices if 0 <= i < len(options)]
                if selected:
                    return selected, 'next'
            except ValueError:
                pass

    elif qtype == "textarea":
        result = read_multiline()
        if result is None:
            return current_answer, 'back'
        if result == "" and not required:
            return None, 'next'
        if result == "b":
            return current_answer, 'back'
        if result == "j":
            return current_answer, 'jump'
        if result == "q":
            return current_answer, 'quit'
        if result == "r":
            return current_answer, 'review'
        return result, 'next'

    else:  # text
        result = read_line()
        if result is None:
            return current_answer, 'back'
        result = result.strip()
        if result == '' and current_answer:
            return current_answer, 'next'
        if result == '' and not required:
            return None, 'next'
        if result == 'b':
            return current_answer, 'back'
        if result == 's' and not required:
            return None, 'next'
        if result == 'j':
            return current_answer, 'jump'
        if result == 'q':
            return current_answer, 'quit'
        if result == 'r':
            return current_answer, 'review'
        return result, 'next'


def run_interview(meta, sections, output_dir, resume_answers=None):
    """Main interview loop."""
    flat = flatten_questions(sections)
    total = len(flat)
    answers = resume_answers or {}

    # Find first unanswered question for resume
    qi = 0
    if resume_answers:
        for i, (si, sname, q) in enumerate(flat):
            if q["id"] not in answers or answers[q["id"]] is None or answers[q["id"]] == "":
                qi = i
                break
        else:
            qi = 0  # All answered, start from beginning for review

    show_welcome(meta, total, sections)

    while True:
        if qi < 0:
            qi = 0
        if qi >= total:
            # End reached - show review
            action = show_review(meta, sections, flat, answers)
            if action == "save":
                json_path, md_path = save_answers(meta, sections, flat, answers, output_dir, partial=False)
                clear_screen()
                answered = sum(1 for a in answers.values() if a is not None and a != "")
                print(f"\n  {C.GREEN}{C.BOLD}Interview complete!{C.RESET}")
                print(f"  Answered: {answered}/{total}")
                print(f"\n  {C.CYAN}JSON:{C.RESET} {json_path}")
                print(f"  {C.CYAN}MD:  {C.RESET} {md_path}")
                print()
                return str(json_path)
            else:
                qi = total - 1
                continue

        section_idx, section_name, question = flat[qi]
        qid = question["id"]
        current_answer = answers.get(qid)
        answered_count = sum(1 for a in answers.values() if a is not None and a != "")

        show_question(qi, total, section_idx, len(sections), section_name, question, current_answer, answered_count)

        answer, action = get_answer_for_question(question, current_answer)
        answers[qid] = answer

        if action == 'next':
            qi += 1
        elif action == 'back':
            qi -= 1
        elif action == 'skip':
            answers[qid] = None
            qi += 1
        elif action == 'jump':
            target = show_jump_menu(sections, section_idx)
            if target is not None:
                # Find the first question in target section
                for i, (si, _, _) in enumerate(flat):
                    if si == target:
                        qi = i
                        break
        elif action == 'quit':
            json_path, md_path = save_answers(meta, sections, flat, answers, output_dir, partial=True)
            clear_screen()
            answered = sum(1 for a in answers.values() if a is not None and a != "")
            print(f"\n  {C.YELLOW}{C.BOLD}Progress saved (partial).{C.RESET}")
            print(f"  Answered: {answered}/{total}")
            print(f"\n  {C.CYAN}JSON:{C.RESET} {json_path}")
            print(f"  {C.CYAN}MD:  {C.RESET} {md_path}")
            print(f"\n  {C.DIM}Resume with: python interview.py --resume {json_path}{C.RESET}")
            print()
            return str(json_path)
        elif action == 'review':
            qi = total  # Trigger review screen


# ── CLI entry point ──────────────────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Bulk Interview Tool - Terminal TUI for structured data collection",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""
        Examples:
          python interview.py questions/drive-organization.json
          python interview.py set1.json set2.json --output ./my-answers
          python interview.py --resume answers/20260129_partial.json
        """)
    )
    parser.add_argument('files', nargs='*', help='Question set JSON files')
    parser.add_argument('--output', '-o', default=None,
                       help='Output directory (default: answers/ next to script)')
    parser.add_argument('--resume', '-r', default=None,
                       help='Resume from a partial save JSON file')

    args = parser.parse_args()

    # Determine output directory
    script_dir = Path(__file__).parent
    output_dir = args.output or str(script_dir / "answers")

    # Handle resume
    resume_answers = None
    if args.resume:
        resume_path = Path(args.resume)
        if not resume_path.exists():
            print(f"{C.RED}Resume file not found: {args.resume}{C.RESET}")
            sys.exit(1)
        resume_answers = load_partial_answers(resume_path)
        # Load original files from the partial save
        with open(resume_path) as f:
            partial_data = json.load(f)
        if not args.files:
            args.files = partial_data.get("meta", {}).get("source_files", [])
        print(f"{C.GREEN}Resuming with {len(resume_answers)} previous answers{C.RESET}")

    if not args.files:
        parser.print_help()
        print(f"\n{C.RED}Error: No question files specified.{C.RESET}")
        sys.exit(1)

    # Load questions
    meta, sections = load_questions(args.files)
    flat = flatten_questions(sections)

    if not flat:
        print(f"{C.RED}Error: No questions found in the provided files.{C.RESET}")
        sys.exit(1)

    # Check for existing partial save to auto-resume
    if not resume_answers:
        resume_file = find_resume_file(output_dir, meta["title"])
        if resume_file:
            print(f"\n  {C.YELLOW}Found partial save: {resume_file.name}{C.RESET}")
            sys.stdout.write(f"  Resume where you left off? [Y/n] ")
            sys.stdout.flush()
            key = read_key()
            print()
            if key != 'n' and key != 'N':
                resume_answers = load_partial_answers(resume_file)
                print(f"  {C.GREEN}Loaded {len(resume_answers)} previous answers{C.RESET}")

    # Set up clean exit on Ctrl+C
    def handle_sigint(sig, frame):
        print(f"\n\n  {C.YELLOW}Interrupted. Saving progress...{C.RESET}")
        if 'answers' in dir():
            save_answers(meta, sections, flat, {}, output_dir, partial=True)
        sys.exit(130)

    signal.signal(signal.SIGINT, handle_sigint)

    try:
        result_path = run_interview(meta, sections, output_dir, resume_answers)
        # Print path for Claude Code to pick up
        print(f"__RESULT_PATH__:{result_path}")
    except KeyboardInterrupt:
        print(f"\n\n  {C.YELLOW}Interrupted.{C.RESET}")
        sys.exit(130)


if __name__ == "__main__":
    main()
