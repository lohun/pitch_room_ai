from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import SessionCreate, SessionBase, SessionMode
from app.core.database import get_db
from datetime import datetime
import uuid

router = APIRouter(prefix="/session", tags=["sessions"])

@router.post("/start")
async def start_session(session_data: SessionCreate):
    db = get_db()
    session_id = str(uuid.uuid4())
    session_dict = session_data.dict()
    session_dict["_id"] = session_id
    
    await db.sessions.insert_one(session_dict)
    
    # Initialize evaluation
    await db.evaluations.insert_one({
        "session_id": session_id,
        "scores": {
            "problem_clarity": 0.0,
            "value_proposition": 0.0,
            "market_size": 0.0,
            "competitors": 0.0,
            "monetization": 0.0,
            "go_to_market": 0.0,
            "defensibility": 0.0,
            "founder_credibility": 0.0
        },
        "history": []
    })
    
    return {"session_id": session_id, "status": "started"}

@router.post("/{session_id}/deck")
async def upload_deck(session_id: str, file: UploadFile = File(...)):
    # Placeholder for deck analysis
    # In a real app, we'd process the PDF and extract text for Gemini
    return {"filename": file.filename, "status": "uploaded", "session_id": session_id}

@router.post("/{session_id}/end")
async def end_session(session_id: str):
    db = get_db()
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Here we would trigger final report generation via Gemini
    return {"session_id": session_id, "status": "ended", "message": "Final report generation triggered"}

@router.get("/{session_id}")
async def get_session(session_id: str):
    db = get_db()
    session = await db.sessions.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    evaluation = await db.evaluations.find_one({"session_id": session_id})
    transcripts = await db.transcripts.find({"session_id": session_id}).to_list(1000)
    
    return {
        "session": session,
        "evaluation": evaluation,
        "transcripts": transcripts
    }
