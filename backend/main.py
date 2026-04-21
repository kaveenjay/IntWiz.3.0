from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import json
from dotenv import load_dotenv
from groq import Groq
import fitz  # PyMuPDF for PDF text extraction

# Import ML functions
import librosa
from audio_utils import (
    analyze_audio_file,
    convert_to_standard_wav,
    calculate_fluency_metrics,
    calculate_relevance_score,
)

# Load environment variables
load_dotenv()

# Initialize Groq client for LLM inference and transcription
# Groq provides free access to Llama 3.3 70B (text generation) and Whisper large v3
# (audio transcription) with no regional restrictions, making it ideal for our Sri Lankan user base
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe_with_groq(audio_file_path: str) -> str:
    """
    Transcribes audio to text using Groq's Whisper large v3 implementation.

    Groq hosts the same Whisper large v3 model OpenAI charges for, completely free.
    Their custom LPU chips process 60 seconds of audio in ~2 seconds.

    Args:
        audio_file_path: Path to the audio file (must be 16kHz mono wav after FFmpeg conversion)

    Returns:
        Transcribed text as string, or empty string if transcription fails
    """
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(audio_file_path), audio_file.read()),
                model="whisper-large-v3",
                response_format="text"
            )
        return transcription.strip() if transcription else ""
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

def call_groq_llm(prompt: str) -> str:
    """
    Calls Groq's Llama 3.3 70B model for text generation tasks.

    Used for question generation and STAR analysis. Llama 3.3 70B benchmarks
    similarly to GPT-4 on structured tasks while being completely free.

    Args:
        prompt: The instruction/query for the LLM

    Returns:
        Generated text response, or empty string if call fails
    """
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq LLM error: {e}")
        return ""

# 1. SERVER INITIALIZATION
app = FastAPI(
    title="IntWiz API",
    description="Backend server for the IntWiz AI Interview Platform"
)

# CORS Middleware (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production this will be restricted the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to temporarily hold user audio uploads before processing
TEMP_DIR = "temp_audio"
os.makedirs(TEMP_DIR, exist_ok=True)

# 2. API ENDPOINTS
@app.get("/")
def read_root():
    """
    Health check endpoint. If you visit http://localhost:8000/ in your browser, 
    you will see this message. It confirms the server is alive.
    """
    return {"message": "IntWiz Acoustic Engine API is Online"}

@app.post("/analyze-audio/")
async def analyze_audio(
    file: UploadFile = File(...),
    cv_text: str = Form(""),
    job_description_text: str = Form(""),
    question: str = Form("")
):
    """
    Performs comprehensive multimodal analysis of interview audio.

    Pipeline:
    1. FFmpeg conversion (browser webm → 16kHz mono wav)
    2. Whisper transcription (speech-to-text)
    3. Acoustic emotion analysis (TensorFlow MLP on 193 features)
    4. Fluency metrics (WPM, filler word detection)
    5. Relevance scoring (TF-IDF vs CV+JD if provided)
    6. STAR method analysis (LLM-based structural assessment)

    Returns integrated scores from acoustic (emotion, engagement) and
    linguistic (fluency, relevance, structure) modalities.
    """
    # Browser MediaRecorder outputs webm by default - we must accept it then convert via FFmpeg
    # Includes .m4a (Apple audio format commonly used on iPhone/Mac)
    valid_extensions = ('.wav', '.mp3', '.ogg', '.webm', '.mp4', '.m4a')
    if not file.filename.endswith(valid_extensions):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .wav, .mp3, .ogg, .webm, or .mp4 file.")

    file_path = os.path.join(TEMP_DIR, file.filename)
    converted_path = file_path.replace(os.path.splitext(file_path)[1], "_converted.wav")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Convert to standardized format (16kHz mono wav) before processing
        convert_to_standard_wav(file_path, converted_path)

        # 2. Acoustic emotion analysis
        results = analyze_audio_file(converted_path)

        # 3. Transcribe audio to text using Whisper
        transcript = transcribe_with_groq(converted_path)

        # 4. Calculate audio duration
        y_temp, sr_temp = librosa.load(converted_path, sr=None)
        duration_seconds = float(len(y_temp) / sr_temp)

        # 5. Fluency metrics
        fluency = calculate_fluency_metrics(transcript, duration_seconds)

        # 6. Relevance score against CV + JD if context was provided
        reference = cv_text + " " + job_description_text
        relevance_score = calculate_relevance_score(transcript, reference) if len(reference.strip()) > 20 else 50.0

        # 7. STAR method structural analysis via LLM
        star_prompt = f"""Analyze this interview answer and return ONLY valid JSON with no markdown, no backticks:
{{
  "star_score": <integer 0-100>,
  "star_feedback": "<one sentence feedback>",
  "has_situation": <true or false>,
  "has_action": <true or false>,
  "has_result": <true or false>
}}

Interview answer: {transcript}"""

        try:
            star_response = call_groq_llm(star_prompt)
            clean_star = star_response.strip().replace("```json", "").replace("```", "")
            star_analysis = json.loads(clean_star)
        except Exception:
            star_analysis = {
                "star_score": 50,
                "star_feedback": "Could not analyze answer structure.",
                "has_situation": False,
                "has_action": False,
                "has_result": False
            }

        # 8. Cleanup
        os.remove(file_path)
        if os.path.exists(converted_path):
            os.remove(converted_path)

        return {
            "filename": file.filename,
            "status": "success",
            "data": {
                **results,
                "transcript": transcript,
                "duration_seconds": round(duration_seconds, 1),
                "wpm": fluency["wpm"],
                "filler_word_count": fluency["filler_word_count"],
                "filler_words_detected": fluency["filler_words_detected"],
                "fluency_score": fluency["fluency_score"],
                "relevance_score": relevance_score,
                "star_analysis": star_analysis
            }
        }

    except Exception as e:
        for path in [file_path, converted_path]:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-questions/")
