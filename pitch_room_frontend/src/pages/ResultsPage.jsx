import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, BarChart3, TrendingUp, AlertCircle, RefreshCcw, Save } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const ResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/session/${sessionId}`);
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (e) {
        console.error("Failed to fetch results:", e);
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  if (loading) return <div className="container" style={{ paddingTop: '10rem', textAlign: 'center' }}><h2>Analyzing Session...</h2></div>;
  if (!data) return <div className="container" style={{ paddingTop: '10rem', textAlign: 'center' }}><h2>Error loading report.</h2></div>;

  const scores = data.evaluation?.scores || {};
  const avgScore = Object.values(scores).length > 0 
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length * 100)
    : 0;

  return (
    <div className="results-page container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{ 
          width: '200px', 
          height: '200px', 
          borderRadius: '50%', 
          border: '15px solid var(--bg-dark)',
          boxShadow: '0 0 0 5px var(--border)',
          margin: '0 auto 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'var(--bg-dark)'
        }}>
          <svg style={{ position: 'absolute', width: '220px', height: '220px', transform: 'rotate(-90deg)' }}>
            <circle 
              cx="110" cy="110" r="100" 
              fill="transparent" 
              stroke="var(--primary)" 
              strokeWidth="10" 
              strokeDasharray="628" 
              strokeDashoffset={628 - (628 * avgScore / 100)}
              strokeLinecap="round"
            />
          </svg>
          <h1 style={{ fontSize: '4rem', lineHeight: '1' }}>{avgScore}%</h1>
          <p style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', color: 'var(--text-secondary)' }}>READINESS</p>
        </div>

        <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Aha! Moment</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem' }}>
          Your pitch successfully communicated the core value proposition, but needs refinement in delivery.
        </p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto' }}>
        <section className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Object.entries(scores).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <span style={{ width: '150px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</span>
                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    style={{ height: '100%', background: 'var(--primary)' }}
                  />
                </div>
                <span style={{ width: '40px', textAlign: 'right', fontWeight: 'bold' }}>{Math.round(value * 100)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(242, 153, 74, 0.05)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle color="black" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '1px' }}>Critical Insight</h3>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                Your unit economics look optimistic, but your TAM calculation needs more data. The persona specifically flagged the CAC/LTV ratio as "aggressive."
              </p>
            </div>
          </div>
        </section>

        <section className="glass" style={{ padding: '2rem', marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <TrendingUp className="text-accent" />
              <div>
                <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>vs previous session</p>
                <h4 style={{ fontSize: '1.2rem' }}>+12% Improvement</h4>
              </div>
            </div>
            {/* Mock Chart Area */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px' }}>
              {[20, 35, 25, 45, 60, 40, 70, 85].map((h, i) => (
                <div key={i} style={{ width: '6px', height: `${h}%`, background: 'var(--primary)', borderRadius: '2px', opacity: 0.3 + (i * 0.1) }}></div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button className="btn btn-primary" style={{ padding: '1.5rem' }}>
            <Save size={20} /> Save Session
          </button>
          <button className="btn btn-secondary" style={{ padding: '1.5rem' }} onClick={() => navigate('/setup')}>
            <RefreshCcw size={20} /> Try Again with Different Persona
          </button>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
