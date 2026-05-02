import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Rocket, Play, ChevronRight, BarChart3, MessageSquare, Shield } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Rocket className="text-accent" size={28} />
          <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>PitchRoom AI</h2>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/login')}>Login</button>
      </header>

      <main className="container" style={{ paddingTop: '5rem', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="pill" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 16px', 
            borderRadius: '100px', 
            background: 'rgba(242, 153, 74, 0.1)', 
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: '600',
            marginBottom: '2rem'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></span>
            AI SIMULATION ACTIVE
          </div>
          
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '1.5rem', maxWidth: '900px', margin: '0 auto 1.5rem' }}>
            Master Your Investor <br />
            Pitch Under <span className="gradient-text">Real Pressure.</span>
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
            An AI-native simulator that interrogates, challenges, and scores your pitch in real-time.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '5rem' }}>
            <button className="btn btn-primary" style={{ padding: '16px 32px' }} onClick={() => navigate('/setup')}>
              Start 5-Minute Practice Session
            </button>
            <button className="btn btn-secondary" style={{ padding: '16px 32px' }}>
              <Play size={18} fill="white" /> Watch Memo
            </button>
          </div>
        </motion.div>

        {/* Mockup Preview Area */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="glass" 
          style={{ 
            maxWidth: '900px', 
            margin: '0 auto 8rem', 
            height: '500px', 
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }}></div>
            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>03:42</span>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 'bold' }}>LIVE ANALYSIS</div>
          </div>

          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div className="glass" style={{ width: '180px', height: '180px', borderRadius: '24px', padding: '4px', border: '2px solid var(--primary)', marginBottom: '1.5rem' }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" style={{ width: '100%', height: '100%', borderRadius: '20px' }} alt="Avatar" />
            </div>
            <h3 style={{ fontSize: '1.5rem' }}>Alex Volkov</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Managing Partner, Volkov Capital</p>
          </div>
        </motion.div>

        {/* Trust Section */}
        <section style={{ marginBottom: '8rem' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            INSTITUTIONAL TRUST
          </p>
          <h2 style={{ fontSize: '2rem', marginBottom: '3rem' }}>
            Built for founders in the <span className="gradient-text">MEST ecosystem</span> to <br />
            accelerate readiness for demo day.
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', opacity: 0.3 }}>
            <div style={{ width: '150px', height: '40px', background: 'white', borderRadius: '4px' }}></div>
            <div style={{ width: '150px', height: '40px', background: 'white', borderRadius: '4px' }}></div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ textAlign: 'left', paddingBottom: '8rem' }}>
          <div className="glass" style={{ padding: '3rem', maxWidth: '600px' }}>
            <Shield className="text-accent" size={40} style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Adversarial AI</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              Don't just pitch; survive. Our agents are trained to find the holes in your logic before investors do.
            </p>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <BarChart3 className="text-accent" size={24} style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.9rem' }}>Sentiment Score</h4>
                <div style={{ width: '100px', height: '4px', background: 'rgba(255,255,255,0.1)', marginTop: '8px' }}>
                  <div style={{ width: '70%', height: '100%', background: 'var(--primary)' }}></div>
                </div>
              </div>
              <div>
                <MessageSquare className="text-accent" size={24} style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.9rem' }}>Live Transcripts</h4>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Review every objection.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="container" style={{ borderTop: '1px solid var(--border)', padding: '4rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ marginBottom: '1rem' }}>PitchRoom AI</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', fontSize: '0.9rem' }}>
            Refine your delivery, handle objections with poise, and close your round with confidence.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
