---
title: IntWiz API
emoji: 🎙️
colorFrom: green
colorTo: yellow
sdk: docker
pinned: false
license: mit
short_description: AI-powered interview preparation backend
---

# IntWiz API

Backend server for the IntWiz AI Interview Preparation Platform.

## What this is

- FastAPI server with multimodal interview analysis
- TensorFlow MLP emotion classifier (trained on RAVDESS, TESS, CREMA-D, SAVEE)
- Groq-powered transcription (Whisper) and question generation (Llama 3.3 70B)
- Firebase Auth + Firestore + Storage integration

## Endpoints

- `GET /` — health check
- `POST /generate-questions/` — initial questions from CV + JD
- `POST /generate-next-question/` — adaptive questioning
- `POST /analyze-audio/` — multimodal answer analysis (17 metrics)
- `POST /save-report/` — persist interview report
- `GET /get-report/{report_id}` — fetch single report
- `GET /get-user-reports/{user_id}` — list user's reports
- `DELETE /delete-report/{report_id}` — delete report + audio
- `GET /get-preferences/{user_id}` — user preferences
- `POST /save-preferences/` — update preferences

## Project context

BSc Data Science final-year dissertation project, University of Plymouth, 2026.

Frontend repository: github.com/[username]/IntWiz (link to your repo)

## Architecture

See dissertation methodology section for detailed system architecture, scoring calibration, and academic citations.
