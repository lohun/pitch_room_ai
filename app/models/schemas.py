from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

class SessionMode(str, Enum):
    ELEVATOR = "elevator"
    VC = "vc"
    DEEP = "deep"

class Speaker(str, Enum):
    USER = "user"
    PIA = "pia"

class EvaluationRubric(BaseModel):
    problem_clarity: float = 0.0
    value_proposition: float = 0.0
    market_size: float = 0.0
    competitors: float = 0.0
    monetization: float = 0.0
    go_to_market: float = 0.0
    defensibility: float = 0.0
    founder_credibility: float = 0.0

class SessionBase(BaseModel):
    user_id: str
    mode: SessionMode
    created_at: datetime = Field(default_factory=datetime.utcnow)
    summary: Optional[str] = None
    final_report: Optional[Dict] = None

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    summary: Optional[str] = None
    final_report: Optional[Dict] = None

class TranscriptEntry(BaseModel):
    session_id: str
    speaker: Speaker
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class EvaluationUpdate(BaseModel):
    session_id: str
    scores: EvaluationRubric
    history: List[Dict] = []
