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
    Loads an audio file, pads/truncates it to 4 seconds, and extracts the 193 DSP features.
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