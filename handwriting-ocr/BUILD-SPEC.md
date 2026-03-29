# HANDWRITING OCR SKILL -- BUILD SPEC

## MISSION

Build a skill at `~/MASTER_RULES/skills/handwriting-ocr/` that takes photographs of handwritten documents and produces 99%+ accurate transcriptions. The tool must handle blue pen on white/lined paper, text bleeding through from reverse sides, angled photographs, and mixed handwriting styles (print + cursive).

## ARCHITECTURE

```
handwriting-ocr/
├── SKILL.md
├── scripts/
│   ├── preprocess.py        # OpenCV image cleaning pipeline
│   ├── segment.py           # Intelligent page segmentation into zones
│   ├── ocr_engine.py        # Multi-LLM ensemble OCR
│   ├── reconcile.py         # Diff + confidence scoring
│   ├── run.py               # CLI entry point
│   └── requirements.txt
├── references/
│   └── PREPROCESSING.md     # OpenCV parameter reference
└── assets/
    └── test_images/          # For validation
```

## DEPENDENCIES

```
opencv-python>=4.9.0
Pillow>=10.0.0
numpy>=1.24.0
anthropic>=0.40.0
openai>=1.50.0
```

Do NOT use Tesseract, EasyOCR, or PaddleOCR. They are garbage on handwriting. The OCR engines are Claude and GPT-4o vision APIs only.

API keys are available via environment:
- `ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}`
- `OPENAI_API_KEY=${OPENAI_API_KEY}`

Or load via: `source ~/MASTER_RULES/load_secrets.sh`

---

## MODULE 1: preprocess.py -- IMAGE CLEANING PIPELINE

This is the most critical module. Bad preprocessing = bad reads. Every step must be tunable.

### Step 1: Load and Orient
- Read image with OpenCV
- Auto-detect orientation using contour analysis or Hough line transform
- Deskew: compute skew angle from text line detection, rotate to correct
- If image is sideways or upside down (>45 degree rotation), detect and fix

### Step 2: Blue Ink Isolation (THE KEY INNOVATION)
The primary error source in handwritten document photos is bleed-through from the reverse side. Blue ink isolation eliminates this entirely.

```python
# Convert to HSV color space
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

# Blue ink range -- these MUST be tuned carefully
# Blue pen ink typically falls in:
# Hue: 90-140 (blue range in OpenCV's 0-180 scale)
# Saturation: 30-255 (ink has moderate to high saturation)
# Value: 20-200 (not too bright, not too dark)
lower_blue = np.array([90, 30, 20])
upper_blue = np.array([140, 255, 200])

# Create mask
blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)

# Also capture dark blue/black that some pens produce
# Some blue pens write very dark, almost black
lower_dark_blue = np.array([85, 15, 10])
upper_dark_blue = np.array([145, 255, 255])
dark_mask = cv2.inRange(hsv, lower_dark_blue, upper_dark_blue)

# Combine masks
combined_mask = cv2.bitwise_or(blue_mask, dark_mask)

# Apply morphological operations to connect broken strokes
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)

# Create clean output: white background with dark text
result = np.full_like(image, 255)  # white background
result[combined_mask > 0] = [30, 30, 30]  # dark text where ink was detected
```

IMPORTANT: Also provide a fallback mode for BLACK ink documents. Detect ink color automatically by sampling the darkest non-background pixels and checking their hue distribution. If mostly blue -> blue isolation. If achromatic -> standard grayscale thresholding.

### Step 3: Line Detection and Removal
Lined paper creates noise. Remove printed lines:
- Use horizontal Hough line detection
- Lines are thin, evenly spaced, and span the page width
- Remove detected lines but preserve text that overlaps them (morphological reconstruction)
- Be careful: descenders (g, y, p, q, j) cross lines. Use connected component analysis to preserve letter strokes.

### Step 4: Contrast Enhancement
- Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
- Parameters: clipLimit=2.0, tileGridSize=(8,8)
- This normalizes uneven lighting from phone camera flash/shadows

