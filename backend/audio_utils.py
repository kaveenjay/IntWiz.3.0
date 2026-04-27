import os
import re
import json
import numpy as np
import librosa
import tensorflow as tf
import joblib
import warnings

# Suppress warnings so the server console stays clean
warnings.filterwarnings('ignore')

# 1. CONFIGURATION & PATHS
SAMPLE_RATE = 22050
DURATION = 4
SAMPLES_PER_TRACK = SAMPLE_RATE * DURATION

# use absolute paths so the server always knows where the models are,
# regardless of where it's run from. This is crucial for deployment.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "emotion_model.h5")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.pkl")
CLASSES_PATH = os.path.join(BASE_DIR, "data", "processed", "classes.npy")

# 2. LOAD ARTIFACTS INTO MEMORY
# load these outside the functions so they only load ONCE when the server starts.
print("Loading IntWiz ML Models into memory...")
model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
classes = np.load(CLASSES_PATH)
print("✅ Models Loaded Successfully.")

# 3. CORE FUNCTIONS

def process_audio(file_path):
    """
    Extracts 193 acoustic features from a 4-second audio clip.
        
    Pipeline:
    1. Load audio with librosa at 22,050 Hz sample rate
    2. Pad or truncate to exactly 4 seconds (88,200 samples)
    3. Extract MFCCs (40), Chroma (12), Mel (128), Contrast (7), Tonnetz (6)
    4. Flatten into 1D array and standardize using saved scaler
    
    Returns: Scaled feature vector ready for TensorFlow model inference  
    """
    y, sr = librosa.load(file_path, sr=SAMPLE_RATE)
    
    # Standardize length
    if len(y) > SAMPLES_PER_TRACK:
        y = y[:SAMPLES_PER_TRACK]
    else:
        padding = SAMPLES_PER_TRACK - len(y)
        y = np.pad(y, (0, padding), mode='constant')

    # Extract the 5 specific features
    mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40).T, axis=0)
    stft = np.abs(librosa.stft(y))
    chroma = np.mean(librosa.feature.chroma_stft(S=stft, sr=sr).T, axis=0)
    mel = np.mean(librosa.feature.melspectrogram(y=y, sr=sr).T, axis=0)
    contrast = np.mean(librosa.feature.spectral_contrast(S=stft, sr=sr).T, axis=0)
    tonnetz = np.mean(librosa.feature.tonnetz(y=librosa.effects.harmonic(y), sr=sr).T, axis=0)
    
    # Combine and scale
    features = np.hstack([mfcc, chroma, mel, contrast, tonnetz]).reshape(1, -1)
    return scaler.transform(features)

def calculate_confidence(emotion_probabilities):
    """
    Applies our heuristic weights to the neural network's probabilities.
    """
    weights = {'happy': 1.0, 'surprised': 0.9, 'neutral': 0.8, 'angry': 0.6, 'disgust': 0.4, 'sad': 0.3, 'fearful': 0.2}
    score = sum(prob * weights.get(emotion, 0.5) for prob, emotion in zip(emotion_probabilities, classes))
    return round(score * 100, 2)

def calculate_engagement(file_path):
    """
    Calculates vocal variance (RMS and Pitch) to determine how dynamic the speaker is.
    """
    try:
        y, sr = librosa.load(file_path, sr=SAMPLE_RATE)
        energy_std = np.std(librosa.feature.rms(y=y)[0])
        pitch_std = np.std(librosa.feature.spectral_centroid(y=y, sr=sr)[0])
        
        raw_engagement = (energy_std * 1000) + (pitch_std / 20)
        return round(min(max(raw_engagement, 0), 100), 2)
    except:
        return 0.0

def analyze_audio_file(file_path):
    input_features = process_audio(file_path)
    preds = model.predict(input_features, verbose=0)[0]

    predicted_emotion = classes[np.argmax(preds)]
    confidence = calculate_confidence(preds)
    engagement = calculate_engagement(file_path)

    # 4. Return as a dictionary (CASTED TO NATIVE PYTHON TYPES)
    return {
        "detected_tone": str(predicted_emotion),
        "confidence_score": float(confidence),
        "engagement_score": float(engagement)
    }

