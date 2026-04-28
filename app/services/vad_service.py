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
        self.buffer = np.array([], dtype=np.float32)

    def is_speech(self, audio_chunk: np.ndarray, threshold: float = 0.5) -> bool:
        """
        Detects if a given audio chunk contains speech.
        Handles arbitrary chunk sizes by buffering and processing in 512-sample blocks.
        """
        # Append to buffer
        self.buffer = np.concatenate([self.buffer, audio_chunk])
        
        # We need blocks of 512 for 16kHz
        WINDOW_SIZE = 512
        
        any_speech = False
        
        # Process all available 512-sample blocks
        while len(self.buffer) >= WINDOW_SIZE:
            # Extract 512 samples
            current_window = self.buffer[:WINDOW_SIZE]
            self.buffer = self.buffer[WINDOW_SIZE:]
            
            # Convert to torch tensor
            tensor_chunk = torch.from_numpy(current_window.copy()).float()
            
            # Get speech probability
            speech_prob = self.model(tensor_chunk, self.sampling_rate).item()
            if speech_prob > threshold:
                any_speech = True
                
        return any_speech

    def reset(self):
        self.vad_iterator.reset_states()
        self.buffer = np.array([], dtype=np.float32)

    async def process_stream(self, audio_chunk: bytes):
        """
        Placeholder for stateful stream processing if needed.
        Currently, we'll use simple thresholding in the websocket orchestrator.
        """
        pass
