from elevenlabs.client import ElevenLabs
import os
import io

class TTSService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            print("WARNING: ELEVENLABS_API_KEY not found in environment variables.")
        
        self.client = ElevenLabs(api_key=self.api_key)
        self.voice_id = "JBFqnCBsd6RMkjVDRZzb"
        self.model_id = "eleven_multilingual_v2"

    def generate_speech(self, text: str) -> bytes:
        """
        Generates speech audio from text using ElevenLabs.
        Returns audio bytes (MP3 format).
        """
        if not self.api_key:
            return b""

        # Call ElevenLabs API
        audio_generator = self.client.text_to_speech.convert(
            text=text,
            voice_id=self.voice_id,
            model_id=self.model_id,
            output_format="mp3_44100_128",
        )
        
        # Collect all bytes from the generator
        audio_bytes = b"".join(audio_generator)
        return audio_bytes

    async def stream_speech(self, text: str):
        """
        Wrapper for streaming speech. 
        For now, returns the full audio as bytes.
        """
        return self.generate_speech(text)
