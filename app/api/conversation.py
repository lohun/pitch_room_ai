from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.schemas import Speaker, User
from app.services.stt_service import STTService
from app.services.tts_service import TTSService
from app.services.llm_service import LLMService
from datetime import datetime
import tempfile
import os
import uuid

router = APIRouter(prefix="/conversation", tags=["conversation"])

VALID_STATES = ["IDLE", "PROCESSING"]

stt_service = STTService()
tts_service = TTSService()
llm_service = LLMService()


@router.post("/respond")
async def respond(
    session_id: str,
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    db = get_db()

    session = await db.sessions.find_one({"_id": session_id, "user_id": current_user.id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")

    current_state = session.get("state", "IDLE")
    if current_state == "PROCESSING":
        raise HTTPException(status_code=409, detail="Session is busy processing. Please wait.")

    await db.sessions.update_one(
        {"_id": session_id},
        {"$set": {"state": "PROCESSING", "last_updated": datetime.utcnow()}}
    )

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_audio:
            content = await audio.read()
            tmp_audio.write(content)
            tmp_audio_path = tmp_audio.name

        try:
            import numpy as np
            import soundfile as sf
            audio_data, samplerate = sf.read(tmp_audio_path)
            if samplerate != 16000:
                raise ValueError(f"Expected 16kHz audio, got {samplerate}Hz")
            text = stt_service.transcribe(audio_data)
        finally:
            if os.path.exists(tmp_audio_path):
                os.remove(tmp_audio_path)

        if not text or not text.strip():
            await db.sessions.update_one(
                {"_id": session_id},
                {"$set": {"state": "IDLE", "last_updated": datetime.utcnow()}}
            )
            return {
                "transcription": "",
                "response_text": "I didn't catch that. Could you please try again?",
                "audio_url": "",
                "evaluation": {}
            }

        await db.transcripts.insert_one({
            "session_id": session_id,
            "speaker": Speaker.USER,
            "text": text,
            "timestamp": datetime.utcnow()
        })

        history = await db.transcripts.find({"session_id": session_id}).sort("timestamp", 1).to_list(20)
        mode = session.get("mode", "skeptical")
        
        response_data = await llm_service.generate_response(history, mode)
        pia_response = response_data.get("response_text", "") + " " + response_data.get("next_question", "")

        await db.transcripts.insert_one({
            "session_id": session_id,
            "speaker": Speaker.PIA,
            "text": pia_response,
            "timestamp": datetime.utcnow()
        })

        if "evaluation_update" in response_data:
            await db.evaluations.update_one(
                {"session_id": session_id},
                {"$set": {"scores": response_data["evaluation_update"]}, "$push": {"history": response_data["evaluation_update"]}}
            )

        audio_filepath = tts_service.synthesize(pia_response, session_id)
        audio_url = tts_service.get_audio_url(audio_filepath)

        await db.sessions.update_one(
            {"_id": session_id},
            {"$set": {"state": "IDLE", "last_updated": datetime.utcnow()}}
        )

        return {
            "transcription": text,
            "response_text": pia_response,
            "audio_url": audio_url,
            "evaluation": response_data.get("evaluation_update", {})
        }

    except Exception as e:
        await db.sessions.update_one(
            {"_id": session_id},
            {"$set": {"state": "IDLE", "last_updated": datetime.utcnow()}}
        )
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/state/{session_id}")
async def get_session_state(session_id: str, current_user: User = Depends(get_current_user)):
    db = get_db()
    session = await db.sessions.find_one({"_id": session_id, "user_id": current_user.id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
    return {"session_id": session_id, "state": session.get("state", "IDLE")}