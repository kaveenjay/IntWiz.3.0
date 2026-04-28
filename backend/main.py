from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
import json
from dotenv import load_dotenv
from groq import Groq
import fitz  # PyMuPDF for PDF text extraction

# Import ML and storage functions
import librosa
from audio_utils import (
    analyze_audio_file,
    convert_to_standard_wav,
    calculate_fluency_metrics,
    calculate_relevance_score,
    analyze_pause_patterns,
    calculate_technical_depth,
    calculate_pacing_score,
)
from storage_utils import upload_audio_to_storage
from firebase_config import db
from firebase_admin import firestore
from datetime import datetime

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
    question: str = Form(""),
    save_audio: bool = Form(False),
    user_id: str = Form(""),
    interview_id: str = Form(""),
    question_number: int = Form(1),
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

        # 5. Pause quality analysis
        pause_analysis = analyze_pause_patterns(converted_path)

        # 6. Fluency metrics
        fluency = calculate_fluency_metrics(transcript, duration_seconds)

        # 7. Response pacing score
        word_count = len(transcript.split())
        pacing = calculate_pacing_score(duration_seconds, word_count)

        # 8. Technical depth score
        tech_depth = calculate_technical_depth(transcript, job_description_text, cv_text)

        # 9. Relevance score against CV + JD if context was provided
        reference = cv_text + " " + job_description_text
        relevance_score = calculate_relevance_score(transcript, reference) if len(reference.strip()) > 20 else 50.0

        # 10. STAR method structural analysis via LLM
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

        # 11. Optionally persist audio to Firebase Storage (user-controlled, privacy by default)
        audio_url = None
        audio_saved = False
        if save_audio and user_id and interview_id:
            upload_result = upload_audio_to_storage(
                file_path=converted_path,
                user_id=user_id,
                interview_id=interview_id,
                question_number=question_number,
            )
            if upload_result['success']:
                audio_url = upload_result['audio_url']
                audio_saved = True

        # 12. Cleanup
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
                "pacing_score": pacing["pacing_score"],
                "duration_assessment": pacing["duration_assessment"],
                "word_count_assessment": pacing["word_count_assessment"],
                "pause_count": pause_analysis["pause_count"],
                "average_pause_duration": pause_analysis["average_pause_duration"],
                "pause_quality_score": pause_analysis["pause_quality_score"],
                "technical_terms_found": tech_depth["technical_terms_found"],
                "technical_term_count": tech_depth["technical_term_count"],
                "technical_depth_score": tech_depth["technical_depth_score"],
                "relevant_terms_extracted": tech_depth["relevant_terms_extracted"],
                "relevance_score": relevance_score,
                "star_analysis": star_analysis,
                "audio_saved": audio_saved,
                "audio_url": audio_url,
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


# ---------------------------------------------------------------------------
# Adaptive interview helpers (used only by /generate-next-question/)
# ---------------------------------------------------------------------------

def _analyze_history(history: list) -> dict:
    """Computes aggregate metrics and performance trend from conversation history."""
    if not history:
        return {}

    avg_relevance  = sum(q['relevance_score']       for q in history) / len(history)
    avg_star       = sum(q['star_score']             for q in history) / len(history)
    avg_technical  = sum(q['technical_depth_score']  for q in history) / len(history)

    if len(history) >= 3:
        recent_avg = sum(q['overall_score'] for q in history[-2:]) / 2
        early_avg  = sum(q['overall_score'] for q in history[:2])  / 2
        if   recent_avg > early_avg + 10: trend = "improving"
        elif recent_avg < early_avg - 10: trend = "declining"
        else:                             trend = "stable"
    else:
        trend = "establishing baseline"

    return {
        'avg_relevance': round(avg_relevance, 1),
        'avg_star':      round(avg_star,      1),
        'avg_technical': round(avg_technical, 1),
        'trend':         trend,
        # First 50 chars of each question gives the LLM enough topic signal
        'topics_covered': [q['question'][:50] for q in history],
    }


def _format_history_for_llm(history: list) -> str:
    """Formats Q&A pairs for inclusion in an LLM prompt."""
    lines = []
    for i, qa in enumerate(history, 1):
        excerpt = qa['transcript'][:150].rstrip()
        if len(qa['transcript']) > 150:
            excerpt += "..."
        lines.append(f"Q{i}: {qa['question']}")
        lines.append(f"A{i}: {excerpt}")
        lines.append(
            f"Scores — Relevance: {qa['relevance_score']}, "
            f"STAR: {qa['star_score']}, "
            f"Technical depth: {qa['technical_depth_score']}\n"
        )
    return "\n".join(lines)


def _directive_for_performance(summary: dict) -> str:
    """Returns a tailored instruction for the LLM based on current performance."""
    avg_overall = (
        summary['avg_relevance'] + summary['avg_star'] + summary['avg_technical']
    ) / 3

    if summary['trend'] == "declining" or avg_overall < 50:
        return (
            "Ask a simpler, more supportive question that gives the candidate a chance "
            "to demonstrate a strength or recover their confidence"
        )
    if summary['trend'] == "improving" or avg_overall >= 75:
        return (
            "Challenge the candidate with a deeper follow-up that probes specifics, "
            "trade-offs, or edge-case thinking on a topic they answered well"
        )
    # stable or establishing baseline
    return (
        "Ask about a key skill from the job description that has not yet been covered "
        "in the conversation above"
    )


