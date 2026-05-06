import asyncio
from typing import List, Dict, Any
from app.agents.context_manager import ContextManager
from app.agents.personality_agents import UnifiedAgent
from app.agents.rag_manager import RAGManager

class Orchestrator:
    def __init__(self, session_id: str, mode: str):
        self.session_id = session_id
        self.mode = mode
        self.context_manager = ContextManager(session_id)
        self.rag_manager = RAGManager(session_id)
        # Initialize single agent
        self.agent = UnifiedAgent()

    async def process_user_input(self, user_message: str) -> Dict[str, Any]:
        """
        The main entry point for processing a user message through the unified agent system.
        """
        # 1. Get Context
        history = await self.context_manager.get_history()
        summary = await self.context_manager.get_summary()
        
        # 2. Get RAG Context
        rag_context = self.rag_manager.query_context(user_message)
        
        # 3. Execute Single Unified Agent
        recent_context = self.context_manager.get_recent_context(history)
        agent_response = await self.agent.run(user_message, recent_context, summary, rag_context)
        
        # 4. Format Output
        if "error" in agent_response:
            return {
                "response_text": agent_response["error"],
                "next_question": "",
                "evaluation_update": {},
                "confidence": 0.0
            }

        questions = agent_response.get("questions", [])
        next_question = questions[0] if questions else "What's next for your startup?"
        
        return {
            "response_text": agent_response.get("feedback", "No feedback provided."),
            "next_question": next_question,
            "evaluation_update": agent_response.get("evaluation_update", {}),
            "confidence": agent_response.get("confidence", 0.5)
        }
