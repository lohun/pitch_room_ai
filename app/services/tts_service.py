import torch
from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech, SpeechT5HifiGan
from datasets import load_dataset
import numpy as np
import io
import soundfile as sf

class TTSService:
    def __init__(self):
        self.processor = SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
        self.model = SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts")
        self.vocoder = SpeechT5HifiGan.from_pretrained("microsoft/speecht5_hifigan")
        
        # Load speaker embeddings (xvectors)
        self.embeddings_dataset = load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")
        # We'll use a specific speaker for PIA
        self.speaker_embeddings = torch.tensor(self.embeddings_dataset[7306]["xvector"]).unsqueeze(0)

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
