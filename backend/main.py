from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import json
from dotenv import load_dotenv
from groq import Groq
import fitz  # PyMuPDF for PDF text extraction

# Import ML function
from audio_utils import analyze_audio_file

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
async def analyze_audio(file: UploadFile = File(...)):
    """
    The core endpoint. It expects a POST request containing an audio file.
    """
    # 1. Security/Validation: Ensure they actually uploaded an audio file
    valid_extensions = ('.wav', '.mp3', '.ogg')
    if not file.filename.endswith(valid_extensions):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .wav file.")

    # 2. Temporary Storage: Librosa requires a physical file path to read audio.
    # So, we take the incoming internet stream and save it locally.
    file_path = os.path.join(TEMP_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 3. AI Processing: Pass the saved file to our ML engine
        results = analyze_audio_file(file_path)
        
        # 4. Cleanup: Delete the file so the laptop's storage doesn't fill up
        os.remove(file_path)
        
        # 5. The Response: Send the dictionary back to the frontend
        return {
            "filename": file.filename,
            "status": "success",
            "data": results
        }
        
    except Exception as e:
        # If the ML model crashes, ensure we still delete the corrupted file
        if os.path.exists(file_path):
            os.remove(file_path)
        # Throw an HTTP 500 Internal Server Error
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