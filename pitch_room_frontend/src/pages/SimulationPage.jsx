import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, RotateCcw, AlertCircle, BarChart3, Pause, Rocket } from 'lucide-react';
import Waveform from '../components/Waveform';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const SimulationPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const {
    isRecording,
    isProcessing,
    transcripts,
    evaluation,
    status,
    toggleRecording,
    sendAudioToBackend,
    playAudio,
    cleanup
  } = useAudioRecorder(sessionId);

  const [isEnding, setIsEnding] = useState(false);
  const [timer, setTimer] = useState(300);
  const [isPiaSpeaking, setIsPiaSpeaking] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [cleanup]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecording = useCallback(async () => {
    if (status === 'processing') return;

    const audioBlob = await toggleRecording();

    if (audioBlob) {
      const response = await sendAudioToBackend(audioBlob);

      if (response && response.audio_url) {
        setIsPiaSpeaking(true);
        const audio = new Audio(`http://localhost:8000${response.audio_url}`);
        audio.onended = () => setIsPiaSpeaking(false);
        audio.play();
      }
    }
  }, [toggleRecording, sendAudioToBackend, status]);

  const handleEnd = async () => {
    setIsEnding(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/session/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to end session');

      cleanup();
      navigate(`/results/${sessionId}`);
    } catch (err) {
      console.error('Error ending session:', err);
      cleanup();
      navigate(`/results/${sessionId}`);
    } finally {
      setIsEnding(false);
    }
  };

  const handlePause = () => {
    cleanup();
    navigate('/setup');
  };

  const latestPia = [...transcripts].reverse().find(t => t.speaker === 'pia');

  return (
    <div className="simulation-page container" style={{ paddingTop: '2rem', height: '100vh', display: 'flex', flexDirection: 'column', overflowX: "hidden" }}>
      {isEnding && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="loader" style={{
            width: '64px',
            height: '64px',
            border: '4px solid var(--primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1.5rem'
          }}></div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Analyzing Your Pitch</h2>
          <p style={{ color: 'var(--text-secondary)' }}>PIA is synthesizing your final report...</p>
        </div>
      )}

      <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
            <Rocket className="text-accent" size={28} />
            <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>PitchRoom AI</h2>
          </Link>
        </div>
      </header>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: 'bold' }}>ACTIVE SIMULATION</p>
        <h2 style={{ fontSize: '2.5rem' }}>Pitching to: Skeptical VC</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }}></div>
          <span>{formatTime(timer)} Recording...</span>
        </div>
      </header>

      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', overflowX: 'hidden', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{
              width: '80%',
              margin: 'auto',
              height: '120px',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: isPiaSpeaking ? '0 0 40px rgba(242, 153, 74, 0.4)' : 'none',
              transition: 'all 0.3s ease',
              marginBottom: '2rem'
            }}>
              <button
                className="btn btn-secondary"
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F59E0B', color: 'white', border: 'none' }}
                onClick={handlePause}
                title="Pause & Return to Setup"
              >
                <Pause size={32} />
              </button>

              <button
                className="btn"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: isRecording ? '#EF4444' : '#22C55E',
                  color: 'white',
                  border: 'none',
                  cursor: status === 'processing' ? 'not-allowed' : 'pointer',
                  opacity: status === 'processing' ? 0.6 : 1
                }}
                onClick={handleToggleRecording}
                disabled={status === 'processing'}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {status === 'processing' ? (
                  <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                ) : isRecording ? (
                  <MicOff size={32} />
                ) : (
                  <Mic size={32} />
                )}
              </button>

              <button
                className="btn"
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EF4444', color: 'white', border: 'none' }}
                onClick={handleEnd}
                title="End Call & View Results"
              >
                <PhoneOff size={32} />
              </button>
            </div>

            <Waveform isActive={isRecording || isPiaSpeaking} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          </div>

          <AnimatePresence>
            {isPiaSpeaking && latestPia && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="glass"
                style={{
                  border: '2px solid var(--primary)',
                  padding: '1.5rem',
                  background: 'rgba(242, 153, 74, 0.05)',
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Pia" style={{ width: '32px' }} alt="Pia" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--primary)' }}>AI Investor Interrupts</span>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(242, 153, 74, 0.2)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>URGENT</span>
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>"{latestPia.text}"</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 className="text-accent" />
            <h3 style={{ fontSize: '1.2rem' }}>Live Intelligence</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {evaluation ? (
              Object.entries(evaluation).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 'bold' }}>{Math.round(value * 100)}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value * 100}%` }}
                      style={{ height: '100%', background: 'var(--primary)' }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
                Press the mic button and speak to begin your pitch...
              </p>
            )}
          </div>
        </aside>
      </main>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimulationPage;