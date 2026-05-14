"""
Firebase Admin SDK initialization for IntWiz.

Provides shared db (Firestore) and bucket (Storage) references that other
modules import. Handles re-import safely via the _apps guard so the SDK is
only initialized once per server process.

Supports two credential loading modes:
1. Local development: reads serviceAccountKey.json from project root
2. Production deployment: reads FIREBASE_SERVICE_ACCOUNT_JSON env var
   containing the same JSON content as a string

This dual mode allows the same code to work locally and on cloud platforms
(Render, Railway, etc.) where you can't commit secret files but can set
environment variables.
"""
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage


def _load_credentials():
    """
    Loads Firebase service account credentials.

    Priority:
    1. FIREBASE_SERVICE_ACCOUNT_JSON env var (production)
    2. serviceAccountKey.json file (local development)

    Returns:
        tuple: (credentials.Certificate, project_id)
    """
    # Production: read JSON from environment variable
    env_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if env_json:
        try:
            service_account = json.loads(env_json)
        except json.JSONDecodeError as e:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT_JSON is set but contains invalid JSON. "
                f"Parse error: {e}"
            )

        project_id = service_account.get("project_id")
        if not project_id:
            raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON is missing 'project_id'.")

        cred = credentials.Certificate(service_account)
        return cred, project_id

    # Local development: read from JSON file
    cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

    if not os.path.exists(cred_path):
        raise FileNotFoundError(
            f"No Firebase credentials found. Either:\n"
            f"  1. Place serviceAccountKey.json at {cred_path} (local dev), OR\n"
            f"  2. Set FIREBASE_SERVICE_ACCOUNT_JSON env var with the JSON content (production)"
        )

    with open(cred_path) as f:
        service_account = json.load(f)

    project_id = service_account.get("project_id")
    if not project_id:
        raise ValueError("serviceAccountKey.json is missing the 'project_id' field.")

    cred = credentials.Certificate(cred_path)
    return cred, project_id


# Initialize the Firebase Admin SDK
try:
    if not firebase_admin._apps:
        _cred, _project_id = _load_credentials()
        firebase_admin.initialize_app(_cred, {
            "storageBucket": f"{_project_id}.firebasestorage.app"
        })

    db = firestore.client()
    bucket = storage.bucket()

except Exception as e:
    raise RuntimeError(f"Firebase initialization failed: {e}") from e