### Step 5: Noise Reduction
- Bilateral filter to smooth while preserving edges: cv2.bilateralFilter(img, 9, 75, 75)
- Small connected component removal (components < 50 pixels are noise/dust)

### Step 6: Sharpening
- Unsharp mask: subtract Gaussian blur from original, add back with weight
- This recovers fine stroke details lost in denoising

### Step 7: Output
- Save preprocessed image as high-quality PNG (lossless)
- Also save the blue-isolation mask as a separate diagnostic image
- Return both the cleaned image path and a quality score (0-100) based on contrast ratio and noise level

---

## MODULE 2: segment.py -- INTELLIGENT PAGE SEGMENTATION

Full-page OCR is unreliable. The solution is to segment pages into logical zones and process each zone independently.

### Detection Strategy

1. **Whitespace Analysis**: Scan horizontally and vertically for gaps. Large horizontal whitespace = section break. Large vertical whitespace = column break.

2. **Content Type Detection**: Classify each zone as one of:
   - `text_block` -- paragraph of continuous handwriting
   - `list` -- indented or bulleted items
   - `table` -- grid/columnar data
   - `diagram` -- non-text visual (mind map, flowchart, arrows)
   - `header` -- large/bold text at top of sections
   - `margin_note` -- text in margins, typically smaller
   - `bleed_through` -- ghost text from reverse (should be discarded after blue isolation)

3. **Reading Order**: Determine natural reading order. For Western handwriting:
   - Top to bottom, left to right by default
   - Detect columns: if content has vertical whitespace channel in middle, split into left/right columns
   - Headers come before their content blocks
   - Margin notes are associated with adjacent main text

4. **Zone Extraction**: For each detected zone:
   - Crop with 10% padding on all sides (handwriting often has ascenders/descenders at edges)
   - Track bounding box coordinates for reassembly
   - Assign zone_id and zone_type

5. **Output**: JSON manifest of all zones with:
```json
{
  "source_image": "path/to/original.jpg",
  "preprocessed_image": "path/to/cleaned.png",
  "page_dimensions": [width, height],
  "zones": [
    {
      "zone_id": 1,
      "zone_type": "header",
      "bbox": [x1, y1, x2, y2],
      "crop_path": "path/to/zone_1.png",
      "reading_order": 1,
      "confidence": 0.95
    }
  ]
}
```

### Special Handling for Mind Maps / Diagrams (CRITICAL)

The documents include hand-drawn mind maps with:
- Central node (circled text)
- Radiating lines/arrows to satellite nodes
- Labels on or near connecting lines
- Nested hierarchies

For diagram zones:
- Do NOT attempt line-by-line OCR
- Instead, send the entire diagram zone to the LLM with a specialized prompt (see Module 3)
- The LLM is better at understanding spatial relationships than any segmentation algorithm

---

## MODULE 3: ocr_engine.py -- MULTI-LLM ENSEMBLE

### Architecture

Run each zone through BOTH Claude (claude-sonnet-4-20250514) and GPT-4o in parallel. Compare outputs. Agreement = high confidence. Disagreement = flag for review.

### API Call Structure

For each zone crop, send to both APIs with a carefully crafted prompt. THE PROMPT IS EVERYTHING. A bad prompt with perfect preprocessing still fails.

### Text Block Prompt (for zone_type = text_block, list, header, margin_note)

