# BUILD SPEC — MULTI-MODEL ORCHESTRATOR v1.0
## Fan-Out to Grok + Gemini + ChatGPT + Claude Simultaneously | Zero Claude Runtime Cost
**Classification:** GREEN zone | Impact: A (Deployment), B (Revenue), C (Cost)
**Time estimate:** 30 minutes in Claude Code CLI
**Completion probability:** 92%

---

## MISSION

One command. Four models run simultaneously. Results stored locally. Disagreements highlighted. No Claude at runtime — pure Python with direct API keys. Cost = raw API rates only.

```bash
ask "analyze this legal argument for weaknesses"
# → Fans out to Grok, Gemini, GPT-4o, Claude Opus simultaneously
# → Stores results in ~/MASTER_RULES/model_runs/2026-03-28/
# → Prints consensus + disagreement matrix in terminal
# → PDF report generated automatically
```

---

## ARCHITECTURE OVERVIEW

```
CLI: ask "your question" [--models grok,gemini,gpt,claude] [--mode compare|consensus|vote]
       ↓
orchestrator.py
       ↓
┌──────┬──────────┬────────────┬──────────────┐
│ Grok │ Gemini   │ GPT-4o     │ Claude Opus  │
│ xAI  │ Google   │ OpenAI     │ Anthropic    │
│ API  │ API      │ API        │ API          │
└──────┴──────────┴────────────┴──────────────┘
       ↓ (all parallel via asyncio)
response_collector.py
       ↓
consensus_engine.py → agreement %, outlier detection
       ↓
diff_analyzer.py → key disagreement extraction
       ↓
pdf_generator.py → full report with all 4 responses
       ↓
storage_writer.py → ~/MASTER_RULES/model_runs/YYYY-MM-DD/HH-MM-SS/
       ↓
terminal_display.py → clean summary + PDF path
```

---

## FILE STRUCTURE

```
~/MASTER_RULES/multi-model-orchestrator/
├── orchestrator.py           # Main entry point + asyncio fan-out
├── models/
│   ├── __init__.py
│   ├── grok_client.py        # xAI Grok API
│   ├── gemini_client.py      # Google Gemini API
│   ├── gpt_client.py         # OpenAI GPT-4o API
│   └── claude_client.py      # Anthropic Claude Opus API
├── analysis/
│   ├── __init__.py
│   ├── consensus_engine.py   # Agreement scoring, outlier detection
│   ├── diff_analyzer.py      # Sentence-level disagreement extraction
│   └── vote_engine.py        # Majority vote on binary questions
├── output/
│   ├── __init__.py
│   ├── pdf_generator.py      # ReportLab PDF with all responses
│   ├── terminal_display.py   # Clean terminal summary
│   └── storage_writer.py     # JSONL + PDF to disk
├── config/
│   └── models.json           # Model params per provider
├── install.sh
├── ask                       # Shell wrapper (symlinked to /usr/local/bin/ask)
└── README.md
```

---

## MODULE SPECIFICATIONS

### 1. orchestrator.py — Main Entry Point

