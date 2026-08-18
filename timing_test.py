# # timing_test.py
# import time
# from faster_whisper import WhisperModel
# import requests
# import json

# AUDIO_FILE = "test_lecture.mp3"
# OLLAMA_MODEL = "llama3.2:3b"  # match what you pulled

# def transcribe(audio_path):
#     print("Loading Whisper model...")
#     t0 = time.time()
#     # "base" or "small" model — good speed/accuracy tradeoff for a laptop
#     model = WhisperModel("small", device="cpu", compute_type="int8")
#     load_time = time.time() - t0
#     print(f"Model load time: {load_time:.1f}s")

#     print("Transcribing...")
#     t1 = time.time()
#     segments, info = model.transcribe(audio_path, beam_size=5)
#     text = " ".join([seg.text for seg in segments])
#     transcribe_time = time.time() - t1
#     print(f"Transcription time: {transcribe_time:.1f}s")
#     print(f"Detected language: {info.language}")
#     print(f"Transcript length: {len(text)} chars")
#     return text, transcribe_time

# def summarize(transcript):
#     print("Summarizing with Ollama...")
#     t0 = time.time()
#     resp = requests.post(
#         "http://localhost:11434/api/generate",
#         json={
#             "model": OLLAMA_MODEL,
#             "prompt": f"Summarize this lecture transcript in clear bullet points, "
#                       f"covering the main topics and key takeaways:\n\n{transcript}",
#             "stream": False
#         }
#     )
#     summarize_time = time.time() - t0
#     print(f"Summarization time: {summarize_time:.1f}s")
#     result = resp.json()
#     return result.get("response", ""), summarize_time

# if __name__ == "__main__":
#     total_start = time.time()

#     transcript, t_time = transcribe(AUDIO_FILE)
#     print("\n--- TRANSCRIPT (first 500 chars) ---")
#     print(transcript[:500])

#     summary, s_time = summarize(transcript)
#     print("\n--- SUMMARY ---")
#     print(summary)

#     total_time = time.time() - total_start
#     print("\n=== TIMING REPORT ===")
#     print(f"Transcription: {t_time:.1f}s")
#     print(f"Summarization: {s_time:.1f}s")
#     print(f"TOTAL: {total_time:.1f}s ({total_time/60:.1f} min)")

#     # Save results so you have proof/documentation
#     with open("timing_results.json", "w") as f:
#         json.dump({
#             "audio_file": AUDIO_FILE,
#             "transcribe_seconds": t_time,
#             "summarize_seconds": s_time,
#             "total_seconds": total_time
#         }, f, indent=2)
# timing_test.py
import time
from faster_whisper import WhisperModel
import requests
import json

AUDIO_FILE = "test_lecture.mp3"
OLLAMA_MODEL = "llama3.2:3b"  # match what you pulled

def transcribe(audio_path):
    print("Loading Whisper model...")
    t0 = time.time()
    # "base" or "small" model — good speed/accuracy tradeoff for a laptop
    model = WhisperModel("small", device="cpu", compute_type="int8")
    load_time = time.time() - t0
    print(f"Model load time: {load_time:.1f}s")

    print("Transcribing...")
    t1 = time.time()
    segments, info = model.transcribe(audio_path, beam_size=5)
    text = " ".join([seg.text for seg in segments])
    transcribe_time = time.time() - t1
    print(f"Transcription time: {transcribe_time:.1f}s")
    print(f"Detected language: {info.language}")
    print(f"Transcript length: {len(text)} chars")
    return text, transcribe_time

def summarize(transcript):
    print("Summarizing with Ollama...")
    t0 = time.time()
    resp = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": f"Summarize this lecture transcript in clear bullet points, "
                      f"covering the main topics and key takeaways:\n\n{transcript}",
            "stream": False
        }
    )
    summarize_time = time.time() - t0
    print(f"Summarization time: {summarize_time:.1f}s")
    result = resp.json()
    return result.get("response", ""), summarize_time

if __name__ == "__main__":
    total_start = time.time()

    transcript, t_time = transcribe(AUDIO_FILE)
    print("\n--- TRANSCRIPT (first 500 chars) ---")
    print(transcript[:500])

    summary, s_time = summarize(transcript)
    print("\n--- SUMMARY ---")
    print(summary)

    # === ADD THIS BLOCK ===
    with open("output_summary.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    with open("output_transcript.txt", "w", encoding="utf-8") as f:
        f.write(transcript)
    print("\nSaved output_summary.txt and output_transcript.txt")
    # === END ADDED BLOCK ===

    total_time = time.time() - total_start
    print("\n=== TIMING REPORT ===")
    print(f"Transcription: {t_time:.1f}s")
    print(f"Summarization: {s_time:.1f}s")
    print(f"TOTAL: {total_time:.1f}s ({total_time/60:.1f} min)")

    # Save results so you have proof/documentation
    with open("timing_results.json", "w") as f:
        json.dump({
            "audio_file": AUDIO_FILE,
            "transcribe_seconds": t_time,
            "summarize_seconds": s_time,
            "total_seconds": total_time
        }, f, indent=2)