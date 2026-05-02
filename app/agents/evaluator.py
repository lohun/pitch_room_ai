import os
import json
from google import genai
from google.genai import types
from typing import List, Dict, Any

class Evaluator:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    async def evaluate(self, agent_outputs: List[Dict], summary: str) -> Dict[str, Any]:
        """
        Synthesizes multiple agent outputs into a final structured evaluation.
        """
        outputs_text = json.dumps(agent_outputs, indent=2)
        
        system_prompt = """
        You are the Head of Evaluation for a top-tier VC firm.
        Your job is to look at the feedback from multiple specialized agents (Investor, Tech, Market, etc.) 
        and the session summary to produce a definitive, structured evaluation rubric.
        
        Rules:
        - Be objective.
        - Average the sentiment but highlight critical failures.
        - Return ONLY JSON.
        
        Rubric structure:
        - problem_clarity: 0-10
        - value_proposition: 0-10
        - market_size: 0-10
        - competitors: 0-10
        - monetization: 0-10
        - go_to_market: 0-10
        - defensibility: 0-10
        - founder_credibility: 0-10
        """
        
        prompt = f"""
        Session Summary: {summary}
        
        Agent Outputs:
        {outputs_text}
        
        Final Evaluation:
        """
        
        response = await self.client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            config=types.GenerateContentConfig(system_instruction=system_prompt),
            contents=prompt
        )
        
        try:
            cleaned_text = response.text.strip().replace("```json", "").replace("```", "")
            return json.loads(cleaned_text)
        except:
            # Fallback to basic aggregation if LLM fails
            return self._basic_aggregation(agent_outputs)

    def _basic_aggregation(self, agent_outputs: List[Dict]) -> Dict[str, Any]:
        final_scores = {}
        for res in agent_outputs:
            scores = res.get("evaluation_update", {})
            for key, val in scores.items():
                final_scores[key] = final_scores.get(key, 0) + val
        
        if agent_outputs:
            num_agents = len(agent_outputs)
            for key in final_scores:
                final_scores[key] /= num_agents
        return final_scores
