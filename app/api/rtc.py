import gradio as gr
from fastapi import APIRouter, Request, HTTPException
from fastrtc import (
    Stream, 
    ReplyOnPause, 
    AdditionalOutputs, 
    get_stt_model,
    get_tts_model,
    SileroVadOptions,
    AlgoOptions
)
from app.services.llm_service import LLMService
from app.core.database import get_db
from app.models.schemas import Speaker
import numpy as np
import json
from datetime import datetime

router = APIRouter()

# Initialize services
stt_model = get_stt_model(model="moonshine/base")
tts_model = get_tts_model(model="kokoro")
llm_service = LLMService()

# Map to store session_id for each webrtc_id
webrtc_to_session = {}
sessions_ids = []

async def handle_pitch_audio(audio: tuple[int, np.ndarray]):
    """
    New Voice Agent handler. 
    Handles: STT -> LLM -> TTS Streaming + Transcripts
    """
    webrtc_id = sessions_ids[len(sessions_ids) - 1]
    if not webrtc_id or webrtc_id not in webrtc_to_session:
        print(f"Warning: No session found for webrtc_id {webrtc_id}")
        return

    session_id = webrtc_to_session[webrtc_id]
    db = get_db()
    
    # 1. Transcribe using FastRTC's get_stt_model
    transcript = stt_model.stt(audio)
    if not transcript or not transcript.strip():
        return

    print(f"User: {transcript}")

    # Yield User Transcript to Frontend
    yield AdditionalOutputs(json.dumps({
        "type": "transcript", 
        "speaker": "user", 
        "text": transcript
    }))
    
    # Save User message to DB
    await db.transcripts.insert_one({
        "session_id": session_id,
        "speaker": Speaker.USER,
        "text": transcript,
        "timestamp": datetime.utcnow()
    })

    # 2. Generate LLM Response
    session = await db.sessions.find_one({"_id": session_id})
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

    # 3. Stream AI Transcript + Evaluation
    yield AdditionalOutputs(json.dumps({
        "type": "transcript", 
        "speaker": "pia", 
        "text": pia_response, 
        "evaluation": response_data.get("evaluation_update")
    }))

    # 4. Stream Audio Response to Frontend via WebRTC
    # Use async stream_tts since this handler runs inside an async event loop
    async for chunk in tts_model.stream_tts(pia_response):
        yield chunk

# Initialize FastRTC Stream with modern config
stream = Stream(
    handler=ReplyOnPause(
        handle_pitch_audio, 
        algo_options=AlgoOptions(
            audio_chunk_duration=0.6,
            started_talking_threshold=0.2,
            speech_threshold=0.1
        ), 
        model_options=SileroVadOptions(
            threshold=0.5,
            min_speech_duration_ms=250,
            min_silence_duration_ms=100
        )
    ),
    modality="audio",
    mode="send-receive",
    concurrency_limit=10,
    additional_inputs=[gr.Textbox(label="Webrtc Id")]
)

@router.post("/{session_id}/offer")
async def rtc_offer(session_id: str, request: Request):
    db = get_db()
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    body = await request.json()
    webrtc_id = body.get("webrtc_id")
    if webrtc_id:
        webrtc_to_session[webrtc_id] = session_id
        sessions_ids.append(webrtc_id)
        print(f"Mapped webrtc_id {webrtc_id} to session {session_id}")
    
    resp = await stream.handle_offer(body, set_outputs=stream.set_additional_outputs(body['webrtc_id']) )
    return resp

