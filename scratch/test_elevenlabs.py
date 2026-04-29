
import os
from dotenv import load_dotenv
from app.services.tts_service import TTSService

load_dotenv()

def test_elevenlabs():
    tts = TTSService()
    print(f"Testing with Voice ID: {tts.voice_id}")
    try:
        audio = tts.generate_speech("Welcome to the Pitch Room. I am Pia, your adversarial evaluator.")
        if audio and len(audio) > 0:
            print(f"Success! Received {len(audio)} bytes of audio.")
            with open("scratch/test_audio.mp3", "wb") as f:
                f.write(audio)
            print("Audio saved to scratch/test_audio.mp3")
        else:
            print("Failed: Received empty audio bytes.")
    except Exception as e:
        print(f"Error during TTS generation: {e}")

if __name__ == "__main__":
    test_elevenlabs()
