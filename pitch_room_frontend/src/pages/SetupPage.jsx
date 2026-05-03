import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, Upload, Mic, ChevronRight, Check } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const SetupPage = () => {
  const navigate = useNavigate();
  const [startupName, setStartupName] = useState('');
  const [persona, setPersona] = useState('vc');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [micAccess, setMicAccess] = useState(false);

  const handleMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) {
        setMicAccess(true);
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      console.error("Microphone access denied", err);
      setMicAccess(false);
      alert("Microphone permission denied. Please allow microphone access to continue.");
    }
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      // 1. Start Session
      const startRes = await fetch(`${API_BASE}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: "demo_user",
          mode: persona,
          idea: startupName // Using startup name as the initial "idea" for now
        })
      });
      const sessionData = await startRes.json();
      const sessionId = sessionData.session_id;

      // 2. Upload Deck if file exists
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`${API_BASE}/session/${sessionId}/deck`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      }

      navigate(`/simulation/${sessionId}`);
    } catch (e) {
      console.error("Setup failed:", e);
      setIsUploading(false);
    }
  };

  return (
    <div className="setup-page container" style={{ maxWidth: '600px', paddingTop: '5rem' }}>
      <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
            <Rocket className="text-accent" size={28} />
            <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>PitchRoom AI</h2>
          </Link>
        </div>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', textAlign: 'center' }}>Set the Stage.</h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3rem' }}>
          Configure your simulation environment for maximum impact.
        </p>

        <div className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              What is your startup's name?
            </label>
            <input
              type="text"
              className="glass"
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                background: 'rgba(255,255,255,0.02)'
              }}
              placeholder="e.g. GloboTech"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
              Choose your Investor Persona
            </label>
            <select
              className="glass"
              style={{
                width: '100%',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                color: 'rgba(255,255,255,0.02)',
                outline: 'none',
                background: 'rgba(255,255,255,0.02)',
                appearance: 'none'
              }}
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
            >
              <option value="elevator">Elevator Pitch (Quick & Sharp)</option>
              <option value="vc" selected>Skeptical VC (Hard Challenges)</option>
              <option value="deep">Deep Tech Specialist (Highly Technical)</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1.5rem' }}>
              Upload Pitch Deck (PDF)
            </label>
            <div
              className="glass"
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <Upload className="text-accent" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>{file ? file.name : "Click to upload deck"}</p>
              <input
                type="file"
                id="fileInput"
                hidden
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: micAccess ? 'var(--success)' : 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
              <Mic size={20} color={micAccess ? 'black' : 'var(--text-secondary)'} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.95rem' }}>Microphone Access</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>We only use audio to generate feedback.</p>
            </div>
            <button
              className={`btn ${micAccess ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              onClick={handleMicAccess}
            >
              {micAccess ? 'Enabled' : 'Enable'}
            </button>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '1.25rem', marginTop: '2rem' }}
            disabled={!startupName || isUploading || !micAccess}
            onClick={handleSubmit}
          >
            {isUploading ? "Initializing Simulation..." : "Enter Pitch Room"} <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupPage;
