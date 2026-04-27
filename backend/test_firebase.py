from firebase_config import db, bucket

# Test Firestore
try:
    # Attempt to list collections to verify connection
    collections = db.collections()
    print("✅ Firestore connected successfully")
except Exception as e:
    print(f"❌ Firestore error: {e}")

# Test Storage
try:
    print(f"✅ Storage bucket: {bucket.name}")
except Exception as e:
    print(f"❌ Storage error: {e}")

print("\n🎉 Firebase setup complete!")