```python
#!/usr/bin/env python3
"""
orchestrator.py — Multi-Model Fan-Out Orchestrator
Usage: python3 orchestrator.py "your question" [--models grok,gemini,gpt,claude] [--mode compare]
Or via shell wrapper: ask "your question"
"""

import asyncio
import argparse
import os
import sys
import time
from pathlib import Path
from datetime import datetime

# Add package to path
sys.path.insert(0, str(Path(__file__).parent))

from models.grok_client import query_grok
from models.gemini_client import query_gemini
from models.gpt_client import query_gpt
from models.claude_client import query_claude
from analysis.consensus_engine import compute_consensus
from analysis.diff_analyzer import extract_disagreements
from analysis.vote_engine import run_vote
from output.pdf_generator import generate_pdf
from output.terminal_display import display_results
from output.storage_writer import write_results

# Available models
MODEL_REGISTRY = {
    "grok":   query_grok,
    "gemini": query_gemini,
    "gpt":    query_gpt,
    "claude": query_claude
}

async def fan_out(prompt: str, models: list, mode: str) -> dict:
    """
    Fan out to all models simultaneously.
    Returns dict: {model_name: {response, tokens, latency_ms, error}}
    """
    print(f"\n[ORCHESTRATOR] Fanning out to {len(models)} models simultaneously...")
    print(f"  Models: {', '.join(m.upper() for m in models)}")
    print(f"  Mode: {mode.upper()}")
    print(f"  Prompt: {prompt[:80]}{'...' if len(prompt) > 80 else ''}\n")

    start_time = time.time()

    # Create tasks for all models simultaneously
    tasks = {}
    for model_name in models:
        if model_name not in MODEL_REGISTRY:
            print(f"  [WARN] Unknown model: {model_name}. Skipping.")
            continue
        tasks[model_name] = asyncio.create_task(
            MODEL_REGISTRY[model_name](prompt),
            name=model_name
        )

    # Gather all results (errors won't stop others)
    results = {}
    responses = await asyncio.gather(*tasks.values(), return_exceptions=True)

    for model_name, response in zip(tasks.keys(), responses):
        if isinstance(response, Exception):
            results[model_name] = {
                "response": None,
                "tokens": 0,
                "latency_ms": 0,
                "error": str(response)
            }
            print(f"  [{model_name.upper()}] ERROR: {response}")
        else:
            results[model_name] = response
            latency = results[model_name].get("latency_ms", 0)
            preview = results[model_name].get("response", "")[:60]
            print(f"  [{model_name.upper()}] {latency}ms — {preview}...")

    total_time = int((time.time() - start_time) * 1000)
    print(f"\n  Total wall time: {total_time}ms")

    return results

async def main():
    parser = argparse.ArgumentParser(description="Multi-Model Orchestrator")
    parser.add_argument("prompt", nargs="?", help="Question or task to send to all models")
    parser.add_argument("--models", default="grok,gemini,gpt,claude",
                        help="Comma-separated list of models (default: all)")
    parser.add_argument("--mode", default="compare",
                        choices=["compare", "consensus", "vote"],
                        help="Analysis mode (default: compare)")
    parser.add_argument("--no-pdf", action="store_true", help="Skip PDF generation")
    parser.add_argument("--domain", default=None,
                        help="Domain hint: legal|business|technical|research")

    args = parser.parse_args()

    # Get prompt from args or stdin
    if args.prompt:
        prompt = args.prompt
    else:
        print("Enter prompt (Ctrl+D to submit):")
        prompt = sys.stdin.read().strip()

    if not prompt:
        print("[ERROR] No prompt provided.")
        sys.exit(1)

    # Load environment
    models_list = [m.strip() for m in args.models.split(",")]

    # Fan out
    results = await fan_out(prompt, models_list, args.mode)

    # Analysis
    successful = {k: v for k, v in results.items() if v.get("response")}

    if len(successful) == 0:
        print("[ERROR] All model calls failed. Check API keys.")
        sys.exit(1)

    consensus = compute_consensus(successful)
    disagreements = extract_disagreements(successful)

    if args.mode == "vote":
        vote_result = run_vote(successful, prompt)
    else:
        vote_result = None

    # Display in terminal
    display_results(
        prompt=prompt,
        results=results,
        consensus=consensus,
        disagreements=disagreements,
        vote_result=vote_result,
        mode=args.mode
    )

    # Write to disk
    run_dir = write_results(
        prompt=prompt,
        results=results,
        consensus=consensus,
        disagreements=disagreements,
        models=models_list,
        mode=args.mode,
        domain=args.domain
    )

    # Generate PDF
    if not args.no_pdf:
        pdf_path = generate_pdf(
            prompt=prompt,
            results=results,
            consensus=consensus,
            disagreements=disagreements,
            run_dir=run_dir
        )
        print(f"\n[PDF] Report generated: {pdf_path}")

    print(f"\n[STORAGE] Run saved to: {run_dir}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

### 2. models/grok_client.py — xAI Grok

```python
"""
grok_client.py — xAI Grok API client
API: https://api.x.ai/v1 (OpenAI-compatible)
Model: grok-3 or grok-2-1212
"""

import os
import time
from openai import AsyncOpenAI

