import torch
from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech, SpeechT5HifiGan
import numpy as np
import io
import soundfile as sf
import os

class TTSService:
    def __init__(self):
        self.processor = SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
        self.model = SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts")
        self.vocoder = SpeechT5HifiGan.from_pretrained("microsoft/speecht5_hifigan")
        
        # Load speaker embeddings (xvectors) from local file
        embedding_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "resources", "speaker_embeddings.pt")
        if os.path.exists(embedding_path):
            self.speaker_embeddings = torch.load(embedding_path, weights_only=True)
        else:
            # Fallback or error if the file is missing
            raise FileNotFoundError(f"Speaker embeddings not found at {embedding_path}. Please ensure the file exists.")

    def generate_speech(self, text: str) -> bytes:
        """
        Generates speech audio from text.
        Returns wav bytes.
        """
        inputs = self.processor(text=text, return_tensors="pt")
        
        speech = self.model.generate_speech(
            inputs["input_ids"], 
            self.speaker_embeddings, 
            vocoder=self.vocoder
        )
        
        # Convert to numpy and then to bytes
        audio_data = speech.numpy()
        
        out_buf = io.BytesIO()
        sf.write(out_buf, audio_data, 16000, format='WAV')
        return out_buf.getvalue()

    async def stream_speech(self, text: str):
        """
        Placeholder for real-time streaming if the model supports it.
        For SpeechT5, we usually generate full sentences and stream the buffers.
        """
        return self.generate_speech(text)
