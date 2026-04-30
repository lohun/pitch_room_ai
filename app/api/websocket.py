from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.vad_service import VADService
from app.services.stt_service import STTService
from app.services.llm_service import LLMService
from app.core.database import get_db
from app.models.schemas import Speaker
import numpy as np
import asyncio
import json
from datetime import datetime

router = APIRouter()

# Initialize services (singleton-like for this module)
vad_service = VADService()
stt_service = STTService()
llm_service = LLMService()

@router.websocket("/ws/audio/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    db = get_db()
    
    # Verify session
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        await websocket.close(code=4004)
        return

    audio_buffer = []
    is_speaking = False
    silence_counter = 0
    SILENCE_THRESHOLD_MS = 1000  # Based on agents.md
    CHUNK_DURATION_MS = 20  # Assuming 20ms chunks from frontend
    MAX_SILENCE_CHUNKS = SILENCE_THRESHOLD_MS // CHUNK_DURATION_MS

    try:
        while True:
            # Receive binary audio chunk (16kHz float32)
            data = await websocket.receive_bytes()
            chunk = np.frombuffer(data, dtype=np.float32)
            
            # VAD check
            if vad_service.is_speech(chunk):
                if not is_speaking:
                    print("User started speaking")
                    is_speaking = True
                silence_counter = 0
                audio_buffer.append(chunk)
            else:
                if is_speaking:
                    silence_counter += 1
                    audio_buffer.append(chunk)
                    
                    if silence_counter >= MAX_SILENCE_CHUNKS:
                        print("User finished speaking")
                        is_speaking = False
                        
                        # Process full utterance
                        full_audio = np.concatenate(audio_buffer)
                        audio_buffer = []
                        
                        # 1. STT
                        transcript = stt_service.transcribe(full_audio)
                        if not transcript:
                            continue
                            
                        await websocket.send_json({"type": "transcript", "speaker": "user", "text": transcript})
                        
                        # Save to DB
                        await db.transcripts.insert_one({
                            "session_id": session_id,
                            "speaker": Speaker.USER,
                            "text": transcript,
                            "timestamp": datetime.utcnow()
                        })
                        
                        # 2. LLM (Gemini)
                        # Fetch history for context
                        history = await db.transcripts.find({"session_id": session_id}).sort("timestamp", 1).to_list(20)
                        
                        response_data = await llm_service.generate_response(history, session["mode"])
                        pia_response = response_data["response_text"] + " " + response_data["next_question"]
                        
                        # Save PIA response to DB
                        await db.transcripts.insert_one({
                            "session_id": session_id,
                            "speaker": Speaker.PIA,
                            "text": pia_response,
                            "timestamp": datetime.utcnow()
                        })
                        
                        # Update Evaluation Rubric
                        if "evaluation_update" in response_data:
                            await db.evaluations.update_one(
                                {"session_id": session_id},
                                {"$set": {"scores": response_data["evaluation_update"]}, "$push": {"history": response_data["evaluation_update"]}}
                            )
                        
                        await websocket.send_json({"type": "transcript", "speaker": "pia", "text": pia_response, "evaluation": response_data.get("evaluation_update")})
                        
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"Error in websocket loop: {e}")
        await websocket.close()