async def query_grok(prompt: str, system: str = None) -> dict:
    """Query Grok API. Returns response dict."""
    api_key = os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY")
    if not api_key:
        raise ValueError("GROK_API_KEY not found in environment")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.x.ai/v1"
    )

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    start = time.time()
    try:
        response = await client.chat.completions.create(
            model="grok-2-1212",
            messages=messages,
            max_tokens=2048,
            temperature=0.7
        )
        latency = int((time.time() - start) * 1000)

        return {
            "model": "grok-2-1212",
            "provider": "xAI",
            "response": response.choices[0].message.content,
            "tokens": response.usage.total_tokens if response.usage else 0,
            "latency_ms": latency,
            "error": None
        }
    except Exception as e:
        return {
            "model": "grok-2-1212",
            "provider": "xAI",
            "response": None,
            "tokens": 0,
            "latency_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }
```

---

### 3. models/gemini_client.py — Google Gemini

```python
"""
gemini_client.py — Google Gemini API client
"""

import os
import time
import google.generativeai as genai

async def query_gemini(prompt: str, system: str = None) -> dict:
    """Query Gemini API. Returns response dict."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_AI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system or "You are a highly capable analytical assistant."
    )

    start = time.time()
    try:
        # Gemini doesn't have native async in all versions, use run_in_executor pattern
        import asyncio
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(prompt)
        )
        latency = int((time.time() - start) * 1000)

        return {
            "model": "gemini-2.0-flash",
            "provider": "Google",
            "response": response.text,
            "tokens": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') else 0,
            "latency_ms": latency,
            "error": None
        }
    except Exception as e:
        return {
            "model": "gemini-2.0-flash",
            "provider": "Google",
            "response": None,
            "tokens": 0,
            "latency_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }
```

---

### 4. models/gpt_client.py — OpenAI GPT-4o

```python
"""
gpt_client.py — OpenAI GPT-4o client
"""

import os
import time
from openai import AsyncOpenAI

async def query_gpt(prompt: str, system: str = None) -> dict:
    """Query OpenAI GPT-4o. Returns response dict."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment")

    client = AsyncOpenAI(api_key=api_key)

    messages = [
        {"role": "system", "content": system or "You are a highly capable analytical assistant."},
        {"role": "user", "content": prompt}
    ]

    start = time.time()
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=2048,
            temperature=0.7
        )
        latency = int((time.time() - start) * 1000)

        return {
            "model": "gpt-4o",
            "provider": "OpenAI",
            "response": response.choices[0].message.content,
            "tokens": response.usage.total_tokens,
            "latency_ms": latency,
            "error": None
        }
    except Exception as e:
        return {
            "model": "gpt-4o",
            "provider": "OpenAI",
            "response": None,
            "tokens": 0,
            "latency_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }
```

---

### 5. models/claude_client.py — Anthropic Claude Opus

```python
"""
claude_client.py — Anthropic Claude Opus client
Note: Only use when claude is selected. This is the ONE runtime Claude cost.
"""

import os
import time
import anthropic

async def query_claude(prompt: str, system: str = None) -> dict:
    """Query Claude Opus. Returns response dict."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not found in environment")

    client = anthropic.Anthropic(api_key=api_key)

    start = time.time()
    try:
        import asyncio
        loop = asyncio.get_event_loop()

        def _call():
            return client.messages.create(
                model="claude-opus-4-6",
                max_tokens=2048,
                system=system or "You are a highly capable analytical assistant.",
                messages=[{"role": "user", "content": prompt}]
            )

        response = await loop.run_in_executor(None, _call)
        latency = int((time.time() - start) * 1000)

        return {
            "model": "claude-opus-4-6",
            "provider": "Anthropic",
            "response": response.content[0].text,
            "tokens": response.usage.input_tokens + response.usage.output_tokens,
            "latency_ms": latency,
            "error": None
        }
    except Exception as e:
        return {
            "model": "claude-opus-4-6",
            "provider": "Anthropic",
            "response": None,
            "tokens": 0,
            "latency_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }
```

---

### 6. analysis/consensus_engine.py — Agreement Scoring

```python
"""
consensus_engine.py — Compute agreement across model responses
Uses sentence-level TF-IDF similarity for semantic agreement scoring
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import Dict

def compute_consensus(results: Dict[str, dict]) -> dict:
    """
    Compute pairwise agreement between all model responses.
    Returns consensus dict with agreement matrix and overall score.
    """
    models = list(results.keys())
    responses = [results[m]["response"] for m in models]

    if len(responses) < 2:
        return {"overall_agreement": 1.0, "matrix": {}, "outlier": None}

    # TF-IDF vectorization
    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        tfidf_matrix = vectorizer.fit_transform(responses)
        similarity_matrix = cosine_similarity(tfidf_matrix)
    except Exception:
        return {"overall_agreement": 0.5, "matrix": {}, "outlier": None}

    # Build agreement matrix
    agreement_matrix = {}
    for i, m1 in enumerate(models):
        agreement_matrix[m1] = {}
        for j, m2 in enumerate(models):
            if i != j:
                agreement_matrix[m1][m2] = round(float(similarity_matrix[i][j]), 3)

    # Overall agreement = mean of all pairwise similarities (excluding diagonal)
    pairs = []
    for i in range(len(models)):
        for j in range(i + 1, len(models)):
            pairs.append(similarity_matrix[i][j])

    overall = round(float(np.mean(pairs)), 3) if pairs else 0.5

    # Detect outlier = model with lowest average similarity to others
    avg_similarities = {}
    for i, m in enumerate(models):
        others = [similarity_matrix[i][j] for j in range(len(models)) if j != i]
        avg_similarities[m] = np.mean(others)

    outlier = min(avg_similarities, key=avg_similarities.get) if len(models) > 2 else None
    outlier_score = avg_similarities.get(outlier, 0)

    # Only flag as outlier if significantly different
    if outlier_score > overall * 0.7:
        outlier = None

    return {
        "overall_agreement": overall,
        "matrix": agreement_matrix,
        "outlier": outlier,
        "outlier_score": outlier_score if outlier else None,
        "interpretation": _interpret_agreement(overall)
    }

def _interpret_agreement(score: float) -> str:
    if score >= 0.80: return "STRONG CONSENSUS — Models agree on substance"
    if score >= 0.60: return "MODERATE AGREEMENT — Minor differences in framing"
    if score >= 0.40: return "MIXED — Significant differences worth examining"
    return "LOW AGREEMENT — Models disagree fundamentally. Review all responses."
```

---

### 7. output/pdf_generator.py — Full PDF Report

```python
"""
pdf_generator.py — Generate PDF report with all model responses
Uses ReportLab. One PDF per orchestrator run.
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                  TableStyle, HRFlowable, PageBreak)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from datetime import datetime
from pathlib import Path
import os

# Color palette
C_BLACK = colors.HexColor("#0A0A0A")
C_DARK = colors.HexColor("#1A1A2E")
C_ACCENT = colors.HexColor("#E94560")
C_BLUE = colors.HexColor("#0F3460")
C_LIGHT = colors.HexColor("#F5F5F5")
C_GRAY = colors.HexColor("#888888")
C_GREEN = colors.HexColor("#2ECC71")
C_YELLOW = colors.HexColor("#F39C12")
C_RED = colors.HexColor("#E74C3C")

MODEL_COLORS = {
    "grok": colors.HexColor("#1DA1F2"),
    "gemini": colors.HexColor("#4285F4"),
    "gpt": colors.HexColor("#10A37F"),
    "claude": colors.HexColor("#D4A017")
}

def generate_pdf(prompt: str, results: dict, consensus: dict,
                  disagreements: list, run_dir: Path) -> str:
    """Generate full PDF report. Returns path to PDF."""

    pdf_path = str(run_dir / "model_comparison_report.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=22,
        textColor=C_DARK,
        spaceAfter=6,
        fontName="Helvetica-Bold"
    )
    header_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading1"],
        fontSize=14,
        textColor=C_ACCENT,
        spaceBefore=16,
        spaceAfter=6,
        fontName="Helvetica-Bold"
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        textColor=C_BLACK,
        leading=15,
        alignment=TA_JUSTIFY,
        fontName="Helvetica"
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=C_GRAY,
        fontName="Helvetica"
    )
    model_header_style = ParagraphStyle(
        "ModelHeader",
        parent=styles["Heading2"],
        fontSize=13,
        spaceBefore=12,
        spaceAfter=4,
        fontName="Helvetica-Bold"
    )

    # HEADER
    story.append(Paragraph("MULTI-MODEL INTELLIGENCE REPORT", title_style))
    story.append(Paragraph(
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | "
        f"Models: {', '.join(results.keys()).upper()} | "
        f"Consensus: {int(consensus['overall_agreement'] * 100)}%",
        meta_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=C_ACCENT, spaceAfter=12))

    # PROMPT
    story.append(Paragraph("PROMPT", header_style))
    story.append(Paragraph(prompt, body_style))
    story.append(Spacer(1, 12))

    # CONSENSUS SUMMARY
    story.append(Paragraph("CONSENSUS ANALYSIS", header_style))
    agreement_pct = int(consensus["overall_agreement"] * 100)
    interp = consensus.get("interpretation", "")
    outlier = consensus.get("outlier")

    # Agreement indicator color
    agree_color = C_GREEN if agreement_pct >= 70 else (C_YELLOW if agreement_pct >= 50 else C_RED)

    summary_data = [
        ["Overall Agreement", f"{agreement_pct}%"],
        ["Interpretation", interp],
        ["Outlier Model", outlier.upper() if outlier else "None detected"],
    ]
    summary_table = Table(summary_data, colWidths=[2 * inch, 4.75 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("TEXTCOLOR", (1, 0), (1, 0), agree_color),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_GRAY),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 12))

    # MODEL PERFORMANCE TABLE
    story.append(Paragraph("MODEL PERFORMANCE", header_style))
    perf_headers = ["Model", "Provider", "Latency (ms)", "Tokens", "Status"]
    perf_data = [perf_headers]

    for model_name, result in results.items():
        status = "OK" if result.get("response") else f"ERROR: {result.get('error', 'Unknown')[:30]}"
        perf_data.append([
            model_name.upper(),
            result.get("provider", "?"),
            str(result.get("latency_ms", "?")),
            str(result.get("tokens", "?")),
            status
        ])

    perf_table = Table(perf_data, colWidths=[1.0*inch, 1.2*inch, 1.2*inch, 1.0*inch, 2.35*inch])
    perf_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, C_GRAY),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(perf_table)

    # MODEL RESPONSES — one section per model
    story.append(PageBreak())
    story.append(Paragraph("MODEL RESPONSES", header_style))
    story.append(HRFlowable(width="100%", thickness=1, color=C_GRAY, spaceAfter=8))

    for model_name, result in results.items():
        model_color = MODEL_COLORS.get(model_name, C_DARK)
        provider = result.get("provider", "Unknown")

        # Model header with color
        model_hdr = ParagraphStyle(
            f"Model_{model_name}",
            parent=model_header_style,
            textColor=model_color,
        )
        story.append(Paragraph(
            f"{model_name.upper()} — {provider} | {result.get('latency_ms', '?')}ms | {result.get('tokens', '?')} tokens",
            model_hdr
        ))
        story.append(HRFlowable(width="100%", thickness=1, color=model_color, spaceAfter=6))

        if result.get("response"):
            # Escape XML chars for ReportLab
            response_text = result["response"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            for para in response_text.split("\n\n"):
                if para.strip():
                    story.append(Paragraph(para.strip(), body_style))
                    story.append(Spacer(1, 4))
        else:
            story.append(Paragraph(f"[ERROR] {result.get('error', 'No response')}", body_style))

        story.append(Spacer(1, 16))

    # DISAGREEMENTS SECTION
    if disagreements:
        story.append(PageBreak())
        story.append(Paragraph("KEY DISAGREEMENTS", header_style))
        story.append(Paragraph(
            "Points where models gave meaningfully different answers:",
            meta_style
        ))
        story.append(Spacer(1, 8))

        for i, item in enumerate(disagreements[:10]):  # Top 10 disagreements
            story.append(Paragraph(
                f"{i+1}. {item.get('topic', 'Topic')}",
                ParagraphStyle("DisagreeTopic", parent=body_style,
                               fontName="Helvetica-Bold", textColor=C_ACCENT)
            ))
            for model_name, view in item.get("positions", {}).items():
                story.append(Paragraph(
                    f"  {model_name.upper()}: {view[:200]}",
                    meta_style
                ))
            story.append(Spacer(1, 8))

    # Build PDF
    doc.build(story)
    return pdf_path
```

---

### 8. output/terminal_display.py — Terminal Summary

```python
"""
terminal_display.py — Clean terminal output
"""

BOLD = "\033[1m"
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BLUE = "\033[94m"
RESET = "\033[0m"
DIM = "\033[2m"

MODEL_COLORS = {
    "grok": CYAN,
    "gemini": BLUE,
    "gpt": GREEN,
    "claude": YELLOW
}

def display_results(prompt, results, consensus, disagreements, vote_result, mode):
    """Print clean terminal summary of all results."""

    width = 80
    sep = "─" * width

    print(f"\n{sep}")
    print(f"{BOLD}MULTI-MODEL ORCHESTRATOR — {mode.upper()} MODE{RESET}")
    print(sep)

    # Agreement bar
    agreement_pct = int(consensus["overall_agreement"] * 100)
    bar_filled = int(agreement_pct * 40 / 100)
    bar = "█" * bar_filled + "░" * (40 - bar_filled)
    color = GREEN if agreement_pct >= 70 else (YELLOW if agreement_pct >= 50 else RED)
    print(f"  Consensus: {color}[{bar}] {agreement_pct}%{RESET}  {DIM}{consensus.get('interpretation', '')}{RESET}")

    if consensus.get("outlier"):
        print(f"  Outlier: {RED}{consensus['outlier'].upper()}{RESET} diverged from other models")

    print(sep)

    # Per-model quick summary
    for model_name, result in results.items():
        mc = MODEL_COLORS.get(model_name, CYAN)
        if result.get("response"):
            preview = result["response"][:120].replace("\n", " ")
            tokens = result.get("tokens", "?")
            latency = result.get("latency_ms", "?")
            print(f"\n  {mc}{BOLD}[{model_name.upper()}]{RESET} {DIM}{latency}ms | {tokens} tokens{RESET}")
            print(f"  {preview}...")
        else:
            print(f"\n  {RED}{BOLD}[{model_name.upper()}] FAILED:{RESET} {result.get('error', 'Unknown error')}")

    print(f"\n{sep}")

    # Vote result if applicable
    if vote_result:
        print(f"\n  Vote result: {BOLD}{vote_result['winner'].upper()}{RESET} ({vote_result['votes']}/{vote_result['total']} models)")
```

---

### 9. output/storage_writer.py — Disk Storage

```python
"""
storage_writer.py — Write results to disk
Location: ~/MASTER_RULES/model_runs/YYYY-MM-DD/HH-MM-SS/
"""

import json
from datetime import datetime
from pathlib import Path

BASE_DIR = Path.home() / "MASTER_RULES" / "model_runs"

def write_results(prompt, results, consensus, disagreements,
                   models, mode, domain=None) -> Path:
    """Write all results to structured directory. Returns run_dir Path."""

    now = datetime.now()
    run_dir = BASE_DIR / now.strftime("%Y-%m-%d") / now.strftime("%H-%M-%S")
    run_dir.mkdir(parents=True, exist_ok=True)

    # Master JSONL entry
    master = {
        "ts": now.isoformat(),
        "prompt": prompt,
        "models": models,
        "mode": mode,
        "domain": domain,
        "consensus": consensus,
        "results": {
            k: {
                "response": v.get("response"),
                "tokens": v.get("tokens"),
                "latency_ms": v.get("latency_ms"),
                "error": v.get("error"),
                "model": v.get("model"),
                "provider": v.get("provider")
            }
            for k, v in results.items()
        }
    }

    # Write master JSON
    with open(run_dir / "run.json", "w") as f:
        json.dump(master, f, indent=2)

    # Write individual response files for easy reading
    for model_name, result in results.items():
        if result.get("response"):
            with open(run_dir / f"{model_name}_response.txt", "w") as f:
                f.write(result["response"])

    # Append to master log
    master_log = BASE_DIR / "all_runs.jsonl"
    with open(master_log, "a") as f:
        f.write(json.dumps({
            "ts": now.isoformat(),
            "prompt_preview": prompt[:100],
            "models": models,
            "consensus": consensus["overall_agreement"],
            "run_dir": str(run_dir)
        }) + "\n")

    return run_dir
```

---

### 10. install.sh — One-Command Setup

```bash
#!/bin/bash
# install.sh — Multi-Model Orchestrator installer
# Run: bash ~/MASTER_RULES/multi-model-orchestrator/install.sh

set -e

echo "=== MULTI-MODEL ORCHESTRATOR v1.0 INSTALLER ==="
echo ""

source ~/MASTER_RULES/load_secrets.sh

echo "[1/5] Installing Python dependencies..."
pip install anthropic openai google-generativeai scikit-learn reportlab --break-system-packages --quiet

echo "[2/5] Creating storage directories..."
mkdir -p ~/MASTER_RULES/model_runs
touch ~/MASTER_RULES/model_runs/all_runs.jsonl

echo "[3/5] Verifying API keys..."
[ -n "$ANTHROPIC_API_KEY" ] && echo "  [OK] ANTHROPIC_API_KEY" || echo "  [MISSING] ANTHROPIC_API_KEY"
[ -n "$OPENAI_API_KEY" ] && echo "  [OK] OPENAI_API_KEY" || echo "  [MISSING] OPENAI_API_KEY"
[ -n "$GEMINI_API_KEY" ] && echo "  [OK] GEMINI_API_KEY" || echo "  [MISSING] GEMINI_API_KEY"
[ -n "$GROK_API_KEY" ] && echo "  [OK] GROK_API_KEY" || echo "  [MISSING] GROK_API_KEY"

echo "[4/5] Installing 'ask' shell wrapper..."
cat > ~/MASTER_RULES/multi-model-orchestrator/ask << 'EOF'
#!/bin/bash
source ~/MASTER_RULES/load_secrets.sh
python3 ~/MASTER_RULES/multi-model-orchestrator/orchestrator.py "$@"
EOF
chmod +x ~/MASTER_RULES/multi-model-orchestrator/ask
sudo ln -sf ~/MASTER_RULES/multi-model-orchestrator/ask /usr/local/bin/ask
echo "  → 'ask' command installed globally"

echo "[5/5] Test run (Grok + GPT only, 3 seconds)..."
python3 ~/MASTER_RULES/multi-model-orchestrator/orchestrator.py \
  "In one sentence, what is 2+2?" \
  --models grok,gpt \
  --no-pdf

echo ""
echo "=== INSTALL COMPLETE ==="
echo "Usage:"
echo "  ask 'your question'"
echo "  ask 'legal strategy for federal case' --models grok,gemini,gpt,claude --mode compare"
echo "  ask 'should I settle?' --mode vote --domain legal"
echo ""
echo "All runs saved to: ~/MASTER_RULES/model_runs/"
```

---

## USAGE PATTERNS

```bash
# Standard comparison — all 4 models
ask "what are the strongest defenses against 26 USC 7201 charges?"

# Vote mode — majority answer on binary question
ask "should I file a motion to suppress before depositions?" --mode vote --domain legal

# Cost-conscious — skip Claude at runtime
ask "analyze this business pitch" --models grok,gemini,gpt

# Quick two-model spot check
ask "is this contract clause enforceable?" --models gpt,claude --no-pdf

# Full deep research — all models + PDF
ask "comprehensive EBITDA optimization strategy for a $2M ARR SaaS" \
  --models grok,gemini,gpt,claude \
  --mode compare \
  --domain business
```

---

## PRE-LAUNCH ERROR PREVENTION

| Error | Probability | Prevention |
|-------|------------|------------|
| Missing API keys | HIGH | Verify all 4 keys in SECRETS.env before install |
| Grok API key name mismatch | HIGH | Check: `GROK_API_KEY` or `XAI_API_KEY` — code handles both |
| google-generativeai async issue | MEDIUM | `run_in_executor` pattern used — handles non-async SDK |
| ReportLab color object error | MEDIUM | Use `colors.HexColor()` not plain strings |
| `ask` symlink permission denied | LOW | Script uses `sudo ln -sf` — enter password when prompted |
| All models timeout simultaneously | LOW | Each model has independent error handling — others continue |
| PDF path permissions | LOW | Writes to ~/MASTER_RULES/ which you own |

---

## HOW TO BUILD IN CLAUDE CODE CLI

Paste this exact command:

```
Build the Multi-Model Orchestrator exactly as specified in BUILD_SPEC_MULTI_MODEL.md.
Create all files in ~/MASTER_RULES/multi-model-orchestrator/.
Then run install.sh.
Then test with: ask "what is the capital of France?" --models grok,gpt --no-pdf
```

**Time:** 30 minutes
**Probability:** 92%

---

## COST MODEL PER RUN

| Models | Avg tokens | Est. cost |
|--------|-----------|-----------|
| Grok only | ~1,500 | ~$0.005 |
| GPT-4o only | ~1,500 | ~$0.015 |
| Gemini only | ~1,500 | ~$0.002 |
| Claude Opus only | ~1,500 | ~$0.025 |
| All 4 models | ~6,000 total | ~$0.047 |

**4 models simultaneously = ~$0.05/query. No Claude middleware. No subscription markup.**
