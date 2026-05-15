---
title: IntWiz
emoji: 🎤
colorFrom: green
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# IntWiz Backend

FastAPI backend for the IntWiz interview preparation platform.

**🌐 Live API:** https://kaveenjay-intwiz.hf.space  
**📚 Interactive docs:** https://kaveenjay-intwiz.hf.space/docs

For the full project overview, see the [root README](../README.md).

---

## What This Service Does

This service exposes 10 REST endpoints across 5 functional groups:

| Group | Endpoints |
|---|---|
| Discovery | `GET /` |
| Analysis | `POST /analyze-audio/` |
| Question Generation | `POST /generate-questions/`, `POST /generate-next-question/` |
| Report Management | `POST /save-report/`, `GET /get-report/{report_id}`, `DELETE /delete-report/{report_id}`, `GET /get-user-reports/{user_id}` |
| User Preferences | `GET /get-preferences/{user_id}`, `POST /save-preferences/` |

The primary `/analyze-audio/` endpoint runs a multimodal pipeline:

1. FFmpeg conversion of browser audio to 16 kHz mono WAV
2. Whisper transcription via Groq (large-v3 model)
3. Acoustic emotion classification via local TensorFlow MLP
4. Deterministic fluency and pause-metric computation from transcript
5. Two-pass technical-depth extraction via Groq Llama 3.3 70B
6. TF-IDF cosine similarity for content relevance
7. Composite response pacing score
8. Behavioural-structure analysis (STAR framework) via Llama 3.3 70B

Output: 17 metrics across 6 analytical dimensions.

---

## Architecture

- **Web framework:** FastAPI with async request handlers
- **ML inference:** TensorFlow / Keras (multi-layer perceptron, 193-dim feature vector)
- **Audio processing:** librosa + FFmpeg
- **External AI:** Groq API (Whisper large-v3 + Llama 3.3 70B)
- **Persistence:** Firebase Firestore (reports + user preferences)
- **Storage:** Firebase Cloud Storage (opt-in audio retention, 30-day cleanup)

---

## Running Locally

### Prerequisites

- Python 3.11+
- FFmpeg (system-level)
- libsndfile1 (Ubuntu/Debian: `sudo apt install libsndfile1`)
- A Groq API key
- A Firebase project with Admin SDK service account credentials

### Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Place the trained model artefacts:

```
../models/emotion_model.h5
../models/scaler.pkl
../data/processed/classes.npy
```

Create a `.env` file:

```
GROQ_API_KEY=your_groq_api_key
FRONTEND_URLS=http://localhost:5173,http://localhost:5175
TEMP_AUDIO_DIR=temp_audio
```

Place `serviceAccountKey.json` (Firebase service account JSON) in this 
directory.

### Run

```bash
uvicorn main:app --reload
```

API at `http://127.0.0.1:8000`. Interactive docs at `/docs`.

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `GROQ_API_KEY` | Groq API authentication | Yes |
| `FRONTEND_URLS` | CORS allowed origins (comma-separated) | No (defaults to localhost dev ports) |
| `TEMP_AUDIO_DIR` | Path for transient audio buffering | No (defaults to `temp_audio`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account JSON content | Production only (overrides file) |

---

## Deployment (Hugging Face Spaces)

The Space is built from this directory's Dockerfile. Required Space-level 
environment variables and secrets:

- `GROQ_API_KEY` (secret)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (secret — full JSON content)
- `FRONTEND_URLS` (variable — production Vercel URLs)
- `TEMP_AUDIO_DIR` (variable — `/tmp/intwiz_audio`)

The Dockerfile creates a non-root user (UID 1000, required by HF Spaces) 
and exposes port 7860.