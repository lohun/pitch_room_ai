from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import sessions, websocket, auth, rtc
from app.api.rtc import stream
from app.core.database import connect_to_mongo, close_mongo_connection
import uvicorn

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
app.include_router(websocket.router)
app.include_router(rtc.router, prefix="/rtc")
# stream.mount(app)

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