def convert_to_standard_wav(input_path: str, output_path: str) -> bool:
    """
    Converts any audio file to standardized 16kHz mono wav format using FFmpeg.

    Browser MediaRecorder outputs webm by default. Our ML model was trained on
    16kHz mono wav files, so we must convert before feature extraction.

    Args:
        input_path: Path to the original audio file (any format)
        output_path: Path where the converted wav will be saved

    Returns:
        True if conversion succeeded, raises Exception if failed
    """
    import subprocess

    # FFmpeg command: force overwrite (-y), input file (-i), 16kHz sample rate (-ar),
    # mono channel (-ac 1), PCM 16-bit encoding (-c:a pcm_s16le)
    command = [
        'ffmpeg', '-y', '-i', input_path,
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        output_path
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"FFmpeg conversion failed: {result.stderr}")
        return True
    except FileNotFoundError:
        raise Exception("FFmpeg not found. Install from https://ffmpeg.org/download.html and add to PATH")
    except Exception as e:
        raise Exception(f"Audio conversion error: {str(e)}")

def calculate_fluency_metrics(transcript: str, duration_seconds: float) -> dict:
    """
    Calculates speech fluency metrics from transcribed text.

    This is deliberately rule-based rather than ML-based because filler word
    counting is a deterministic problem with a ground truth answer. A probabilistic
    model would reduce explainability without improving accuracy.

    Metrics:
    - Words Per Minute (WPM): Speech rate normalized to 60-second window
    - Filler word count: Instances of hesitation markers (um, uh, like, etc.)
    - Fluency score: 100-point scale with configurable penalty per filler

    Args:
        transcript: Text output from speech-to-text (e.g., Whisper)
        duration_seconds: Length of the audio clip

    Returns:
        Dictionary with wpm, filler_word_count, filler_words_detected, fluency_score
    """
    # Configurable penalty weight - optimized for intuitive scoring breakpoints
    # (0 fillers=100, 5=60, 12=0). In production, this would be empirically validated
    # using regression against human expert ratings of interview fluency.
    FILLER_PENALTY = 8

    # Handle edge cases: empty transcript or zero duration
    if not transcript or not transcript.strip() or duration_seconds <= 0:
        return {
            "wpm": 0.0,
            "filler_word_count": 0,
            "filler_words_detected": [],
            "fluency_score": 100.0
        }

    # Calculate words per minute
    words = transcript.split()
    word_count = len(words)
    wpm = round((word_count / duration_seconds) * 60, 1)

    # Define common filler words and phrases
    # Includes both single words (um, uh) and multi-word hesitation markers
    filler_words_list = [
        "um", "uh", "like", "you know", "basically",
        "literally", "so yeah", "right so"
    ]

    # Count filler word occurrences (case-insensitive)
    transcript_lower = transcript.lower()
    total_filler_count = 0
    detected_fillers = []

    for filler in filler_words_list:
        count = transcript_lower.count(filler)
        if count > 0:
            total_filler_count += count
            detected_fillers.append(filler)

    # Calculate fluency score: start at 100, apply penalty per filler
    fluency_score = max(0.0, round(100.0 - (total_filler_count * FILLER_PENALTY), 1))

    return {
        "wpm": wpm,
        "filler_word_count": total_filler_count,
        "filler_words_detected": detected_fillers,
        "fluency_score": fluency_score
    }

# Pause analysis thresholds — tunable without touching scoring logic
IDEAL_PAUSE_MIN = 1.0       # seconds
IDEAL_PAUSE_MAX = 2.0
ACCEPTABLE_PAUSE_MIN = 0.5
ACCEPTABLE_PAUSE_MAX = 2.5
IDEAL_RATE_MIN = 3          # pauses per minute
IDEAL_RATE_MAX = 5
ACCEPTABLE_RATE_MIN = 2
ACCEPTABLE_RATE_MAX = 6
HESITATION_PAUSE_THRESHOLD = 3.0
MIN_AUDIO_DURATION = 5.0    # seconds

