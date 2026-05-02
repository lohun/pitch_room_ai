from typing import List, Dict, Optional
from datetime import datetime
from app.core.database import get_db
import os
from google import genai
from google.genai import types

class ContextManager:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.db = get_db()
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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
        
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        
        summary = response.text.strip()
        await self.update_summary(summary)
        return summary

    def filter_context_for_agent(self, history: List[Dict], agent_name: str) -> List[Dict]:
        """
        Filters history to provide only relevant context for a specific agent.
        Uses keyword-based relevance for now.
        """
        relevance_map = {
            "Tech": ["infra", "stack", "code", "dev", "scale", "cloud", "security", "tech", "ai", "ml"],
            "Market": ["tam", "sam", "som", "competitor", "market", "industry", "customer", "growth"],
            "Investor": ["roi", "finance", "funding", "round", "valuation", "exit", "revenue", "business model"],
            "Compliance": ["legal", "gdpr", "hipaa", "regulation", "law", "privacy", "liability"],
            "Partnership": ["gtm", "partner", "ecosystem", "sales", "channel", "distribution"]
        }
        
        keywords = relevance_map.get(agent_name, [])
        if not keywords:
            return history[-10:] # Fallback to last 10 messages
            
        filtered_history = []
        for h in history:
            # Always include user messages and very recent history
            if h['speaker'] == 'user' or history.index(h) > len(history) - 5:
                filtered_history.append(h)
            else:
                # Check for relevance
                text = h['text'].lower()
                if any(kw in text for kw in keywords):
                    filtered_history.append(h)
                    
        return filtered_history[-15:] # Limit to last 15 relevant messages
