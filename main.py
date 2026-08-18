# # # main.py
# # from fastapi import FastAPI, UploadFile, File
# # from fastapi.responses import JSONResponse
# # import shutil
# # import os

# # app = FastAPI()

# # @app.get("/health")
# # def health():
# #     return {"status": "ok"}

# # @app.post("/lecture/summarize")
# # async def summarize_lecture(audio: UploadFile = File(...)):
# #     # STUB ONLY — no real processing yet today.
# #     # Later: save audio -> run faster-whisper -> run Ollama -> generate PDF -> return path
# #     temp_path = f"temp_{audio.filename}"
# #     with open(temp_path, "wb") as buffer:
# #         shutil.copyfileobj(audio.file, buffer)

# #     file_size = os.path.getsize(temp_path)
# #     os.remove(temp_path)  # cleanup for now, real version will keep it

# #     return JSONResponse({
# #         "status": "stub_received",
# #         "filename": audio.filename,
# #         "size_bytes": file_size,
# #         "summaryPdfUrl": None  # placeholder matching the schema field
# #     })



# # main.py
# from fastapi import FastAPI, UploadFile, File
# from fastapi.responses import JSONResponse, FileResponse
# from faster_whisper import WhisperModel
# from fpdf import FPDF
# import requests
# import shutil
# import os
# import time
# import uuid

# app = FastAPI()

# # Load Whisper model ONCE at startup, not per-request — loading takes ~1.6s
# # once cached, but no reason to pay that cost on every single upload.
# print("Loading Whisper model...")
# whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
# print("Whisper model ready.")

# OLLAMA_MODEL = "llama3.2:3b"
# UPLOAD_DIR = "uploads"
# PDF_DIR = "summaries"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# os.makedirs(PDF_DIR, exist_ok=True)


# @app.get("/health")
# def health():
#     return {"status": "ok"}


# @app.get("/lan-check")
# def lan_check():
#     # Signal the app can use to confirm "I'm talking to the local classroom server"
#     # specifically — not just any server. App should check both status AND service name.
#     return {
#         "status": "ok",
#         "service": "classroom-local-server",
#         "on_lan": True
#     }


# def transcribe_audio(audio_path: str) -> str:
#     segments, info = whisper_model.transcribe(audio_path, beam_size=5)
#     text = " ".join([seg.text for seg in segments])
#     return text.strip()


# def summarize_text(transcript: str) -> str:
#     resp = requests.post(
#         "http://localhost:11434/api/generate",
#         json={
#             "model": OLLAMA_MODEL,
#             "prompt": f"Summarize this lecture transcript in clear bullet points, "
#                       f"covering the main topics and key takeaways:\n\n{transcript}",
#             "stream": False
#         }
#     )
#     result = resp.json()
#     return result.get("response", "")


# def make_pdf(summary_text: str, output_path: str, title: str = "Lecture Summary"):
#     pdf = FPDF()
#     pdf.add_page()
#     pdf.set_font("Helvetica", "B", 16)
#     pdf.cell(0, 10, title, ln=True)
#     pdf.ln(4)
#     pdf.set_font("Helvetica", size=11)
#     # multi_cell handles line wrapping automatically
#     # encode/decode strips characters fpdf2's default font can't render (emoji etc.)
#     safe_text = summary_text.encode("latin-1", "ignore").decode("latin-1")
#     pdf.multi_cell(0, 7, safe_text)
#     pdf.output(output_path)


# @app.post("/lecture/summarize")
# async def summarize_lecture(audio: UploadFile = File(...)):
#     job_id = str(uuid.uuid4())[:8]
#     audio_ext = os.path.splitext(audio.filename)[1] or ".mp3"
#     audio_path = os.path.join(UPLOAD_DIR, f"{job_id}{audio_ext}")
#     pdf_filename = f"{job_id}_summary.pdf"
#     pdf_path = os.path.join(PDF_DIR, pdf_filename)

#     # Save uploaded audio to disk
#     with open(audio_path, "wb") as buffer:
#         shutil.copyfileobj(audio.file, buffer)

#     timings = {}
#     t0 = time.time()

#     try:
#         transcript = transcribe_audio(audio_path)
#         timings["transcribe_sec"] = round(time.time() - t0, 1)

#         t1 = time.time()
#         summary = summarize_text(transcript)
#         timings["summarize_sec"] = round(time.time() - t1, 1)

#         make_pdf(summary, pdf_path, title=f"Lecture Summary — {audio.filename}")

#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={"status": "error", "detail": str(e)}
#         )
#     finally:
#         # Clean up the raw audio file — keep only the PDF, matching schema intent
#         if os.path.exists(audio_path):
#             os.remove(audio_path)

#     total_time = round(time.time() - t0, 1)

#     return JSONResponse({
#         "status": "completed",
#         "filename": audio.filename,
#         "summaryPdfUrl": f"/files/{pdf_filename}",  # relative path, served below
#         "timings": timings,
#         "total_seconds": total_time
#     })


# @app.get("/files/{filename}")
# def get_pdf(filename: str):
#     path = os.path.join(PDF_DIR, filename)
#     if not os.path.exists(path):
#         return JSONResponse(status_code=404, content={"detail": "File not found"})
#     return FileResponse(path, media_type="application/pdf", filename=filename)




from dotenv import load_dotenv
load_dotenv()  # must run before any os.environ.get() calls, so put this at the very top

from fastapi import FastAPI
from routers import health, lecture, livekit_token, sync

app = FastAPI()

app.include_router(health.router)
app.include_router(lecture.router)
app.include_router(livekit_token.router)
app.include_router(sync.router)