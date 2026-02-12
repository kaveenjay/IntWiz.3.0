# IntWiz – AI Powered Intelligent Interview Preparation Platform

IntWiz is a web-based intelligent interview preparation platform that simulates real-world job interviews using Artificial Intelligence. It evaluates candidates through **speech-based acoustic sentiment analysis**, **text-based linguistic analysis**, and **adaptive AI-driven interview questioning** to provide transparent performance scoring and actionable feedback.


## Key Features

- AI-powered interviewer that adapts questions based on user responses
- Acoustic sentiment analysis to evaluate confidence, hesitation, tone, and engagement
- Text-based sentiment and fluency analysis using speech-to-text
- CV and job description–driven personalized interviews
- Multimodal scoring and detailed feedback reports
- Interactive dashboard for performance visualization


## Technologies Used

### AI / ML
- Speech Emotion Recognition (CNN-based models)
- Natural Language Processing (NLP)
- Transformer-based language models
- Whisper Speech-to-Text

### Backend
- FastAPI
- Firebase Authentication & Storage

### Frontend
- React
- Tailwind CSS

### Deployment
- Frontend: Vercel
- Backend: Firebase / Google Cloud Run


## Sentiment Analysis Pipeline
User Speech
↓
Audio Stream
↓
Audio Chunking (overlapping segments)
↓
Acoustic Feature Extraction (MelSpectrogram, MFCC, RMS, ZCR)
↓
Audio Emotion Model (CNN)
↓
Whisper Speech-to-Text
↓
Text Sentiment & Fluency Analysis
↓
Multimodal Fusion Layer
↓
Final Score & Feedback Report


## Datasets Used

- RAVDESS – Ryerson Audio-Visual Database of Emotional Speech and Song
- CREMA-D – Crowd-sourced Emotional Multimodal Actors Dataset
- TESS – Toronto Emotional Speech Set
- SAVEE – Surrey Audio-Visual Expressed Emotion Dataset


## Project Status

🔧 In Development  
✔ Proposal & PID Approved  
✔ Dataset Preparation Started  
🚧 Acoustic & Text Sentiment Models In Progress  

## Academic Context

This project is developed as a **Final Year Individual Project** focusing on applied Artificial Intelligence, Machine Learning, and Human-Computer Interaction, with an emphasis on practical deployment and explainability.


## Contact

Developed by **Kaveen Jayamanne**  
BSc (Hons) Data Science
University of Plymouth
