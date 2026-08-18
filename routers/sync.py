from fastapi import APIRouter
from services.firestore_sync import push_record
from services.attendance import calculate_attendance
import schemas

router = APIRouter(
    tags=["sync"]
)


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

        result = push_record(record.record_type, record.record_id, data)
        results.append(result)

    synced_count = sum(1 for r in results if r["status"] == "synced")
    return {
        "status": "completed",
        "synced": synced_count,
        "failed": len(results) - synced_count,
        "results": results
    }