def _build_adaptive_prompt(
    cv_text: str,
    jd_text: str,
    history: list,
    current_count: int,
) -> str:
    if current_count == 0:
        return f"""You are an expert interviewer conducting a behavioral interview.

CV Summary:
{cv_text[:500]}

Job Requirements:
{jd_text[:500]}

Generate ONE opening question that:
1. Is broad enough to let the candidate showcase their background
2. Is relevant to the role requirements
3. Follows the format: "Tell me about your experience with [key skill from JD]"

Return ONLY the question text, no preamble."""

    summary = _analyze_history(history)
    return f"""You are an expert interviewer conducting an adaptive behavioral interview.

PREVIOUS CONVERSATION:
{_format_history_for_llm(history)}

PERFORMANCE ANALYSIS:
- Average relevance:       {summary['avg_relevance']}/100
- Average STAR structure:  {summary['avg_star']}/100
- Average technical depth: {summary['avg_technical']}/100
- Trend: {summary['trend']}

TOPICS ALREADY COVERED:
{chr(10).join(f'- {t}' for t in summary['topics_covered'])}

Generate the NEXT question that:
1. {_directive_for_performance(summary)}
2. Probes deeper into specific skills claimed in the CV but not yet demonstrated
3. Invites a STAR-style answer (Situation, Task, Action, Result)

Return ONLY the question text, no explanation."""


def _should_stop_interview(
    history: list,
    current_count: int,
    target_questions: int,
) -> bool:
    """Returns True when the interview should end."""
    if target_questions > 0:
        return current_count >= target_questions

    # Adaptive upper limit
    if current_count >= 10:
        return True

    # Consistent struggle: last 3 answers all scored below 40
    if current_count >= 3:
        recent = [q['overall_score'] for q in history[-3:]]
        if all(s < 40 for s in recent):
            return True

    return False


_FALLBACK_QUESTIONS = [
    "Can you walk me through a challenging project you led and what you learned from it?",
    "Describe a situation where you had to quickly learn a new technology to solve a problem.",
    "Tell me about a time you disagreed with a team decision and how you handled it.",
    "What's the most complex technical problem you've solved, and how did you approach it?",
    "Describe a project where you had to balance competing priorities under a deadline.",
]


@app.post("/generate-next-question/")
async def generate_next_question(
    cv_text: str = Form(...),
    job_description_text: str = Form(...),
    conversation_history: str = Form("[]"),
    current_question_count: int = Form(0),
    target_questions: int = Form(0),
):
    """
    Generates the next adaptive interview question based on conversation history.

    For the first question, produces a broad role-relevant opener.
    For subsequent questions, analyses performance trends and topic coverage
    to decide whether to probe deeper, shift topic, or offer recovery space.

    Stopping criteria:
    - Fixed mode (target_questions > 0): stop when count reaches target
    - Adaptive mode: stop at 10 questions, or if last 3 scores < 40
    """
    try:
        history = json.loads(conversation_history)
        if not isinstance(history, list):
            raise ValueError("conversation_history must be a JSON array")
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid conversation_history: {e}")

    should_stop = _should_stop_interview(history, current_question_count, target_questions)

    if should_stop:
        return {
            "question": None,
            "should_continue": False,
            "question_number": current_question_count + 1,
            "reasoning": "Interview complete — stopping criteria met.",
        }

    prompt = _build_adaptive_prompt(cv_text, job_description_text, history, current_question_count)
    next_question = call_groq_llm(prompt).strip()

    # Strip any accidental numbering or quotation marks the model may have added
    next_question = next_question.lstrip("0123456789.)- \"'").strip().strip("\"'")

    if not next_question:
        # Rotate through fallbacks rather than always returning the same one
        next_question = _FALLBACK_QUESTIONS[current_question_count % len(_FALLBACK_QUESTIONS)]
        reasoning = "Groq unavailable — fallback question used."
    else:
        summary = _analyze_history(history) if history else {}
        trend = summary.get('trend', 'establishing baseline')
        reasoning = (
            f"Adaptive question for Q{current_question_count + 1}; "
            f"performance trend: {trend}."
        )

    return {
        "question": next_question,
        "should_continue": True,
        "question_number": current_question_count + 1,
        "reasoning": reasoning,
    }


# ---------------------------------------------------------------------------
# Report storage and retrieval
# ---------------------------------------------------------------------------

