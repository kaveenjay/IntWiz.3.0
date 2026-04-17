from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from dotenv import load_dotenv
from groq import Groq

# Import ML function
from audio_utils import analyze_audio_file

# Load environment variables
load_dotenv()

# Initialize Groq client for LLM inference and transcription
# Groq provides free access to Llama 3.3 70B (text generation) and Whisper large v3
# (audio transcription) with no regional restrictions, making it ideal for our Sri Lankan user base
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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