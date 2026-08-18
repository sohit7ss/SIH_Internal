import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Matches your locked schema's collection names
COLLECTION_MAP = {
    "quizResponse": "quizResponses",
    "attendance": "attendance",
    "lectureProgress": "lectureProgress",
}


def push_record(record_type: str, record_id: str, data: dict) -> dict:
    collection_name = COLLECTION_MAP.get(record_type)
    if not collection_name:
        return {"id": record_id, "status": "error", "detail": f"Unknown record_type: {record_type}"}

    try:
        db.collection(collection_name).document(record_id).set(data, merge=True)
        return {"id": record_id, "status": "synced"}
    except Exception as e:
        return {"id": record_id, "status": "error", "detail": str(e)}