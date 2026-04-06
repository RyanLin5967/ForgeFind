# ForgeFind

AI-powered image manipulation detection. Upload any image and ForgeFind will analyze it for signs of splicing and copy-move forgery using two independent detection engines running in parallel.

**Live Demo:** [forgefind.netlify.app](https://forgefind.netlify.app)

Video of how to use it:
https://youtu.be/ubOb0cYbZ-k

---

## Try It Yourself

Test ForgeFind with these sample images. Right-click and save, then upload them to the app.

| Image | Type | What To Look For |
|-------|------|------------------|
| ![splice_1](https://github.com/user-attachments/assets/bee01db2-36e3-4745-abd4-b3b4df2d8028) | Spliced | The bird was edited in|
| ![cpypaste_1](https://github.com/user-attachments/assets/4e06a80f-8eeb-4f37-b9fe-7ea93a8aba91) | Copy-Move | he skier was copied from the middle to the bottom right |
| ![authentic](https://github.com/user-attachments/assets/752c2e87-9411-48f7-be60-da0a37d2cf01) | Authentic | Should return 0% confidence |

---

## How It Works

ForgeFind runs two detection engines simultaneously on every upload:

### Splicing Detection — PyTorch U-Net
A deep learning segmentation model (U-Net with a ResNet34 encoder) trained on the CASIA tampering dataset. It outputs a pixel-level probability map highlighting regions it suspects were pasted in from a different source image.

Post-processing pipeline:
- Resize to 256x256 for inference, upscale probability map back to original resolution
- Threshold at 0.5, then apply morphological close/open to clean edges
- Erode mask to tighten boundaries
- Reject masks covering more than 25% of the image (model confusion)
- Filter small blobs using confidence-scaled thresholds (small blobs need high confidence to survive)
- Sync the cleaned mask with confidence scoring so the reported number matches what's displayed

### Copy-Move Detection — OpenCV SIFT
A classical computer vision pipeline that detects duplicated regions within the same image.

Detection pipeline:
- Extract SIFT keypoints and descriptors
- Match features using FLANN with a 0.70 ratio test
- Filter out spatially close matches (same region, not a real clone)
- Fit a homography via RANSAC requiring at least 6 inliers
- Reject bounding boxes that overlap (false positive from repeated patterns)
- Reject regions smaller than 0.5% of image area

### Results Visualization
Both outputs are layered onto an HTML canvas with four toggle views:

- **Original Image** — The unmodified upload
- **Noise Mask** — Red semi-transparent overlay on U-Net flagged pixels
- **Clone Detection** — Green bounding boxes around SIFT-matched regions
- **Overall** — Both overlays combined

### Confidence Scoring
- **Splicing:** Average model probability across all flagged pixels (0–100%)
- **Copy-Move:** Binary — 98% if a verified clone is found, 0% otherwise
- **Overall:** Whichever is higher

| Score | Level |
|-------|-------|
| 0–30% | Low Risk |
| 31–70% | Medium Risk |
| 71–100% | High Risk |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, vanilla JavaScript |
| Backend | Python, FastAPI |
| Splicing Model | PyTorch, segmentation-models-pytorch (U-Net/ResNet34) |
| Copy-Move | OpenCV (SIFT, FLANN, RANSAC) |
| Testing | pytest (mock + real inference), GitHub Actions CI |
| Frontend Hosting | Netlify |
| Backend Hosting | HuggingFace Spaces (Docker) |

---

## Project Structure

```
ForgeFind/
├── frontend/
│   ├── index.html              # Main upload page
│   ├── how-it-works.html       # Detection pipeline explainer
│   ├── faq.html                # FAQ with accordion UI
│   ├── css/style.css           # Global styles (dark theme, cyan accents)
│   └── js/
│       ├── app.js              # UI logic, event handlers, results rendering
│       ├── api.js              # Fetch wrapper, sends image to backend
│       └── canvas.js           # Canvas drawing: mask overlay + bounding boxes
├── backend/
│   ├── main.py                 # FastAPI app, upload endpoint, file cleanup
│   ├── schemas.py              # Pydantic response model
│   ├── detection.py            # DetectionService (DI, parallel execution)
│   ├── Dockerfile              # Container config for HuggingFace Spaces
│   ├── requirements.txt
│   └── ml_models/
│       ├── inference.py        # U-Net + SIFT detection logic
│       └── weights/            # Model weights (downloaded at runtime)
├── .github/workflows/
│   └── test.yml                # CI: api-tests + model-tests jobs
└── LICENSE                     # MIT
```

---

## Running Locally

### Prerequisites
- Python 3.11+
- pip

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The model weights (~93MB) download automatically on first startup from HuggingFace.

> **Note:** When running locally, you'll need to temporarily update the URLs in `main.py` and `api.js` to point to `http://localhost:8000` instead of the production HuggingFace domain. Make sure not to commit these changes.

### Frontend
Serve the `frontend/` folder with any static file server:
```bash
cd frontend
npx serve .
```
Or just open `index.html` in a browser (the fetch to localhost should work without CORS issues if you set `allow_origins=["*"]` locally).

---

## Testing

Tests are split into two categories using pytest markers:

```bash
cd backend

# Fast tests — mocked inference, validates API contract
python -m pytest tests/test_api.py -v -m fast

# Slow tests — real model inference, checks detection accuracy
python -m pytest tests/test_detection.py -v -m slow

# Run everything
python -m pytest -v
```

### What's Tested
- **API tests (fast):** Valid image returns 200 with correct response schema. Invalid file returns 415. Uses dependency injection (`dependency_overrides`) to swap in mock detection functions.
- **Detection tests (slow):** Known forgeries are detected (splices score >80%, copy-move returns 2 coordinate pairs). Known authentic images return 0% confidence (no false positives).

### CI
GitHub Actions runs both test suites on every push/PR to `dev`. The workflow has two parallel jobs (`api-tests` and `model-tests`), each downloading model weights independently since the model loads at import time.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `dev` | Active development, CI runs here |
| `main` | Production — deploys to Netlify (frontend) and HuggingFace Spaces (backend) |

Branch protection requires CI to pass before merging `dev` into `main`.

---

## Known Limitations

- **No AI-generated image detection.** ForgeFind targets splicing and copy-move only.
- **Heavy JPEG compression** can reduce accuracy — compression artifacts mimic splice boundaries.
- **Repeated patterns** (text, tiles, fences) can trigger false positives in the copy-move detector.
- **Very small edits** may produce mask regions below the minimum blob threshold and get filtered out.
- **Not mobile responsive.** The interface is designed for desktop browsers.

---

## License

[MIT](LICENSE)
