from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import sessions, websocket, auth, rtc, conversation
from app.api.rtc import stream
from app.core.database import connect_to_mongo, close_mongo_connection
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

app = FastAPI(title="PIA — Pitch Intelligence Agent API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(conversation.router)
app.include_router(websocket.router)
app.include_router(rtc.router, prefix="/rtc")
# stream.mount(app)

# Serve generated audio files
storage_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "generated")
os.makedirs(storage_path, exist_ok=True)
app.mount("/storage/generated", StaticFiles(directory=storage_path), name="generated")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "PIA API is running", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
