import os
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Any
from openai import AsyncOpenAI
class RAGManager:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.llm_client = AsyncOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1"
        )
        
        # Use Gemini for embeddings (via chromadb helper or manual)
        # For simplicity, we'll use the DefaultEmbeddingFunction or a custom one if needed
        self.collection = self.client.get_or_create_collection(name=f"session_{session_id}")
        self.admin_collection = self.client.get_or_create_collection(name="admin_knowledge")

    async def add_document_chunks(self, chunks: List[str], metadata: List[Dict]):
        """Adds document chunks to the session-specific collection."""
        ids = [f"chunk_{i}" for i in range(len(chunks))]
        self.collection.add(
            documents=chunks,
            metadatas=metadata,
            ids=ids
        )

    def query_context(self, query: str, n_results: int = 3) -> str:
        """Queries both session and admin stores for relevant context."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        admin_results = self.admin_collection.query(
            query_texts=[query],
            n_results=1
        )
        
        context_parts = []
        if results['documents']:
            context_parts.extend(results['documents'][0])
        if admin_results['documents']:
            context_parts.extend(admin_results['documents'][0])
            
        return "\n\n".join(context_parts)

    async def generate_questions(self, document_text: str) -> List[str]:
        """Generates 10 intelligent questions based on the pitch deck."""
        
        prompt = f"""
        Analyze the following pitch deck content and generate 10 critical, investor-grade questions.
        Focus on gaps in logic, market assumptions, and financial viability.
        
        Content:
        {document_text[:4000]} # Limit to first 4k chars for now
        
        Return your response in JSON format. The JSON should be an object with a "questions" key mapped to a simple list of strings.
        """
        
        try:
            response = await self.llm_client.chat.completions.create(
                model='llama-3.1-8b-instant',
                messages=[{'role': 'system', 'content': prompt}],
                response_format={"type": "json_object"},
                temperature=0.4
            )
            
            text = response.choices[0].message.content.strip()
            import json
            data = json.loads(text)
            return data.get("questions", ["What is your target market?", "How do you plan to monetize?"])
        except Exception as e:
            print(f"Error generating questions: {e}")
            return ["What is your target market?", "How do you plan to monetize?"]
