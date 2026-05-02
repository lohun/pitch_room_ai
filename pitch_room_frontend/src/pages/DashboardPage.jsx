import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, BarChart3, Clock, AlertCircle, CheckCircle2, Rocket } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await fetch(`${API_BASE}/session`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
          setTotalCalls(data.total_calls || 0);
        } else {
          console.error("Failed to fetch sessions");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <div className="dashboard-page container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <header className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 0' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Rocket className="text-accent" size={28} />
          <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>PitchRoom AI</h2>
        </div>
      </header>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <p style={{ textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: 'bold' }}>Dashboard</p>
          <h1 style={{ fontSize: '3rem', margin: 0 }}>Your Pitch History</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '1rem', color: 'var(--text-secondary)' }}>
            <BarChart3 size={20} className="text-accent" />
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{totalCalls} Total Calls</span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/setup')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> New Pitch
        </button>
      </header>

      {isLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
          Loading your history...
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '16px' }}>
          <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No sessions yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Ready to practice your first pitch?</p>
          <button className="btn btn-secondary" onClick={() => navigate('/setup')}>
            Start Simulation
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2rem'
        }}>
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass"
              style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }}
              onClick={() => navigate(`/results/${session.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{session.idea || "Untitled Pitch"}</h3>
                {session.final_report || session.final_report != null ? (
                  <CheckCircle2 size={20} color="var(--success)" title="Completed" />
                ) : (
                  <Clock size={20} color="var(--primary)" title="In Progress" />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Type:</span>
                  <span style={{ textTransform: 'capitalize' }}>{session.mode || "VC"}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>Status:</span>
                  <span style={{ textTransform: 'capitalize', color: session.final_report !== null && session.final_report !== "" ? 'var(--success)' : 'inherit' }}>
                    {session.status || "Unknown"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
