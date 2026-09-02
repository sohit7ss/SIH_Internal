from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.firestore_sync import push_record, db
from services.attendance import calculate_attendance
import schemas

router = APIRouter(
    tags=["sync"]
)

class QuizResponseSync(BaseModel):
    studentId: str
    quizId: str
    answers: dict
    status: str
    score: Optional[float] = None
    lastSavedAt: str


# @router.post("/sync/push")
# def sync_push(batch: schemas.SyncBatch):
#     results = []
#     for record in batch.records:
#         data = record.data

#         if record.record_type == "attendance":
#             connected = data.get("connectedDurationSec", 0)
#             required = data.get("requiredDurationSec", 0)
#             attendance_result = calculate_attendance(connected, required)
#             data.update(attendance_result)

#         result = push_record(record.record_type, record.record_id, data)
#         results.append(result)

#     synced_count = sum(1 for r in results if r["status"] == "synced")
#     return {
#         "status": "completed",
#         "synced": synced_count,
#         "failed": len(results) - synced_count,
#         "results": results
#     }

@router.post("/sync/push")
def sync_push(batch: schemas.SyncBatch):
    results = []
    for record in batch.records:
        data = record.data

        if record.record_type == "attendance":
            connected = data.get("connectedDurationSec", 0)
            required = data.get("requiredDurationSec", 0)
            attendance_result = calculate_attendance(connected, required)
            data.update(attendance_result)

        # Freshness check — reject stale writes server-side, regardless of client race
        collection_name = push_record.__globals__["COLLECTION_MAP"].get(record.record_type)
        if collection_name:
            existing = db.collection(collection_name).document(record.record_id).get()
            if existing.exists:
                existing_time = existing.to_dict().get("lastSavedAt")
                incoming_time = data.get("lastSavedAt")
                if existing_time and incoming_time and existing_time > incoming_time:
                    results.append({"id": record.record_id, "status": "skipped", "reason": "server has newer data"})
                    continue

        result = push_record(record.record_type, record.record_id, data)
        results.append(result)

    synced_count = sum(1 for r in results if r["status"] == "synced")
    return {
        "status": "completed",
        "synced": synced_count,
        "failed": len(results) - synced_count,
        "results": results
    }


@router.post("/sync/quiz-response")
def sync_quiz_response(payload: QuizResponseSync):
    doc_id = f"{payload.studentId}_{payload.quizId}"
    doc_ref = db.collection("quizResponses").document(doc_id)

    existing = doc_ref.get()
    if existing.exists:
        existing_time = existing.to_dict().get("lastSavedAt")
        if existing_time and existing_time > payload.lastSavedAt:
            return {"status": "skipped", "reason": "server has newer data"}

    result = push_record("quizResponse", doc_id, payload.dict())
    return result
