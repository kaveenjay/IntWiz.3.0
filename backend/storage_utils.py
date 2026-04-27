"""
Firebase Cloud Storage utilities for IntWiz audio file management.

Handles upload of recorded interview answers to organized per-user/per-session
paths, and enforces a 30-day retention policy by deleting stale blobs.

Storage layout:
    interview-audio/{user_id}/{interview_id}/q{n}_answer.wav

All uploads are made publicly readable so the frontend can stream audio
directly from the CDN URL without routing through the backend.
"""

import os
from datetime import datetime, timedelta

from firebase_config import bucket


def upload_audio_to_storage(
    file_path: str,
    user_id: str,
    interview_id: str,
    question_number: int,
) -> dict:
    """
    Uploads a recorded interview answer to Firebase Cloud Storage.

    Files are stored under interview-audio/{user_id}/{interview_id}/
    so each user's answers are isolated and easy to enumerate or delete.
    The blob is made publicly readable, returning a stable CDN URL the
    frontend can pass directly to an <audio> element.

    Args:
        file_path: Local path to the converted .wav file
        user_id: Firebase Auth UID of the candidate
        interview_id: Unique session identifier (e.g. "rpt_xyz789")
        question_number: 1-indexed question number within the session

    Returns:
        {
            "success": bool,
            "audio_url": public CDN URL or None,
            "storage_path": Firebase blob path or None,
            "error": error message string or None
        }
    """
    try:
        storage_path = (
            f"interview-audio/{user_id}/{interview_id}/q{question_number}_answer.wav"
        )

        blob = bucket.blob(storage_path)

        blob.metadata = {
            'uploadedAt': datetime.utcnow().isoformat(),
            'questionNumber': str(question_number),
        }

        blob.upload_from_filename(file_path, content_type='audio/wav')
        blob.make_public()

        return {
            'success': True,
            'audio_url': blob.public_url,
            'storage_path': storage_path,
            'error': None,
        }

    except Exception as e:
        return {
            'success': False,
            'audio_url': None,
            'storage_path': None,
            'error': str(e),
        }


def delete_old_audio(days_threshold: int = 30) -> dict:
    """
    Deletes interview audio files older than `days_threshold` days.

    IntWiz retains audio for 30 days to allow candidates to review their
    sessions, then purges to comply with minimal data-retention principles
    and keep Storage costs low. This function is intended to be called by
    a scheduled task (Cloud Scheduler → Cloud Function, or a server cron job).

    Age is determined by the 'uploadedAt' value written into blob metadata
    at upload time. Blobs whose metadata is missing or malformed are skipped
    rather than deleted, to avoid accidentally removing files uploaded by
    other processes.

    Args:
        days_threshold: Remove blobs uploaded more than this many days ago.
                        Defaults to 30.

    Returns:
        {
            "deleted_count": number of blobs successfully deleted,
            "error": error message string or None
        }
    """
    try:
        cutoff = datetime.utcnow() - timedelta(days=days_threshold)
        deleted_count = 0

        for blob in bucket.list_blobs(prefix='interview-audio/'):
            if not blob.metadata or 'uploadedAt' not in blob.metadata:
                continue

            try:
                upload_time = datetime.fromisoformat(blob.metadata['uploadedAt'])
            except ValueError:
                continue

            if upload_time < cutoff:
                blob.delete()
                deleted_count += 1

        return {'deleted_count': deleted_count, 'error': None}

    except Exception as e:
        return {'deleted_count': 0, 'error': str(e)}
