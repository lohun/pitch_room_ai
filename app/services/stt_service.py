from faster_whisper import WhisperModel
import numpy as np
import io

class STTService:
    def __init__(self, model_size: str = "base"):
        # We use "base" or "small" for better latency on consumer hardware
        # "cpu" or "cuda" depending on availability
        self.model = WhisperModel(model_size, device="cpu", compute_type="int8")

    def transcribe(self, audio_data: np.ndarray) -> str:
        """
        Transcribes a 1D float32 numpy array.
        """
        segments, info = self.model.transcribe(audio_data, beam_size=5)
        
        text = " ".join([segment.text for segment in segments])
        return text.strip()
