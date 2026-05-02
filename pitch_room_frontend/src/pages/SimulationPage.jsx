import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, RotateCcw, AlertCircle, BarChart3 } from 'lucide-react';
import Waveform from '../components/Waveform';
import { useAudioStream } from '../hooks/useAudioStream';

const SimulationPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const {
    isRecording,
    isPiaSpeaking,
    transcripts,
    evaluation,
    status,
    startStream,
    endStream
  } = useAudioStream(sessionId);

  const [timer, setTimer] = useState(300); // 5 minutes

  useEffect(() => {
    startStream();
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      endStream();
      clearInterval(interval);
    };
  }, [startStream, endStream]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnd = () => {
    endStream();
    navigate(`/results/${sessionId}`);
  };

  // Get the latest PIA question/comment
  const latestPia = [...transcripts].reverse().find(t => t.speaker === 'pia');

  return (
    <div className="simulation-page container" style={{ paddingTop: '2rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: 'bold' }}>ACTIVE SIMULATION</p>
        <h2 style={{ fontSize: '2.5rem' }}>Pitching to: Skeptical VC</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }}></div>
          <span>{formatTime(timer)} Recording...</span>
        </div>
      </header>

      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', overflow: 'hidden', paddingBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* AI Avatar / Visualizer Area */}
          <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '30px', 
              background: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: isPiaSpeaking ? '0 0 40px rgba(242, 153, 74, 0.4)' : 'none',
              transition: 'all 0.3s ease',
              marginBottom: '2rem'
            }}>
              <Mic size={48} color="black" />
            </div>
            
            <Waveform isActive={isRecording || isPiaSpeaking} />
          </div>

          {/* Transcript Feed */}
          <div className="glass" style={{ height: '200px', padding: '1.5rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', opacity: 0.5 }}>
              <BarChart3 size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Live Transcript</span>
            </div>
            <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {transcripts.length > 0 ? (
                transcripts.map((t, i) => (
                  <span key={i} style={{ color: t.speaker === 'pia' ? 'var(--primary)' : 'inherit' }}>
                    {t.speaker === 'pia' ? "Pia: " : "You: "}{t.text}{" "}
                  </span>
                ))
              ) : (
                <span style={{ opacity: 0.5 }}>Speak to begin your pitch...</span>
              )}
            </div>
          </div>

          {/* AI Interruption Alert */}
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

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <button className="btn btn-secondary" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
              <RotateCcw />
            </button>
            <button className="btn" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EF4444' }} onClick={handleEnd}>
              <PhoneOff size={32} />
            </button>
            <button className="btn btn-secondary" style={{ width: '64px', height: '64px', borderRadius: '50%' }}>
              <RotateCcw style={{ transform: 'scaleX(-1)' }} />
            </button>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <aside className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 className="text-accent" />
            <h3 style={{ fontSize: '1.2rem' }}>Live Intelligence</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {evaluation ? (
              Object.entries(evaluation.scores || evaluation).map(([key, value]) => (
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
                Waiting for interaction to generate analysis...
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
      `}</style>
    </div>
  );
};

export default SimulationPage;