async def generate_questions(
    cv_file: UploadFile = File(...),
    job_description_file: UploadFile = File(None),  # Optional
    job_description_text: str = Form(""),  # Optional
    num_questions: int = Form(7)
):
    """
    Generates personalized interview questions based on CV and job description.

    This endpoint demonstrates end-to-end PDF processing and LLM integration:
    1. Receives PDF uploads via multipart/form-data
    2. Extracts text using PyMuPDF (fast, reliable for document parsing)
    3. Sends extracted text to Llama 3.3 70B for question generation
    4. Returns structured JSON array of questions

    The job description can be provided as either a PDF upload or plain text,
    improving real-world UX since candidates typically copy-paste JDs from
    job boards (LinkedIn, Indeed) rather than having them as PDF files.
    If both are provided, the PDF takes precedence.
    """
    # Validate at least one JD source provided
    if not job_description_file and not job_description_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide either job_description_file (PDF) or job_description_text (plain text)"
        )

    # Use UUID to prevent filename collision bugs (multiple simultaneous uploads)
    cv_path = os.path.join(TEMP_DIR, f"cv_{uuid.uuid4().hex}.pdf")
    jd_path = os.path.join(TEMP_DIR, f"jd_{uuid.uuid4().hex}.pdf")

    try:
        # Save CV PDF temporarily
        with open(cv_path, "wb") as buffer:
            shutil.copyfileobj(cv_file.file, buffer)

        # Save JD PDF temporarily (only if provided)
        if job_description_file:
            with open(jd_path, "wb") as buffer:
                shutil.copyfileobj(job_description_file.file, buffer)

        # Extract text from CV PDF using PyMuPDF
        cv_doc = fitz.open(cv_path)
        cv_text = ""
        for page in cv_doc:
            cv_text += page.get_text()
        cv_doc.close()
        os.remove(cv_path)

        # Extract job description text (from PDF or direct text input)
        if job_description_file:
            # User uploaded PDF
            jd_doc = fitz.open(jd_path)
            jd_text = ""
            for page in jd_doc:
                jd_text += page.get_text()
            jd_doc.close()
            os.remove(jd_path)
        else:
            # User provided text directly
            jd_text = job_description_text.strip()

        # Construct prompt for LLM question generation
        prompt = f"""You are an expert technical interviewer. Based on the candidate CV and job description below, generate exactly {num_questions} specific, relevant interview questions.

Return ONLY a valid JSON array of strings. No markdown, no backticks, no numbering, no extra text.
Example format: ["Question one here", "Question two here"]

CV:
{cv_text}

Job Description:
{jd_text}"""

        # Call Groq Llama 3.3 70B
        response_text = call_groq_llm(prompt)

        # Parse response as JSON (strip any markdown artifacts first)
        clean_response = response_text.strip().replace("```json", "").replace("```", "")
        questions = json.loads(clean_response)

        # Return questions + original texts (frontend needs these for relevance scoring)
        return {
            "questions": questions,
            "cv_text": cv_text,
            "jd_text": jd_text
        }

    except json.JSONDecodeError:
        for path in [cv_path, jd_path]:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=500, detail="Failed to parse AI-generated questions. Please try again.")

    except Exception as e:
        for path in [cv_path, jd_path]:
            if os.path.exists(path):
                os.remove(path)
        raise HTTPException(status_code=500, detail=str(e))