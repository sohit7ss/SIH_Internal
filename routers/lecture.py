from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
import shutil
import os
import time
import uuid

from services.transcribe import transcribe_audio
from services.summarize import summarize_text
from services.pdf import make_pdf

router = APIRouter(
    tags=["lecture"]
)

UPLOAD_DIR = "uploads"
PDF_DIR = "summaries"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PDF_DIR, exist_ok=True)


@router.post("/lecture/summarize")
async def summarize_lecture(audio: UploadFile = File(...)):
    job_id = str(uuid.uuid4())[:8]
    audio_ext = os.path.splitext(audio.filename)[1] or ".mp3"
    audio_path = os.path.join(UPLOAD_DIR, f"{job_id}{audio_ext}")
    pdf_filename = f"{job_id}_summary.pdf"
    pdf_path = os.path.join(PDF_DIR, pdf_filename)

    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    timings = {}
    t0 = time.time()

    try:
        transcript = transcribe_audio(audio_path)
        timings["transcribe_sec"] = round(time.time() - t0, 1)

        t1 = time.time()
        summary = summarize_text(transcript)
        timings["summarize_sec"] = round(time.time() - t1, 1)

        # make_pdf(summary, pdf_path, title=f"Lecture Summary — {audio.filename}")
        make_pdf(summary, pdf_path, title=f"Lecture Summary — {audio.filename}")
        

    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

    total_time = round(time.time() - t0, 1)

    return JSONResponse({
        "status": "completed",
        "filename": audio.filename,
        "summaryPdfUrl": f"/files/{pdf_filename}",
        "timings": timings,
        "total_seconds": total_time
    })


@router.get("/files/{filename}")
def get_pdf(filename: str):
    path = os.path.join(PDF_DIR, filename)
    if not os.path.exists(path):
        return JSONResponse(status_code=404, content={"detail": "File not found"})
    return FileResponse(path, media_type="application/pdf", filename=filename)