@app.post("/save-report/")
async def save_report(
    user_id: str = Form(...),
    cv_text: str = Form(""),
    jd_text: str = Form(""),
    interview_results: str = Form(...),
    target_questions: int = Form(0),
):
    """
    Persists a completed interview session to Firestore.

    Computes aggregate scores across all Q&A turns, generates a 2-3 sentence
    AI summary via Groq, then writes the full document to the "reports" collection.
    cv_text and jd_text are truncated to 2 000 chars each to stay well within
    Firestore's 1 MB per-document limit.
    """
    try:
        results = json.loads(interview_results)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid interview_results JSON: {e}")

    if not results:
        raise HTTPException(status_code=400, detail="No interview results provided")

    try:
        n = len(results)

        avg_relevance  = sum(q.get('relevance_score',      0) for q in results) / n
        avg_fluency    = sum(q.get('fluency_score',         0) for q in results) / n
        avg_technical  = sum(q.get('technical_depth_score', 0) for q in results) / n
        avg_pacing     = sum(q.get('pacing_score',          0) for q in results) / n
        avg_pause      = sum(q.get('pause_quality_score',   0) for q in results) / n
        avg_star       = sum(q.get('star_analysis', {}).get('star_score', 0) for q in results) / n
        avg_confidence = sum(q.get('confidence_score',      0) for q in results) / n

        overall_score = (
            avg_relevance  * 0.25 +
            avg_technical  * 0.20 +
            avg_star       * 0.15 +
            avg_fluency    * 0.15 +
            avg_pacing     * 0.10 +
            avg_pause      * 0.08 +
            avg_confidence * 0.07
        )

        emotions = [q.get('detected_tone', 'neutral') for q in results]
        dominant_emotion = max(set(emotions), key=emotions.count)
        total_fillers = sum(q.get('filler_word_count', 0) for q in results)

        summary_prompt = f"""Based on this interview performance, write a 2-3 sentence feedback summary:

Overall Score: {overall_score:.0f}/100
Average Relevance: {avg_relevance:.0f}
Average Fluency: {avg_fluency:.0f}
Average Technical Depth: {avg_technical:.0f}
Average STAR Structure: {avg_star:.0f}
Total Filler Words: {total_fillers}
Question Count: {n}
Dominant Emotion: {dominant_emotion}

Provide constructive feedback highlighting one strength and one area for improvement. Be specific and actionable."""

        try:
            summary_response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": summary_prompt}],
                temperature=0.7,
                max_tokens=200,
            )
            ai_summary = summary_response.choices[0].message.content.strip()
        except Exception:
            ai_summary = "Interview completed successfully. Review individual question scores for detailed feedback."

        report_data = {
            "user_id":               user_id,
            "timestamp":             firestore.SERVER_TIMESTAMP,
            "overall_score":         round(overall_score, 1),
            "dominant_emotion":      dominant_emotion,
            "ai_summary":            ai_summary,
            "question_count":        n,
            "target_questions":      target_questions,
            "mode":                  "fixed" if target_questions > 0 else "adaptive",
            "average_relevance":     round(avg_relevance,  1),
            "average_fluency":       round(avg_fluency,    1),
            "average_technical_depth": round(avg_technical, 1),
            "average_pacing":        round(avg_pacing,     1),
            "average_pause_quality": round(avg_pause,      1),
            "average_star":          round(avg_star,       1),
            "total_filler_words":    total_fillers,
            "interview_results":     results,
            "cv_text":               cv_text[:2000],
            "jd_text":               jd_text[:2000],
        }

        _, doc_ref = db.collection("reports").add(report_data)

        return {
            "report_id":   doc_ref.id,
            "status":      "success",
            "overall_score": round(overall_score, 1),
            "ai_summary":  ai_summary,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving report: {e}")


@app.get("/get-report/{report_id}")
async def get_report(report_id: str):
    """
    Returns the full interview report document for a given report ID.

    The Firestore SERVER_TIMESTAMP is converted to an ISO 8601 string so the
    response is JSON-serialisable without custom encoder configuration.
    """
    try:
        doc = db.collection("reports").document(report_id).get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Report not found")

        report_data = doc.to_dict()
        report_data["report_id"] = report_id

        ts = report_data.get("timestamp")
        if ts is not None:
            report_data["timestamp"] = ts.isoformat()

        return report_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching report: {e}")


@app.get("/get-user-reports/{user_id}")
async def get_user_reports(user_id: str, limit: int = 20):
    """
    Lists summary cards for all of a user's past interviews, newest first.

    Heavy fields (interview_results, cv_text, jd_text) are excluded from the
    list response to keep payloads small. The frontend fetches the full document
    via /get-report/{report_id} only when the user opens a specific report.
    """
    try:
        query = (
            db.collection("reports")
            .where("user_id", "==", user_id)
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )

        reports = []
        for doc in query.stream():
            data = doc.to_dict()

            ts = data.get("timestamp")
            timestamp_str = ts.isoformat() if ts is not None else None

            reports.append({
                "report_id":              doc.id,
                "timestamp":              timestamp_str,
                "overall_score":          data.get("overall_score"),
                "dominant_emotion":       data.get("dominant_emotion"),
                "question_count":         data.get("question_count"),
                "mode":                   data.get("mode"),
                "ai_summary":             data.get("ai_summary"),
                "average_relevance":      data.get("average_relevance"),
                "average_fluency":        data.get("average_fluency"),
                "average_technical_depth": data.get("average_technical_depth"),
            })

        return {
            "user_id":      user_id,
            "report_count": len(reports),
            "reports":      reports,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user reports: {e}")