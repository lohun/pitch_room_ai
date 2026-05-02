from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from app.models.schemas import SessionCreate, SessionBase, SessionMode, User
from app.api.auth import get_current_user
from app.core.database import get_db
from datetime import datetime
import uuid
import io
from pypdf import PdfReader
from app.agents.rag_manager import RAGManager

router = APIRouter(prefix="/session", tags=["sessions"])

@router.post("/start")
async def start_session(session_data: SessionCreate, current_user: User = Depends(get_current_user)):
    db = get_db()
    session_id = str(uuid.uuid4())
    session_dict = session_data.dict()
    session_dict["_id"] = session_id
    session_dict["user_id"] = current_user.id  # Ensure session belongs to current user
    
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
async def upload_deck(session_id: str, file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    db = get_db()
    
    # Verify ownership
    session = await db.sessions.find_one({"_id": session_id, "user_id": current_user.id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
    
    # 1. Read PDF and extract text
    content = await file.read()
    pdf = PdfReader(io.BytesIO(content))
    text = ""
    for page in pdf.pages:
        text += page.extract_text()
        
    # 2. Add to RAG Manager
    rag_manager = RAGManager(session_id)
    # Simple chunking by paragraph
    chunks = [p.strip() for p in text.split("\n\n") if p.strip()]
    metadatas = [{"session_id": session_id, "source": file.filename}] * len(chunks)
    await rag_manager.add_document_chunks(chunks, metadatas)
    
    # 3. Generate 10 Questions
    questions = await rag_manager.generate_questions(text)
    
    # 4. Save to DB
    await db.sessions.update_one(
        {"_id": session_id},
        {"$set": {"pitch_deck_text": text[:5000], "pitch_questions": questions}}
    )
    
    return {
        "filename": file.filename, 
        "status": "processed", 
        "session_id": session_id,
        "questions_generated": len(questions)
    }

@router.post("/{session_id}/end")
async def end_session(session_id: str, current_user: User = Depends(get_current_user)):
    db = get_db()
    session = await db.sessions.find_one({"_id": session_id, "user_id": current_user.id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
    
    # Here we would trigger final report generation via Gemini
    return {"session_id": session_id, "status": "ended", "message": "Final report generation triggered"}

@router.get("/")
async def get_all_sessions(current_user: User = Depends(get_current_user)):
    db = get_db()
    sessions = await db.sessions.find({"user_id": current_user.id}).to_list(1000)
    
    def clean_doc(doc):
        if not doc: return None
        doc["id"] = str(doc.pop("_id"))
        return doc
        
    cleaned_sessions = [clean_doc(s) for s in sessions]
    return {
        "total_calls": len(cleaned_sessions),
        "sessions": cleaned_sessions
    }

@router.get("/{session_id}")
async def get_session(session_id: str, current_user: User = Depends(get_current_user)):
    db = get_db()
    session = await db.sessions.find_one({"_id": session_id, "user_id": current_user.id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or access denied")
    
    evaluation = await db.evaluations.find_one({"session_id": session_id})
    transcripts = await db.transcripts.find({"session_id": session_id}).sort("timestamp", 1).to_list(1000)
    
    # Helper to clean MongoDB documents for serialization
    def clean_doc(doc):
        if not doc: return None
        doc["id"] = str(doc.pop("_id"))
        return doc

    return {
        "session": clean_doc(session),
        "evaluation": clean_doc(evaluation),
        "transcripts": [clean_doc(t) for t in transcripts]
    }
