import asyncio
from typing import List, Dict, Any
from app.agents.context_manager import ContextManager
from app.agents.personality_agents import InvestorAgent, TechAgent, MarketAgent, ComplianceAgent, PartnershipAgent
from app.agents.rag_manager import RAGManager
from app.agents.evaluator import Evaluator

class Orchestrator:
    def __init__(self, session_id: str, mode: str):
        self.session_id = session_id
        self.mode = mode
        self.context_manager = ContextManager(session_id)
        self.rag_manager = RAGManager(session_id)
        self.evaluator = Evaluator()
        # Initialize agents
        self.agents = [
            InvestorAgent(),
            TechAgent(),
            MarketAgent(),
            ComplianceAgent(),
            PartnershipAgent()
        ]

    async def process_user_input(self, user_message: str) -> Dict[str, Any]:
        """
        The main entry point for processing a user message through the multi-agent system.
        """
        # 1. Get Context
        history = await self.context_manager.get_history()
        summary = await self.context_manager.get_summary()
        
        # 2. Detect Intent & Select Agents
        intent = self._detect_intent(user_message)
        active_agents = self._select_agents(intent)
        
        # 3. Get RAG Context
        rag_context = self.rag_manager.query_context(user_message)
        
        # 4. Parallel Execution
        agent_outputs = await asyncio.gather(*[
            agent.run(user_message, self.context_manager.filter_context_for_agent(history, agent.name), summary, rag_context) 
            for agent in active_agents
        ])
        
        # 5. Aggregation & Evaluation
        aggregated_response = await self._aggregate_responses(agent_outputs, summary)
        
        return aggregated_response

    def _detect_intent(self, message: str) -> str:
        """Lightweight intent detection based on keywords."""
        m = message.lower()
        if any(kw in m for kw in ["tech", "stack", "infra", "architecture", "code"]): return "tech"
        if any(kw in m for kw in ["market", "competitor", "tam", "industry"]): return "market"
        if any(kw in m for kw in ["finance", "money", "roi", "valuation", "revenue"]): return "finance"
        if any(kw in m for kw in ["legal", "compliance", "gdpr", "privacy"]): return "compliance"
        return "general"

    def _select_agents(self, intent: str) -> List[Any]:
        """Selects a subset of agents based on the detected intent."""
        if intent == "general":
            return self.agents # All agents
            
        mapping = {
            "tech": ["Tech", "Investor"],
            "market": ["Market", "Investor", "Partnership"],
            "finance": ["Investor", "Market"],
            "compliance": ["Compliance", "Investor"]
        }
        
        selected_names = mapping.get(intent, ["Investor"])
        return [a for a in self.agents if a.name in selected_names]

    async def _aggregate_responses(self, agent_outputs: List[Dict], summary: str) -> Dict[str, Any]:
        """Aggregates multiple agent outputs into a single response structure."""
        if not agent_outputs:
            return {}
        
        # Basic aggregation: combine feedback and pick the first question
        combined_feedback = "\n\n".join([f"**{res['agent']}**: {res['feedback']}" for res in agent_outputs if 'feedback' in res])
        all_questions = []
        for res in agent_outputs:
            all_questions.extend(res.get("questions", []))
            
        # Call Evaluator for structured scores
        final_scores = await self.evaluator.evaluate(agent_outputs, summary)
        
        return {
            "response_text": combined_feedback,
            "next_question": all_questions[0] if all_questions else "What's next for your startup?",
            "evaluation_update": final_scores,
            "confidence": sum([res.get("confidence", 0) for res in agent_outputs]) / len(agent_outputs)
        }
