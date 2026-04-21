# IntWiz — AI-Powered Interview Preparation Platform

**IntWiz** is an intelligent interview preparation system that simulates real-world job interviews using multimodal AI analysis. It evaluates candidates through acoustic emotion recognition, linguistic fluency analysis, semantic relevance scoring, and structured answer assessment to provide transparent performance feedback.

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.18-orange.svg)](https://www.tensorflow.org/)
[![License](https://img.shields.io/badge/License-Academic-red.svg)]()

---

## 🎯 Key Features

### ✅ Implemented (Phase 1 & 2 Complete)

- **Acoustic Emotion Recognition** — 7-class MLP classifier (angry, disgust, fearful, happy, neutral, sad, surprised) trained on 12,000+ audio samples
- **AI Question Generation** — Personalized interview questions based on CV and job description analysis using Llama 3.3 70B
- **Speech-to-Text Transcription** — Whisper large v3 integration for accurate audio transcription
- **Fluency Metrics** — Words per minute (WPM) and filler word detection (um, uh, like, etc.)
- **Semantic Relevance Scoring** — TF-IDF cosine similarity comparing answers against CV and job requirements
- **STAR Method Analysis** — Automated assessment of answer structure (Situation, Task, Action, Result)
- **Multimodal Integration** — Combines acoustic, linguistic, and structural signals for comprehensive evaluation

### 🚧 In Development (Phase 3 & 4)

- Firebase Authentication & Cloud Firestore integration
- Weighted scoring fusion algorithm
- React frontend with interview simulation UI
- Performance dashboard with historical analytics
- PDF report generation

---

## 🏗️ System Architecture

Frontend (React) → HTTP REST API → Backend (FastAPI) → ML/LLM Services

**Backend Components:**
- Question Generation Endpoint → Llama 3.3 70B
- Audio Analysis Endpoint → TensorFlow Emotion Model + Whisper + TF-IDF
- Report Storage Endpoint → Firebase Firestore (Phase 3)

**Multimodal Feature Extraction Pipeline:**
- FFmpeg audio conversion (browser format → 16kHz wav)
- Whisper transcription (speech-to-text)
- 193 acoustic features (MFCCs, Chroma, Mel Spectrogram, Spectral Contrast, Tonnetz)
- TF-IDF vectorization for semantic analysis

---

## 🧠 ML Pipeline Details

### Acoustic Emotion Recognition

- **Model:** Sequential MLP (4 dense layers: 512 → 256 → 128 → 64)
- **Input:** 193 acoustic features (40 MFCCs, 12 Chroma, 128 Mel Spectrogram, 7 Spectral Contrast, 6 Tonnetz)
- **Output:** 7-class emotion classification
- **Training Data:** 12,000+ samples from RAVDESS, TESS, CREMA-D, SAVEE
- **Performance:** 65% accuracy on test set
- **Regularization:** Batch normalization + dropout between layers

### Natural Language Processing

- **Speech-to-Text:** Groq-hosted Whisper large v3 (free tier, <2s latency)
- **Question Generation:** Llama 3.3 70B with CV/JD context
- **Relevance Scoring:** sklearn TF-IDF + cosine similarity
- **STAR Analysis:** LLM-based structural assessment

### Fluency Analysis

- **WPM Calculation:** (word_count / duration_seconds) × 60
- **Filler Detection:** Pattern matching against 8 common hesitation markers
- **Scoring:** 100 - (filler_count × 8) — calibrated for intuitive thresholds

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- FFmpeg (for audio conversion)
- Groq API key (free at https://console.groq.com)

### Installation

Clone the repository:

    git clone https://github.com/kaveenjay/IntWiz.3.0.git
    cd IntWiz.3.0

Create a virtual environment:

    python -m venv venv
    venv\Scripts\activate   (Windows)
    source venv/bin/activate   (Mac/Linux)

Install dependencies:

    cd backend
    pip install -r requirements.txt

Set up environment variables by creating backend/.env with:

    GROQ_API_KEY=your_groq_api_key_here
    FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json

### Run Backend

    cd backend
    uvicorn main:app --reload

Server runs at http://127.0.0.1:8000

API documentation available at http://127.0.0.1:8000/docs (Swagger UI)

---

## 📡 API Endpoints

### POST /generate-questions/

Generates personalized interview questions based on uploaded CV and job description.

**Request Parameters:**
- cv_file: PDF file upload (required)
- job_description_file: PDF file upload (optional)
- job_description_text: Plain text (optional)
- num_questions: Integer (default: 7)

**Response Example:**

    {
      "questions": ["Question 1", "Question 2"],
      "cv_text": "...",
      "jd_text": "..."
    }

---

### POST /analyze-audio/

Performs comprehensive multimodal analysis on interview answer audio.

**Request Parameters:**
- file: Audio file (.wav, .mp3, .webm, .m4a, .mp4)
- cv_text: String (optional)
- job_description_text: String (optional)
- question: String (optional)

**Response Example:**

    {
      "filename": "answer.wav",
      "status": "success",
      "data": {
        "detected_tone": "neutral",
        "confidence_score": 62.49,
        "engagement_score": 39.63,
        "transcript": "I have 3 years of experience...",
        "duration_seconds": 9.0,
        "wpm": 126.0,
        "filler_word_count": 0,
        "filler_words_detected": [],
        "fluency_score": 100.0,
        "relevance_score": 75.3,
        "star_analysis": {
          "star_score": 80,
          "star_feedback": "Good answer but lacks specific examples",
          "has_situation": false,
          "has_action": true,
          "has_result": false
        }
      }
    }

---

## 🛠️ Technology Stack

### Backend
- **Framework:** FastAPI 0.115.6
- **ML/DL:** TensorFlow 2.18.0, scikit-learn 1.6.1
- **Audio Processing:** librosa 0.10.2, FFmpeg
- **LLM Integration:** Groq API (Llama 3.3 70B, Whisper large v3)
- **PDF Processing:** PyMuPDF (fitz)
- **Database:** Firebase Cloud Firestore (Phase 3)

### Frontend (Phase 4)
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Firebase Authentication
- **Routing:** React Router DOM v6
- **HTTP:** Axios

### Datasets
- **RAVDESS** — Ryerson Audio-Visual Database of Emotional Speech and Song
- **TESS** — Toronto Emotional Speech Set
- **CREMA-D** — Crowd-sourced Emotional Multimodal Actors Dataset
- **SAVEE** — Surrey Audio-Visual Expressed Emotion Dataset

---

## 📊 Development Status

| Phase | Status | Features |
|-------|--------|----------|
| Phase 1: ML Foundation | ✅ Complete | TensorFlow emotion classifier, FastAPI setup, acoustic feature extraction |
| Phase 2: NLP Integration | ✅ Complete | Whisper STT, question generation, fluency metrics, relevance scoring, STAR analysis |
| Phase 3: Backend Services | 🚧 In Progress | Firebase integration, scoring fusion, report storage |
| Phase 4: Frontend | ⏳ Planned | React UI, interview simulation, results dashboard |
| Phase 5: Deployment | ⏳ Planned | Vercel (frontend), Railway/Render (backend) |

---

## 📝 Known Limitations

### Acoustic Model Domain Shift
The emotion recognition model was trained on **acted emotional expressions** (exaggerated theatrical speech). This creates accuracy issues when applied to professional interview speech, which is naturally controlled and measured. Documented in DECISIONS.md.

**Impact:** Acoustic scores (emotion, engagement) may underestimate professional delivery quality.

**Mitigation:** Linguistic features (fluency, relevance, STAR) carry higher weight in final scoring. Future work includes fine-tuning on real interview recordings.

### TF-IDF Synonym Handling
Cannot recognize synonyms ("machine learning" vs "ML") or paraphrasing. Hybrid scoring with sentence transformers documented as future enhancement.

---

## 🎓 Academic Context

**Final Year Individual Project**
**BSc (Hons) Data Science — University of Plymouth**
**Student:** Kaveen Jayamanne (ID: 10953765)
**Supervisor:** Ms. Lakni Peiris

**Focus Areas:**
- Applied Machine Learning & Deep Learning
- Natural Language Processing
- Human-Computer Interaction
- Explainable AI & Transparency in Automated Assessment

**Project Objectives:**
1. Demonstrate multimodal AI integration in a practical application
2. Evaluate trade-offs between model complexity and explainability
3. Address domain adaptation challenges (acted vs professional speech)
4. Build production-ready software with proper documentation and testing

---

## 📚 Documentation

- **DECISIONS.md** — Technical architecture decisions and justifications
- **/docs** (Swagger UI) — Interactive API documentation at http://localhost:8000/docs
- **Code Comments** — Inline explanations of algorithms and design choices

---

## 🔮 Future Enhancements

1. **Domain-Specific Model Fine-Tuning**
   - Collect real interview recordings with expert labels
   - Retrain acoustic model on professional speech patterns
   - Recalibrate engagement metrics for controlled delivery

2. **Hybrid Semantic Scoring**
   - Combine TF-IDF with lightweight sentence transformers
   - Handle synonyms and paraphrasing effectively

3. **Advanced Analytics**
   - Comparative analysis across multiple attempts
   - Skill gap identification and learning path recommendations
   - Industry benchmark comparisons

4. **Extended Platform Features**
   - Video analysis (facial expressions, eye contact)
   - Real-time feedback during practice
   - Custom question bank creation for recruiters

---

## 📧 Contact

**Developer:** Kaveen Jayamanne
**Email:** jayamannekaveen@gmail.com
**LinkedIn:** linkedin.com/in/jayamannekaveen
**Institution:** University of Plymouth

---

## 📄 License

This project is developed for academic purposes as part of a university final year project.

---

*Last Updated: April 2026*