```
You are an expert handwriting transcription specialist. You are reading a preprocessed
crop from a handwritten document. The image has been cleaned: blue ink isolated on white
background, lines removed, contrast enhanced.

TRANSCRIPTION RULES:
1. Transcribe EXACTLY what is written. Do not correct spelling, grammar, or abbreviations.
2. If a word is unclear, provide your best read followed by [?] -- example: "Feudaman[?]"
3. Preserve the original structure: line breaks where the writer broke lines, indentation
   where indented, underlining noted as __underlined text__.
4. For crossed-out or struck-through text, transcribe as ~~struck text~~
5. For circled text, transcribe as ((circled text))
6. For text with arrows pointing to other text, note as: "text1 --> text2"
7. For numbered or bulleted lists, preserve the numbering/bullet style exactly
8. Abbreviations: transcribe as written. "govt" stays "govt", not "government"
9. If you see symbols: &, +, =, /, |, transcribe them as-is
10. For dollar amounts, transcribe exactly: "$5k" not "$5,000" unless written that way
11. Differentiate between:
    - Capital letters and lowercase
    - Periods, commas, and dashes
    - Parentheses and brackets
12. If text runs into the margin or is cut off, note with [cut off]
13. DO NOT add any text that is not in the image
14. DO NOT interpret or summarize -- transcribe verbatim
15. For multi-column layouts, transcribe left column first, then right column,
    clearly marking: === LEFT COLUMN === and === RIGHT COLUMN ===

OUTPUT FORMAT:
Return ONLY the transcription. No preamble, no commentary, no "Here is the transcription:"
Just the text as written.
```

### Table/Grid Prompt (for zone_type = table)

```
You are transcribing a handwritten table or grid of data from a preprocessed document image.

RULES:
1. Identify all column headers and row labels
2. Transcribe each cell value exactly as written
3. If a cell is empty, use [empty]
4. If a value is unclear, append [?]
5. Preserve the tabular structure using pipe-delimited format:
   | Header1 | Header2 | Header3 |
   | val1    | val2    | val3    |
6. For cells with multiple lines, separate with /
7. Dollar amounts, percentages, abbreviations: transcribe as written

OUTPUT FORMAT:
Return ONLY the table in pipe-delimited format. No commentary.
```

### Diagram/Mind Map Prompt (for zone_type = diagram)

```
You are transcribing a hand-drawn diagram, mind map, or flowchart from a preprocessed
document image.

RULES:
1. Identify the central node or starting point
2. Map all connections (lines, arrows) between nodes
3. Transcribe all text labels exactly as written
4. Note the direction of arrows (unidirectional or bidirectional)
5. For circled or boxed text, note the enclosure
6. For grouped items (e.g., a list branching from one node), preserve the hierarchy
7. If text is unclear, append [?]

OUTPUT FORMAT:
Use this structure:
CENTRAL NODE: [text]
CONNECTIONS:
- [central node] --> [connected node 1]
  - Sub-items under node 1:
    - item a
    - item b
- [central node] --> [connected node 2]
- [connected node 2] <--> [connected node 3] (bidirectional)

STANDALONE LABELS:
- [any text not connected to the diagram]

SPATIAL NOTES:
- [any relevant spatial information, e.g., "top-right corner contains a separate list"]
```

### Inmate Communication Form Prompt (for pre-printed forms with handwriting)

```
You are transcribing a pre-printed form that has been filled in by hand. The form has
printed text (headers, field labels, instructions) and handwritten entries.

RULES:
1. Identify all printed form fields and their labels
2. For each field, transcribe the handwritten entry exactly
3. For checkboxes, note as [checked] or [unchecked]
4. If a field is left blank, note as [blank]
5. Distinguish clearly between printed text and handwritten text
6. The form may be photographed with the text appearing reversed/mirrored
   (through the back of the page) -- only transcribe the FRONT side text
7. If you see reversed/mirror text bleeding through, IGNORE IT completely

OUTPUT FORMAT:
FORM TITLE: [title]
FIELDS:
- [field label]: [handwritten entry or blank]
- [field label]: [handwritten entry or blank]
CHECKBOXES:
- [checkbox label]: [checked/unchecked]
HANDWRITTEN NOTES (outside form fields):
- [any additional handwriting]
```

### API Call Implementation

