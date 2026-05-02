import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('http://localhost:8000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      navigate('/setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page container" style={{ maxWidth: '450px', paddingTop: '8rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'white', fontSize: '1.25rem', fontWeight: 'bold' }}>
          PitchRoom AI
        </Link>
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{ padding: '3rem', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome back</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          Access your executive simulation dashboard.
        </p>

        {error && (
          <div style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.9rem', background: 'rgba(255, 107, 107, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.5rem', padding: '1rem' }}>
          <img src="https://www.google.com/favicon.ico" style={{ width: '18px', marginRight: '8px' }} alt="Google" />
          CONTINUE WITH GOOGLE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', opacity: 0.3 }}>
          <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>OR SIGN IN WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'white' }}></div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Work Email</label>
            <input
              type="email"
              className="glass"
              placeholder="executive@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', background: 'transparent' }}
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Password</label>
              <a href="#" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', textDecoration: 'none' }}>FORGOT?</a>
            </div>
            <input
              type="password"
              className="glass"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', background: 'transparent' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1.25rem', marginBottom: '2rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          New to PitchPerfect? <Link to="/register" style={{ color: 'var(--text-primary)', fontWeight: 'bold', textDecoration: 'none' }}>Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
