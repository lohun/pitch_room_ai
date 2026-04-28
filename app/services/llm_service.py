import os
from google import genai
from google.genai import types
from typing import List, Dict, Optional
import json
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    async def generate_response(self, transcript_history: List[Dict], mode: str) -> Dict:
        """
        Generates a response from PIA based on conversation history and session mode.
        Returns a dict containing response_text, next_question, and evaluation_update.
        """
        
        system_prompt = f"""
        You are PIA, a sharp but fair venture capitalist. 
        Current Mode: {mode}
        
        Your job:
        - Challenge founders rigorously.
        - Ask intelligent, targeted follow-up questions.
        - Evaluate their business based on their responses.
        
        Rules:
        - Never be generic.
        - Always probe deeper into their last answer.
        - Maintain a structured evaluation rubric.
        
        Return your response in STRICT JSON format:
        {{
            "response_text": "Your direct commentary on their last point.",
            "next_question": "Your follow-up question.",
            "evaluation_update": {{
                "problem_clarity": 0-10 score,
                "value_proposition": 0-10 score,
                "market_size": 0-10 score,
                "competitors": 0-10 score,
                "monetization": 0-10 score,
                "go_to_market": 0-10 score,
                "defensibility": 0-10 score,
                "founder_credibility": 0-10 score
            }},
            "confidence": 0.0-1.0
        }}
        """
        
        # Format history for Gemini
        history_text = "\n".join([f"{h['speaker']}: {h['text']}" for h in transcript_history])
        
        prompt = f"Conversation History:\n{history_text}\n\nPIA Response:"
        
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt),
            contents=prompt)
        
        try:
            # Basic cleanup of markdown code blocks if Gemini includes them
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:-3].strip()
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:-3].strip()
                
            return json.loads(cleaned_text)
        except Exception as e:
            print(f"Error parsing Gemini response: {e}")
            return {
                "response_text": "I see. Let's dig into that further.",
                "next_question": "Can you elaborate on your market entry strategy?",
                "evaluation_update": {},
                "confidence": 0.5
            }

    async def summarize_session(self, transcript_history: List[Dict]) -> str:
        # Placeholder for progressive summarization
        return "A summary of the current discussion..."