```python
import asyncio
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
import base64

async def ocr_zone(zone_crop_path: str, zone_type: str) -> dict:
    """Send zone crop to both LLMs and return results."""

    # Select prompt based on zone type
    prompt = get_prompt_for_zone_type(zone_type)

    # Read and encode image
    with open(zone_crop_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    # Run both APIs in parallel
    claude_result, gpt_result = await asyncio.gather(
        call_claude(image_data, prompt),
        call_gpt4o(image_data, prompt),
        return_exceptions=True
    )

    return {
        "claude": claude_result if not isinstance(claude_result, Exception) else f"ERROR: {claude_result}",
        "gpt4o": gpt_result if not isinstance(gpt_result, Exception) else f"ERROR: {gpt_result}",
    }

async def call_claude(image_b64: str, prompt: str) -> str:
    client = AsyncAnthropic()
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_b64,
                    }
                },
                {"type": "text", "text": prompt}
            ]
        }]
    )
    return response.content[0].text

async def call_gpt4o(image_b64: str, prompt: str) -> str:
    client = AsyncOpenAI()
    response = await client.chat.completions.create(
        model="gpt-4o",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{image_b64}",
                        "detail": "high"
                    }
                },
                {"type": "text", "text": prompt}
            ]
        }]
    )
    return response.choices[0].message.content
```

### Rate Limiting and Cost Control
- Process zones sequentially if >20 zones (avoid rate limits)
- Log token usage per call
- Estimated cost per page: ~$0.03-0.08 (2 API calls per zone, ~3-5 zones per page)

---

## MODULE 4: reconcile.py -- DIFF AND CONFIDENCE SCORING

### Reconciliation Algorithm

For each zone, compare the Claude and GPT-4o outputs:

1. **Normalize both outputs**: strip extra whitespace, normalize unicode, lowercase for comparison (but preserve original case in output)

2. **Word-level diff**: Use Python's `difflib.SequenceMatcher` to compute similarity ratio

3. **Scoring**:
   - Agreement > 95%: HIGH confidence. Use Claude output as primary (it tends to be more precise on formatting)
   - Agreement 80-95%: MEDIUM confidence. Merge outputs -- for each disagreement, pick the reading that makes more contextual sense. Flag for optional human review.
   - Agreement < 80%: LOW confidence. Flag entire zone for REQUIRED human review. Present both readings side by side.

4. **Disagreement Resolution** (for MEDIUM confidence):
   - If one model has [?] and the other is confident, prefer the confident reading
   - If both are confident but different, run a THIRD pass: send the zone crop to Claude Opus with both readings and ask it to adjudicate:
   ```
   Two OCR engines produced different readings of this handwritten text.
   Reading A: [claude output]
   Reading B: [gpt4o output]
   Look at the image carefully and determine which reading is correct for each
   disagreement. If neither is correct, provide the correct reading.
   ```

5. **Output per zone**:
```json
{
  "zone_id": 1,
  "zone_type": "text_block",
  "final_text": "reconciled transcription",
  "confidence": "HIGH|MEDIUM|LOW",
  "confidence_score": 0.97,
  "claude_raw": "claude's original output",
  "gpt4o_raw": "gpt4o's original output",
  "disagreements": [
    {
      "position": "line 3, word 5",
      "claude_read": "Feudaman",
      "gpt4o_read": "Feudalman",
      "resolved_to": "Feudaman",
      "resolution_method": "opus_adjudication|claude_preferred|gpt_preferred|human_required"
    }
  ],
  "flags": ["human_review_recommended"]
}
```

---

## MODULE 5: run.py -- CLI ENTRY POINT

### Usage

```bash
# Single image
python run.py /path/to/photo.jpg

# Directory of images
python run.py /path/to/photos/ --output /path/to/output/

# With options
python run.py /path/to/photo.jpg \
  --ink-color auto \        # auto|blue|black
  --skip-preprocessing \    # if image is already clean
  --engines both \          # both|claude|gpt4o
  --output-format markdown \ # markdown|json|txt
  --confidence-threshold 0.8 \ # flag zones below this
  --no-adjudication \       # skip Opus tiebreaker (saves cost)
  --verbose
```

