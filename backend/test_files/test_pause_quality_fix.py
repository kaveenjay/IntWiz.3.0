"""
Test script to verify the pause quality fix on real interview audio files.

This script:
1. Downloads audio files from Firebase Storage (URLs from your saved report)
2. Runs analyze_pause_patterns on each
3. Compares old vs new scores

Run from the backend folder with:
    python test_files/test_pause_quality_fix.py

Make sure backend/.env has GROQ_API_KEY set.
"""

import sys
import os
import urllib.request
import tempfile

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from audio_utils import analyze_pause_patterns

# Audio URLs from your saved report (replace if needed with current URLs)
TEST_CASES = [
    {
        "id": "Q1 (rambling — old: 62)",
        "url": "https://storage.googleapis.com/intwiz-production.firebasestorage.app/interview-audio/7e6hUn1C4oaF8lqyQVqX4DITZtJ2/4478e14c-5e4a-4e94-998a-c16c988f0b7d/q1_answer.wav",
        "old_score": 62,
    },
    {
        "id": "Q2 (data quality — old: 35)",
        "url": "https://storage.googleapis.com/intwiz-production.firebasestorage.app/interview-audio/7e6hUn1C4oaF8lqyQVqX4DITZtJ2/4478e14c-5e4a-4e94-998a-c16c988f0b7d/q2_answer.wav",
        "old_score": 35,
    },
    {
        "id": "Q3 (UK road — old: 35)",
        "url": "https://storage.googleapis.com/intwiz-production.firebasestorage.app/interview-audio/7e6hUn1C4oaF8lqyQVqX4DITZtJ2/4478e14c-5e4a-4e94-998a-c16c988f0b7d/q3_answer.wav",
        "old_score": 35,
    },
    {
        "id": "Q8 (ARIMA — old: 35)",
        "url": "https://storage.googleapis.com/intwiz-production.firebasestorage.app/interview-audio/7e6hUn1C4oaF8lqyQVqX4DITZtJ2/4478e14c-5e4a-4e94-998a-c16c988f0b7d/q8_answer.wav",
        "old_score": 35,
    },
    {
        "id": "Q9 (Matplotlib — old: 35)",
        "url": "https://storage.googleapis.com/intwiz-production.firebasestorage.app/interview-audio/7e6hUn1C4oaF8lqyQVqX4DITZtJ2/4478e14c-5e4a-4e94-998a-c16c988f0b7d/q9_answer.wav",
        "old_score": 35,
    },
]


def download_audio(url: str) -> str:
    """Downloads audio from URL to a temporary file. Returns local path."""
    # Create a temp file with .wav extension
    fd, temp_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)

    print(f"  Downloading...", end=" ", flush=True)
    urllib.request.urlretrieve(url, temp_path)
    size_kb = os.path.getsize(temp_path) / 1024
    print(f"OK ({size_kb:.0f} KB)")

    return temp_path


def main():
    print("=" * 70)
    print("PAUSE QUALITY FIX — TEST RUN")
    print("=" * 70)

    for i, case in enumerate(TEST_CASES, 1):
        print(f"\n{'─' * 70}")
        print(f"TEST {i}: {case['id']}")
        print(f"{'─' * 70}")

        try:
            audio_path = download_audio(case["url"])

            try:
                result = analyze_pause_patterns(audio_path)

                print(f"  Old score:        {case['old_score']} / 100")
                print(f"  New score:        {result['pause_quality_score']} / 100")
                print(f"  Improvement:      {result['pause_quality_score'] - case['old_score']:+d}")
                print(f"  Pause count:      {result['pause_count']}")
                print(f"  Avg duration:     {result['average_pause_duration']}s")
            finally:
                # Clean up temp file
                if os.path.exists(audio_path):
                    os.remove(audio_path)

        except Exception as e:
            print(f"  ERROR: {e}")

    print()
    print("=" * 70)
    print("DONE — review scores above and decide if calibration is acceptable")
    print("=" * 70)


if __name__ == "__main__":
    main()