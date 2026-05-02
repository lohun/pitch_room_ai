import os
import json
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types

class BaseAgent(ABC):
    def __init__(self, name: str, role_description: str):
        self.name = name
        self.role_description = role_description
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    @abstractmethod
    async def run(self, user_message: str, history: List[Dict], summary: str, rag_context: str) -> Dict[str, Any]:
        pass

    def _format_history(self, history: List[Dict]) -> str:
        return "\n".join([f"{h['speaker']}: {h['text']}" for h in history])

class InvestorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Investor",
            role_description="You are a sharp but fair venture capitalist. Focus on financial signals, business model, and overall ROI."
        )

    async def run(self, user_message: str, history: List[Dict], summary: str, rag_context: str) -> Dict[str, Any]:
        history_text = self._format_history(history)
        
        system_prompt = f"""
        {self.role_description}
        
        Session Summary: {summary}
        Relevant Document Context: {rag_context}
        
        Your job:
        - Challenge the founder on their last point.
        - Ask an intelligent follow-up question.
        - Evaluate the business based on this specific turn.
        
        Return your response in STRICT JSON format:
        {{
            "agent": "{self.name}",
            "questions": ["Your next follow-up question"],
            "challenges": ["Specific challenge or doubt you have"],
            "feedback": "Your direct commentary to the founder",
            "evaluation_update": {{
                "problem_clarity": 0-10,
                "value_proposition": 0-10,
                "market_size": 0-10,
                "competitors": 0-10,
                "monetization": 0-10,
                "go_to_market": 0-10,
                "defensibility": 0-10,
                "founder_credibility": 0-10
            }},
            "confidence": 0.0-1.0
        }}
        """
        
        prompt = f"Conversation History:\n{history_text}\n\nUser: {user_message}\n\n{self.name} Response:"
        
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt),
            contents=prompt)
        
        try:
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:-3].strip()
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:-3].strip()
                
            return json.loads(cleaned_text)
        except Exception as e:
            print(f"Error parsing {self.name} Agent response: {e}")
            return {
                "agent": self.name,
                "questions": ["Can you elaborate on your business model?"],
                "challenges": ["Unclear monetization strategy"],
                "feedback": "I'm interested, but I need to understand how you plan to make money.",
                "evaluation_update": {},
                "confidence": 0.5
            }

class TechAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Tech",
            role_description="You are a CTO-level technical evaluator. Focus on infrastructure, scalability, technical feasibility, and security."
        )

    async def run(self, user_message: str, history: List[Dict], summary: str, rag_context: str) -> Dict[str, Any]:
        history_text = self._format_history(history)
        system_prompt = f"{self.role_description}\n\nSummary: {summary}\nContext: {rag_context}\n\nReturn JSON."
        prompt = f"History:\n{history_text}\nUser: {user_message}\nTech Response:"
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(system_instruction=system_prompt),
            contents=prompt)
        try:
            return json.loads(response.text.strip().replace("```json", "").replace("```", ""))
        except:
            return {"agent": self.name, "feedback": "Your tech stack sounds interesting.", "questions": ["What's your plan for scaling?"], "confidence": 0.5}

class MarketAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Market",
            role_description="You are a market analyst. Focus on market size, competition, and industry trends."
        )

    async def run(self, user_message: str, history: List[Dict], summary: str, rag_context: str) -> Dict[str, Any]:
        history_text = self._format_history(history)
        system_prompt = f"{self.role_description}\n\nSummary: {summary}\nContext: {rag_context}\n\nReturn JSON."
        prompt = f"History:\n{history_text}\nUser: {user_message}\nMarket Response:"
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(system_instruction=system_prompt),
            contents=prompt)
        try:
            return json.loads(response.text.strip().replace("```json", "").replace("```", ""))
        except:
            return {"agent": self.name, "feedback": "The market is competitive.", "questions": ["Who is your primary competitor?"], "confidence": 0.5}

class ComplianceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Compliance",
            role_description="You are a legal and regulatory expert. Focus on privacy, financial regulations, and liability."
        )

    async def run(self, user_message: str, history: List[Dict], summary: str, rag_context: str) -> Dict[str, Any]:
        history_text = self._format_history(history)
        system_prompt = f"{self.role_description}\n\nSummary: {summary}\nContext: {rag_context}\n\nReturn JSON."
        prompt = f"History:\n{history_text}\nUser: {user_message}\nCompliance Response:"
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(system_instruction=system_prompt),
            contents=prompt)
        try:
            return json.loads(response.text.strip().replace("```json", "").replace("```", ""))
        except:
            return {"agent": self.name, "feedback": "Regulations are key.", "questions": ["Are you GDPR compliant?"], "confidence": 0.5}

class PartnershipAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Partnership",
            role_description="You are a business development specialist. Focus on strategic partners and go-to-market strategy."
        )

    async def run(self, user_message: str, history: List[Dict], summary: str, rag_context: str) -> Dict[str, Any]:
        history_text = self._format_history(history)
        system_prompt = f"{self.role_description}\n\nSummary: {summary}\nContext: {rag_context}\n\nReturn JSON."
        prompt = f"History:\n{history_text}\nUser: {user_message}\nPartnership Response:"
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(system_instruction=system_prompt),
            contents=prompt)
        try:
            return json.loads(response.text.strip().replace("```json", "").replace("```", ""))
        except:
            return {"agent": self.name, "feedback": "Partnerships are valuable.", "questions": ["Do you have any active partnerships?"], "confidence": 0.5}