def analyze_pause_patterns(file_path: str) -> dict:
    """
    Analyzes silence segments to distinguish strategic pauses from nervous hesitation.

    Based on Goldman-Eisler (1968) research showing that strategic pauses
    improve listener comprehension. Confident speakers use 1-2s pauses
    between thoughts, while nervous speakers either rush (no pauses) or
    hesitate excessively (>3s pauses).

    Args:
        file_path: Path to a wav audio file

    Returns:
        Dictionary with pause_count, average_pause_duration, pause_quality_score
    """
    default = {"pause_count": 0, "average_pause_duration": 0.0, "pause_quality_score": 50}

    try:
        y, sr = librosa.load(file_path, sr=None)
        duration = len(y) / sr

        if duration < MIN_AUDIO_DURATION:
            return default

        # Detect non-silent intervals; gaps between them are pauses
        non_silent = librosa.effects.split(y, top_db=30)

        if len(non_silent) < 2:
            return {**default, "pause_count": 0}

        pause_durations = []
        for i in range(1, len(non_silent)):
            gap = (non_silent[i][0] - non_silent[i - 1][1]) / sr
            if gap > 0.1:  # ignore imperceptibly short inter-frame gaps
                pause_durations.append(gap)

        pause_count = len(pause_durations)
        avg_duration = float(np.mean(pause_durations)) if pause_durations else 0.0
        pauses_per_minute = (pause_count / duration) * 60

        # Score based on Goldman-Eisler thresholds
        ideal_rate = IDEAL_RATE_MIN <= pauses_per_minute <= IDEAL_RATE_MAX
        ideal_duration = IDEAL_PAUSE_MIN <= avg_duration <= IDEAL_PAUSE_MAX
        acceptable_rate = ACCEPTABLE_RATE_MIN <= pauses_per_minute <= ACCEPTABLE_RATE_MAX
        acceptable_duration = ACCEPTABLE_PAUSE_MIN <= avg_duration <= ACCEPTABLE_PAUSE_MAX
        rushing = pauses_per_minute < ACCEPTABLE_RATE_MIN
        hesitating = pauses_per_minute > ACCEPTABLE_RATE_MAX or avg_duration > HESITATION_PAUSE_THRESHOLD

        if ideal_rate and ideal_duration:
            score = 92
        elif ideal_rate or ideal_duration:
            score = 80
        elif acceptable_rate and acceptable_duration:
            score = 72
        elif acceptable_rate or acceptable_duration:
            score = 62
        elif rushing:
            score = 50
        elif hesitating:
            score = 35
        else:
            score = 50

        return {
            "pause_count": pause_count,
            "average_pause_duration": round(avg_duration, 2),
            "pause_quality_score": score
        }

    except Exception:
        return default


def calculate_technical_depth(transcript: str, job_description: str, cv_text: str) -> dict:
    """
    Measures technical expertise depth by counting domain-specific
    terminology relative to total word count. Based on Maurer & Fay (1988)
    research showing job-relevant language strongly predicts interview success.
    Higher density indicates genuine expertise vs surface-level knowledge.

    Args:
        transcript: The candidate's spoken answer
        job_description: Job description text used to identify relevant terms
        cv_text: CV text used to identify relevant terms

    Returns:
        Dictionary with technical_terms_found, technical_term_count,
        technical_depth_score, and relevant_terms_extracted
    """
    default = {
        "technical_terms_found": [],
        "technical_term_count": 0,
        "technical_depth_score": 50,
        "relevant_terms_extracted": []
    }

    if not transcript or not transcript.strip():
        return default

    # No reference context — can't extract domain terms
    if not job_description.strip() and not cv_text.strip():
        return default

    try:
        from groq import Groq
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        prompt = f"""Extract the most important technical terms, tools, frameworks, \
and methodologies from the following job description and CV. \
Return ONLY a Python list of strings, no explanation.

Focus on:
- Programming languages
- Frameworks and libraries
- Methodologies (e.g., Agile, TDD)
- Domain-specific concepts (e.g., regression, classification)
- Tools and platforms (e.g., AWS, Docker)

Aim for 15-25 most relevant terms.

JOB DESCRIPTION:
{job_description}

CV:
{cv_text}

Return format: ["term1", "term2", "term3", ...]"""

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=256
        )
        raw = response.choices[0].message.content.strip()

        # Parse the list — handle both JSON arrays and Python list literals
        # Strip any markdown fences the model may have added
        clean = raw.replace("```json", "").replace("```python", "").replace("```", "").strip()
        relevant_terms = json.loads(clean)
        if not isinstance(relevant_terms, list):
            return default

    except Exception:
        return default

    # Whole-word, case-insensitive search for each extracted term
    transcript_lower = transcript.lower()
    words = transcript.split()
    total_words = len(words)

    found_terms = []
    for term in relevant_terms:
        # re.escape handles multi-word terms and special chars (e.g. "C++", "Node.js")
        pattern = r'\b' + re.escape(term.lower()) + r'\b'
        if re.search(pattern, transcript_lower):
            found_terms.append(term)

    term_count = len(found_terms)

    # Normalize density to 0-100 using two linear segments:
    # 0% → 0, 5% → 50, 10%+ → 100
    if total_words == 0:
        score = 0
    else:
        density = (term_count / total_words) * 100
        if density <= 0:
            score = 0
        elif density <= 5:
            score = round(density * 10)        # 0–5% maps to 0–50
        else:
            score = round(min(50 + (density - 5) * 10, 100))  # 5–10% maps to 50–100

    return {
        "technical_terms_found": found_terms,
        "technical_term_count": term_count,
        "technical_depth_score": score,
        "relevant_terms_extracted": relevant_terms
    }


