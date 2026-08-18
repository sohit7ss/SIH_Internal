import requests

OLLAMA_MODEL = "llama3.2:3b"

def summarize_text(transcript: str) -> str:
    resp = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": f"Summarize this lecture transcript in clear bullet points, "
                    f"covering the main topics and key takeaways:\n\n{transcript}",
            "stream": False
        }
    )
    result = resp.json()
    return result.get("response", "")