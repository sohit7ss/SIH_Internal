from faster_whisper import WhisperModel

print("Loading Whisper model...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
print("Whisper model ready.")

def transcribe_audio(audio_path: str) -> str:
    segments, info = whisper_model.transcribe(audio_path, beam_size=5)
    text = " ".join([seg.text for seg in segments])
    return text.strip() 