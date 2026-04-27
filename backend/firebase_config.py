"""
Firebase Admin SDK initialization for IntWiz.

Provides shared db (Firestore) and bucket (Storage) references that other
modules import. Handles re-import safely via the _apps guard so the SDK is
only initialized once per server process.
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage

_CRED_PATH = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')

if not os.path.exists(_CRED_PATH):
    raise FileNotFoundError(
        f"serviceAccountKey.json not found at {_CRED_PATH}. "
        "Download it from Firebase Console → Project Settings → Service Accounts."
    )

try:
    with open(_CRED_PATH) as f:
        _service_account = json.load(f)

    _project_id = _service_account.get('project_id')
    if not _project_id:
        raise ValueError("serviceAccountKey.json is missing the 'project_id' field.")

    if not firebase_admin._apps:
        _cred = credentials.Certificate(_CRED_PATH)
        firebase_admin.initialize_app(_cred, {
            'storageBucket': f'{_project_id}.firebasestorage.app'
        })

    db = firestore.client()
    bucket = storage.bucket()

except FileNotFoundError:
    raise
except ValueError:
    raise
except Exception as e:
    raise RuntimeError(f"Firebase initialization failed: {e}") from e