### Output Structure

For each input image, produce:
```
output/
├── photo_001/
│   ├── preprocessed.png          # Cleaned image
│   ├── blue_mask.png             # Blue ink isolation diagnostic
│   ├── zones/
│   │   ├── zone_001_header.png
│   │   ├── zone_002_text.png
│   │   └── zone_003_diagram.png
│   ├── zones_manifest.json       # Segmentation metadata
│   ├── ocr_results.json          # Full results with all readings
│   ├── transcription.md          # Final clean transcription (markdown)
│   └── review_needed.md          # Low-confidence zones needing human review
├── photo_002/
│   └── ...
└── summary.json                  # Aggregate stats across all pages
```

### transcription.md Format

```markdown
# Page: [filename]
## Transcription (Confidence: 94%)

### Section 1: [header text]
[transcribed body text]

### Section 2: [header text]
[transcribed body text]

---
### Diagram: [diagram description]
[structured diagram transcription]

---
### Flagged for Review
> Line 5: "Feudaman[?]" -- low confidence word
> Line 12: Two readings disagree -- "50k (10+40)" vs "50k (10+90)"
```

---

## MODULE 6: SKILL.md

Write the SKILL.md with this frontmatter:

```yaml
---
name: handwriting-ocr
description: >
  High-accuracy handwriting transcription from photographs of handwritten documents.
  Use this skill whenever the user uploads photos of handwritten notes, forms, letters,
  mind maps, diagrams, or any document with handwriting that needs to be digitized or
  transcribed. Also use when the user mentions OCR on handwriting, transcribing notes,
  digitizing handwritten documents, or reading handwritten text from images. This skill
  uses OpenCV preprocessing (blue ink isolation, deskew, line removal, contrast enhancement)
  combined with multi-LLM ensemble (Claude + GPT-4o) for 99%+ accuracy. It handles
  blue and black ink, lined and unlined paper, mixed print/cursive, diagrams, mind maps,
  tables, forms, and margin notes. Trigger this skill even for single handwritten words
  or short notes -- it is always better than raw LLM vision for handwriting.
---
```

The SKILL.md body should instruct the agent to:
1. Run `preprocess.py` on the uploaded image(s)
2. Run `segment.py` on the preprocessed output
3. Run `ocr_engine.py` on each zone
4. Run `reconcile.py` to produce final output
5. Present the transcription.md to the user
6. If any zones are flagged for review, show them to the user with both readings

---

## TESTING

After building, test on the 14 images in this project. The handwritten ones are the real test:
- Notes/Ideas page (blue pen, two columns, mixed formatting)
- Section 4: Operation Shock + Awe mind map (blue pen, diagram with connections)
- Section III: Reduce + Forgiven Expenses (blue pen, financial data, rotated)
- Inmate communication forms (yellow paper, pre-printed reversed text + handwritten labels)
- Section 6: Notes pages (minimal content, bleed-through heavy)

Success criteria: transcription should capture >95% of words correctly on the first pass without human correction. The remaining 5% should be flagged with [?] markers, not silently wrong.

---

## CONSTRAINTS

- Python 3.10+
- No Tesseract, no EasyOCR, no PaddleOCR
- Async where possible for API parallelism
- Total processing time per page: <30 seconds target
- Handle images up to 20MB
- Graceful error handling: if one API fails, still return the other's result
- All API keys via environment variables, never hardcoded

## BUILD ORDER

1. `requirements.txt` -- install deps first
2. `preprocess.py` -- build and test on sample images BEFORE moving on
3. `segment.py` -- build and test on preprocessed outputs
4. `ocr_engine.py` -- build with both API integrations
5. `reconcile.py` -- build reconciliation logic
6. `run.py` -- wire it all together
7. `SKILL.md` -- write the skill file
8. Test on all 14 project images
9. Review results, iterate on prompts if needed

GO BUILD THIS. Ship it clean, ship it fast.
