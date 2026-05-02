import os
from google import genai
from google.genai import types
from typing import List, Dict, Optional
import json
from dotenv import load_dotenv

load_dotenv()

from app.agents.orchestrator import Orchestrator

class LLMService:
    def __init__(self):
        pass

    async def generate_response(self, transcript_history: List[Dict], mode: str) -> Dict:
        """
        Generates a response from PIA based on conversation history and session mode.
        Now uses the multi-agent Orchestrator.
        """
        if not transcript_history:
            return {
                "response_text": "Welcome to the Pitch Room. I'm PIA. Tell me about your business.",
                "next_question": "What problem are you solving?",
                "evaluation_update": {},
                "confidence": 1.0
            }
            
        session_id = transcript_history[0]["session_id"]
        user_message = transcript_history[-1]["text"] if transcript_history[-1]["speaker"] == "user" else ""
        
        orchestrator = Orchestrator(session_id, mode)
        response_data = await orchestrator.process_user_input(user_message)
        
        return response_data

    async def summarize_session(self, session_id: str) -> str:
        """Triggers session summarization via ContextManager."""
        from app.agents.context_manager import ContextManager
        cm = ContextManager(session_id)
        return await cm.get_summary()
