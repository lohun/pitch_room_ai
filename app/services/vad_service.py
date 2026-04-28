import torch
import numpy as np
from typing import Optional

class VADService:
    def __init__(self, sampling_rate: int = 16000):
        self.model, self.utils = torch.hub.load(repo_or_dir='snakers4/silero-vad',
                                              model='silero_vad',
                                              force_reload=False)
        (self.get_speech_timestamps, self.save_audio, self.read_audio, self.VADIterator, self.collect_chunks) = self.utils
        self.sampling_rate = sampling_rate
        self.vad_iterator = self.VADIterator(self.model)

    def is_speech(self, audio_chunk: np.ndarray, threshold: float = 0.5) -> bool:
        """
        Detects if a given audio chunk contains speech.
        Expects a 1D float32 numpy array.
        """
        # Convert numpy to torch tensor
        tensor_chunk = torch.from_numpy(audio_chunk).float()
        
        # Get speech probability
        speech_prob = self.model(tensor_chunk, self.sampling_rate).item()
        return speech_prob > threshold

    def reset(self):
        self.vad_iterator.reset_states()

    async def process_stream(self, audio_chunk: bytes):
        """
        Placeholder for stateful stream processing if needed.
        Currently, we'll use simple thresholding in the websocket orchestrator.
        """
        pass
