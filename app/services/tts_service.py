import os
import time
import numpy as np
from kokoro import KPipeline
import soundfile as sf

class TTSService:
    def __init__(self, voice: str = "af_heart", lang_code: str = "a", speed: float = 1.0):
        self.voice = voice
        self.lang_code = lang_code
        self.speed = speed
        self.pipeline = KPipeline(lang_code=lang_code)

    def synthesize(self, text: str, session_id: str) -> str:
        generator = self.pipeline(text, voice=self.voice, speed=self.speed)
        
        audio_chunks = []
        for gs, ps, audio in generator:
            audio_chunks.append(audio)
        
        if not audio_chunks:
            raise ValueError("No audio generated from text")
        
        full_audio = np.concatenate(audio_chunks)
        
        timestamp = int(time.time() * 1000)
        filename = f"{session_id}_{timestamp}.wav"
        
        storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "storage")
        output_dir = os.path.join(storage_dir, "generated")
        os.makedirs(output_dir, exist_ok=True)
        
        filepath = os.path.join(output_dir, filename)
        sf.write(filepath, full_audio, 24000)
        
        return filepath

    def get_audio_url(self, filepath: str) -> str:
        return f"/storage/generated/{os.path.basename(filepath)}"