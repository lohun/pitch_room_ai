import os
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Any
from google import genai

class RAGManager:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
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
        genai_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        prompt = f"""
        Analyze the following pitch deck content and generate 10 critical, investor-grade questions.
        Focus on gaps in logic, market assumptions, and financial viability.
        
        Content:
        {document_text[:4000]} # Limit to first 4k chars for now
        
        Return as a simple JSON list of strings.
        """
        
        response = await genai_client.aio.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        
        # Simple cleanup
        text = response.text.strip().replace("```json", "").replace("```", "")
        import json
        try:
            return json.loads(text)
        except:
            return ["What is your target market?", "How do you plan to monetize?"]
