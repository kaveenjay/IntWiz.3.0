import os
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