from dotenv import load_dotenv
load_dotenv()  # must run before any os.environ.get() calls, so put this at the very top
import os
from fastapi import FastAPI
from routers import health, lecture, livekit_token, sync
from pydantic import BaseModel
from typing import List
from google.cloud import firestore


app = FastAPI()
cred_path = os.path.join(os.path.dirname(__file__), os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
db = firestore.Client.from_service_account_json(cred_path)

app.include_router(health.router)
app.include_router(lecture.router)
app.include_router(livekit_token.router)
app.include_router(sync.router)


class SyncCheckRequest(BaseModel):
    collection: str
    recordIds: List[str]

class SyncCheckResult(BaseModel):
    recordId: str
    existsInFirestore: bool
    dataMatches: bool

@app.post("/sync/verify")
def verify_synced_records(req: SyncCheckRequest):
    """
    Client sends records it THINKS are synced.
    Server checks Firestore truth and tells client which ones actually aren't.
    Client should flip synced=false locally for any that come back mismatched.
    """
    results = []
    collection_ref = db.collection(req.collection)

    for record_id in req.recordIds:
        doc = collection_ref.document(record_id).get()
        exists = doc.exists
        results.append(SyncCheckResult(
            recordId=record_id,
            existsInFirestore=exists,
            dataMatches=exists
        ))

    failed = [r for r in results if not r.dataMatches]
    return {"checked": len(results), "failed": failed}