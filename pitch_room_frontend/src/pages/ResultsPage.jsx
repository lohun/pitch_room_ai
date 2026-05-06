import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, BarChart3, TrendingUp, AlertCircle, RefreshCcw, Save, Rocket } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const ResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE}/session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length * 10)
    : 0;



  const session = data.session || {};
  const summary = session.summary || "Your pitch successfully communicated the core value proposition, but needs refinement in delivery.";
  const detailedReport = session.detailed_report || {};

  return (
    <div className="results-page container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
            <Rocket className="text-accent" size={28} />
            <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>PitchRoom AI</h2>
          </Link>
        </div>
      </header>
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

        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Session Summary</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto', fontSize: '1.2rem', lineHeight: '1.6' }}>
          {summary}
        </p>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Scores section */}
          <section className="glass" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Evaluation Metrics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Object.entries(scores).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 'bold' }}>{Math.round(value * 10)}%</span>
                  </div>
                  <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value * 10}%` }}
                      style={{ height: '100%', background: 'var(--primary)' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Breakdown section */}
          <section className="glass" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)' }}>Detailed Breakdown</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.7' }}>
              {detailedReport.breakdown || "Comprehensive analysis of your pitch performance across all categories."}
            </p>
          </section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Failures Section */}
          <section className="glass" style={{ padding: '2rem', border: '1px solid #EF4444' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '1px' }}>Failure Points</h3>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {detailedReport.failures?.map((f, i) => (
                <li key={i}>{f}</li>
              )) || <li>No major failures identified.</li>}
            </ul>
          </section>

          {/* Improvements Section */}
          <section className="glass" style={{ padding: '2rem', border: '1px solid #10B981' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#10B981', textTransform: 'uppercase', letterSpacing: '1px' }}>How to Improve</h3>
            <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {detailedReport.improvements?.map((imp, i) => (
                <li key={i}>{imp}</li>
              )) || <li>Continue practicing your delivery and market data.</li>}
            </ul>
          </section>
        </div>

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
