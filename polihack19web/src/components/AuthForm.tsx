import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface AuthFormProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthForm({ onSuccess, initialMode = 'login' }: AuthFormProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await authService.login(email, password);
      } else {
        await authService.signup(email, password, name);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      padding: '1rem',
      position: 'relative',
    }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        type="button"
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'transparent',
          color: '#94a3b8',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: '500',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = '#e2e8f0';
          e.currentTarget.style.background = 'rgba(51, 65, 85, 0.2)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = '#94a3b8';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '1rem',
            height: '1rem',
            lineHeight: 1,
            transform: 'translateY(-0.5px)',
          }}
        >
          {'\u2190'}
        </span>
        Back to Home
      </button>

      <div style={{
        background: '#1e293b',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid rgba(51, 65, 85, 0.3)',
      }}>
        <h1 style={{
          margin: '0 0 0.5rem',
          fontSize: '1.75rem',
          color: '#e2e8f0',
          textAlign: 'center',
        }}>
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p style={{
          margin: '0 0 1.5rem',
          fontSize: '0.9rem',
          color: '#94a3b8',
          textAlign: 'center',
        }}>
          {mode === 'login' ? 'Sign in to access your API' : 'Sign up to get started with our API'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              color: '#fca5a5',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'background 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#3b82f6')}
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{
          margin: '1.5rem 0 0',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.9rem',
        }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              textDecoration: 'underline',
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