def calculate_pacing_score(duration_seconds: float, word_count: int) -> dict:
    """
    Evaluates answer length against research-backed optimal ranges.
    Based on Barrick et al. (2009) showing optimal interview answers
    are 45-90 seconds. Balances preparedness (not too short) with
    conciseness (not rambling).

    Args:
        duration_seconds: How long the answer took
        word_count: Total words in the transcript

    Returns:
        Dictionary with pacing_score, duration_assessment, word_count_assessment
    """
    default = {"pacing_score": 50, "duration_assessment": "optimal", "word_count_assessment": "optimal"}

    if duration_seconds < 3 or word_count < 5:
        return default

    def _deviation_penalty(value, ideal_min, ideal_max, acceptable_min, acceptable_max):
        if ideal_min <= value <= ideal_max:
            return 100
        elif acceptable_min <= value < ideal_min:
            return 70 + 30 * ((value - acceptable_min) / (ideal_min - acceptable_min))
        elif ideal_max < value <= acceptable_max:
            return 100 - 30 * ((value - ideal_max) / (acceptable_max - ideal_max))
        elif value < acceptable_min:
            return max(40, 70 - 30 * ((acceptable_min - value) / acceptable_min))
        else:  # value > acceptable_max
            return max(30, 70 - 40 * ((value - acceptable_max) / acceptable_max))

    duration_score = _deviation_penalty(duration_seconds, 45, 90, 30, 120)
    word_score = _deviation_penalty(word_count, 60, 150, 40, 200)
    pacing_score = round((duration_score + word_score) / 2)

    if duration_seconds < 45:
        duration_assessment = "too_short"
    elif duration_seconds <= 90:
        duration_assessment = "optimal"
    else:
        duration_assessment = "too_long"

    if word_count < 60:
        word_count_assessment = "too_brief"
    elif word_count <= 150:
        word_count_assessment = "optimal"
    else:
        word_count_assessment = "too_verbose"

    return {
        "pacing_score": pacing_score,
        "duration_assessment": duration_assessment,
        "word_count_assessment": word_count_assessment
    }


def calculate_relevance_score(transcript: str, reference_text: str) -> float:
    """
    Calculates semantic relevance between candidate's answer and job requirements.

    Uses TF-IDF (Term Frequency-Inverse Document Frequency) vectorization and
    cosine similarity to measure how closely the candidate's response aligns with
    the combined CV and job description text.

    Why TF-IDF over neural embeddings (BERT, Word2Vec)?
    1. Deterministic - same input always produces same output
    2. Lightweight - no GPU required, runs in milliseconds
    3. Keyword-focused - for technical interviews, exact term usage (Python, SQL)
       demonstrates domain knowledge better than semantic paraphrasing

    How it works:
    - TF (Term Frequency): How often a word appears in the text
    - IDF (Inverse Document Frequency): How rare/important the word is
    - TF-IDF gives high scores to important words (Python, machine learning)
      and low scores to common words (the, and, is)
    - Cosine similarity measures the angle between the two TF-IDF vectors
      (0° = identical topics, 90° = unrelated)

    Args:
        transcript: The candidate's spoken answer (from speech-to-text)
        reference_text: Combined CV text + job description text

    Returns:
        Relevance score from 0-100 (0 = completely unrelated, 100 = perfect match)
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    # Edge case: if either text is too short, return neutral score
    # Less than 10 words doesn't provide enough context for meaningful comparison
    if len(transcript.split()) < 10 or len(reference_text.split()) < 10:
        return 50.0

    # Create TF-IDF vectorizer
    # This will convert text into numerical vectors where each dimension represents
    # the importance of a specific word
    vectorizer = TfidfVectorizer()

    # Transform both texts into TF-IDF vectors
    # fit_transform() builds the vocabulary and converts texts to vectors in one step
    tfidf_matrix = vectorizer.fit_transform([transcript, reference_text])

    # Calculate cosine similarity between the two vectors
    # tfidf_matrix[0:1] = candidate's answer vector
    # tfidf_matrix[1:2] = reference text vector
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    # Convert from 0-1 scale to 0-100 percentage for user-friendly display
    return round(float(similarity * 100), 1)