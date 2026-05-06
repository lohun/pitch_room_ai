from typing import List, Dict, Optional
from datetime import datetime
from app.core.database import get_db
import os
from openai import AsyncOpenAI

class ContextManager:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.db = get_db()
        self.llm_client = AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )


    async def get_history(self, limit: int = 20) -> List[Dict]:
        """Fetches the most recent transcript history from MongoDB."""
        cursor = self.db.transcripts.find({"session_id": self.session_id}).sort("timestamp", 1)
        history = await cursor.to_list(limit)
        return history

    async def get_summary(self) -> str:
        """Fetches the current session summary."""
        session = await self.db.sessions.find_one({"_id": self.session_id})
        return session.get("summary", "No summary available.") if session else "No summary available."

    async def update_summary(self, new_summary: str):
        """Updates the session summary in MongoDB."""
        await self.db.sessions.update_one(
            {"_id": self.session_id},
            {"$set": {"summary": new_summary, "last_updated": datetime.utcnow()}}
        )

    async def summarize_history(self, history: List[Dict]) -> str:
        """Condensed the history into a concise summary using an LLM."""
        if not history:
            return "No discussion yet."
            
        history_text = "\n".join([f"{h['speaker']}: {h['text']}" for h in history])
        
        prompt = f"""
        Summarize the following conversation history between a founder and PIA (AI Investor). 
        Focus on key business points, identified risks, and the current state of the evaluation.
        Keep it under 200 words.
        
        History:
        {history_text}
        
        Summary:
        """
        
        try:
            response = await self.llm_client.chat.completions.create(
                model='llama-3.1-8b-instant',
                messages=[{'role': 'system', 'content': prompt}],
                temperature=0.2
            )
            summary = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error summarizing history: {e}")
            summary = "Summary generation failed."
            
        await self.update_summary(summary)
        return summary

    def get_recent_context(self, history: List[Dict], limit: int = 15) -> List[Dict]:
        """
        Returns the most recent messages for context.
        """
        return history[-limit:]
