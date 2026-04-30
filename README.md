# PIA — Pitch Intelligence Agent

PIA is a **structured, adversarial conversational AI** designed to evaluate business ideas like a venture capitalist. Unlike generic chatbots, PIA uses a real-time voice pipeline to challenge founders, ask deep follow-up questions, and provide a live evaluation rubric.

## 🚀 System Architecture

- **Frontend**: React (Vite) with a premium Call UI, real-time waveform, and live intelligence dashboard.
- **Backend**: FastAPI orchestrator.
- **Pipeline**:
  - **VAD**: Silero VAD (Voice Activity Detection) for tight turn-taking.
  - **STT**: Faster-Whisper for high-accuracy local transcription.
  - **LLM**: Google Gemini 1.5 Flash for adversarial reasoning and structured evaluation.
  - **TTS**: ElevenLabs for high-fidelity, premium voice synthesis.
- **Database**: MongoDB for session history and evaluation tracking.

---

## 🛠️ Getting Started

### 1. Prerequisites

- Python 3.10+
- Node.js (v24+ recommended)
- MongoDB running locally (default: `mongodb://localhost:27017`)
- A Google Gemini API Key

### 2. Backend Setup

1. **Navigate to the root directory**:
   ```bash
   cd pitch_room_ai
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**:
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Run the server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### 3. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd pitch_room_frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:3000`.

---

## 🎧 Usage

1. Open `http://localhost:3000` in your browser.
2. Enter your business idea and select an aggression mode (Elevator, VC, or Deep).
3. Click **Launch Session** and allow microphone access.
4. Speak your pitch. PIA will listen, respond, and update your evaluation scores in real-time.
5. End the session to view your final **Pitch Intelligence Report**.

---

## 🏗️ Project Structure

```text
pitch_room_ai/
├── app/
│   ├── api/          # REST & WebSocket endpoints
│   ├── core/         # Database & Config
│   ├── models/       # Pydantic schemas
│   ├── resources/    # Speaker embeddings & local assets
│   └── services/     # AI Pipeline (STT, TTS, VAD, LLM)
├── pitch_room_frontend/
│   ├── src/
│   │   ├── components/ # UI Blocks (Waveform, etc.)
│   │   ├── hooks/      # useAudioStream (WS + Audio Logic)
│   │   └── styles/     # Premium CSS Design
│   └── index.html
└── requirements.txt
```
