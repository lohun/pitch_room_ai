import React, { useState, useEffect } from 'react';
import { useAudioStream } from './hooks/useAudioStream';
import Waveform from './components/Waveform';
import { Mic, MicOff, PhoneOff, Rocket, BarChart3, MessageSquare, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

function App() {
  const [view, setView] = useState('landing'); // landing, call, report
  const [pitchData, setPitchData] = useState({ idea: '', mode: 'vc' });
  const [sessionId, setSessionId] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  const {
    isRecording,
    isPiaSpeaking,
    transcripts,
    evaluation,
    status,
    startStream,
    endStream
  } = useAudioStream(sessionId);

  const handleStartSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: pitchData.idea,
          mode: pitchData.mode,
          user_id: "demo_user"
        })
      });
      const data = await response.json();
      setSessionId(data.session_id);
      setView('call');
    } catch (e) {
      console.error("Failed to start session:", e);
    }
  };

  useEffect(() => {
    if (sessionId && view === 'call') {
      startStream();
    }
  }, [sessionId, view, startStream]);

  const handleEndCall = async () => {
    endStream();
    try {
      await fetch(`${API_BASE}/session/${sessionId}/end`, { method: 'POST' });
      // Fetch final report data
      const response = await fetch(`${API_BASE}/session/${sessionId}`);
      const data = await response.json();
      setSessionInfo(data);
      setView('report');
    } catch (e) {
      console.error("Failed to end session:", e);
      setView('report'); // Still move to report view
    }
  };

  return (
    <div className="app-container">
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="landing-view"
          >
            <header className="hero">
              <div className="logo">
                <Rocket size={32} color="var(--primary-color)" />
                <h1>PIA</h1>
              </div>
              <p className="subtitle">Pitch Room Intelligence Agent</p>
              <h2>The adversarial VC agent that <span className="highlight">perfects</span> your pitch.</h2>
            </header>

            <div className="input-card glass">
              <label>Your Business Idea</label>
              <textarea
                placeholder="Briefly explain what you're building..."
                value={pitchData.idea}
                onChange={(e) => setPitchData({ ...pitchData, idea: e.target.value })}
              />

              <div className="mode-selector">
                <label>Pia's Aggression Mode</label>
                <div className="modes">
                  {['elevator', 'vc', 'deep'].map(m => (
                    <button
                      key={m}
                      className={pitchData.mode === m ? 'active' : ''}
                      onClick={() => setPitchData({ ...pitchData, mode: m })}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="start-btn"
                disabled={!pitchData.idea}
                onClick={handleStartSession}
              >
                Launch Session <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {view === 'call' && (
          <motion.div
            key="call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="call-view"
          >
            <div className="call-layout">
              <div className="main-feed">
                <div className="pia-status">
                  <div className={`pia-avatar ${isPiaSpeaking ? 'pulse' : ''}`}>
                    <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Pia" alt="Pia" />
                  </div>
                  <h3>
                    {isPiaSpeaking ? 'Pia is Speaking' : (status === 'active' ? 'Pia is Listening' : 'Connecting...')}
                  </h3>
                  <Waveform isActive={isRecording || isPiaSpeaking} />
                </div>

                <div className="transcript-container">
                  {transcripts.map((t, i) => (
                    <div key={i} className={`message ${t.speaker}`}>
                      <div className="speaker-label">{t.speaker === 'pia' ? 'PIA' : 'YOU'}</div>
                      <div className="text">{t.text}</div>
                    </div>
                  ))}
                  {transcripts.length === 0 && (
                    <div className="placeholder-text">Waiting for conversation to start...</div>
                  )}
                </div>

                <div className="controls glass">
                  <button className="control-btn mic">
                    {isRecording ? <Mic /> : <MicOff color="var(--error-color)" />}
                  </button>
                  <button className="control-btn end" onClick={handleEndCall}>
                    <PhoneOff />
                  </button>
                </div>
              </div>

              <aside className="stats-panel glass">
                <div className="panel-header">
                  <BarChart3 size={20} />
                  <h3>Live Intelligence</h3>
                </div>

                <div className="scores-list">
                  {evaluation ? (
                    Object.entries(evaluation.scores || evaluation).map(([key, value]) => (
                      <div key={key} className="score-item">
                        <div className="score-info">
                          <span>{key.replace('_', ' ')}</span>
                          <span>{Math.round(value * 100)}%</span>
                        </div>
                        <div className="score-bar">
                          <motion.div
                            className="bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${value * 100}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="waiting">Waiting for data...</p>
                  )}
                </div>
              </aside>
            </div>
          </motion.div>
        )}

        {view === 'report' && (
          <motion.div
            key="report"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="report-view"
          >
            <div className="report-card glass">
              <h1>Pitch Intelligence Report</h1>
              <p>Session ID: {sessionId}</p>

              <div className="final-verdict">
                <h3>Final Scores</h3>
                <div className="grid">
                  {sessionInfo?.evaluation?.scores && Object.entries(sessionInfo.evaluation.scores).map(([key, val]) => (
                    <div key={key} className="stat-card">
                      <div className="label">{key.replace('_', ' ')}</div>
                      <div className="value">{Math.round(val * 100)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="restart-btn" onClick={() => setView('landing')}>
                New Pitch Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .app-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
        }

        .landing-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
          padding-top: 4rem;
        }

        .hero {
          text-align: center;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .logo h1 {
          font-size: 3rem;
          letter-spacing: -2px;
          font-weight: 700;
        }

        .subtitle {
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 4px;
          font-size: 0.8rem;
          margin-bottom: 1rem;
        }

        .hero h2 {
          font-size: 2.5rem;
          max-width: 600px;
          line-height: 1.2;
        }

        .highlight {
          color: var(--primary-color);
        }

        .input-card {
          width: 100%;
          max-width: 600px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        label {
          color: var(--text-secondary);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        textarea {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--surface-border);
          border-radius: 12px;
          padding: 1rem;
          color: white;
          font-family: inherit;
          font-size: 1rem;
          resize: none;
          height: 120px;
          outline: none;
          transition: border-color 0.3s;
        }

        textarea:focus {
          border-color: var(--primary-color);
        }

        .modes {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .modes button {
          flex: 1;
          padding: 0.75rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.75rem;
        }

        .modes button.active {
          background: var(--primary-color);
          color: black;
        }

        .start-btn {
          margin-top: 1rem;
          background: var(--text-primary);
          color: black;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .start-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Call View */
        .call-view {
          height: 80vh;
        }

        .call-layout {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
          height: 100%;
        }

        .main-feed {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .pia-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .pia-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--secondary-color);
          padding: 10px;
          border: 2px solid var(--primary-color);
        }

        .pia-avatar.pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(0, 242, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0); }
        }

        .transcript-container {
          flex: 1;
          background: rgba(0,0,0,0.2);
          border-radius: 20px;
          padding: 2rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .message {
          max-width: 80%;
        }

        .message.pia { align-self: flex-start; }
        .message.user { align-self: flex-end; text-align: right; }

        .speaker-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .message.pia .text {
          background: var(--surface-color);
          padding: 1rem;
          border-radius: 0 16px 16px 16px;
          border-left: 3px solid var(--secondary-color);
        }

        .message.user .text {
          background: var(--primary-color);
          color: black;
          padding: 1rem;
          border-radius: 16px 16px 0 16px;
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          padding: 1rem;
        }

        .control-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
        }

        .control-btn.end {
          background: var(--error-color);
        }

        /* Stats Panel */
        .stats-panel {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid var(--surface-border);
          padding-bottom: 1rem;
        }

        .scores-list {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .score-item {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .score-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .score-bar {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--secondary-color), var(--primary-color));
        }

        /* Report View */
        .report-view {
          display: flex;
          justify-content: center;
          padding-top: 2rem;
        }

        .report-card {
          width: 100%;
          max-width: 800px;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-card {
          background: rgba(255,255,255,0.03);
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
        }

        .stat-card .label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .stat-card .value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .restart-btn {
          background: var(--text-primary);
          color: black;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 700;
          margin-top: 2rem;
        }
      `}</style>
    </div>
  );
}

export default App;
