import { useNavigate } from 'react-router-dom';
import { AppUser } from '../services/authService';
import logo from '../assets/logo.svg';

interface HomePageProps {
  user: AppUser | null;
}

export function HomePage({ user }: HomePageProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Navigation */}
      <nav style={{
        padding: '1rem 2rem',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          {/* Logo dimensions increased here */}
          <img src={logo} alt="Atmosense Logo" style={{ height: '64px', width: '64px' }} />
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: '700' }}>
            ATMOSENSE
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/map')}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(51, 65, 85, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.3)';
            }}
          >
            Demo Map
          </button>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(51, 65, 85, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.3)';
            }}
          >
            Pricing
          </button>
          <button
            onClick={() => navigate('/docs')}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(51, 65, 85, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#e2e8f0';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.3)';
            }}
          >
            Docs
          </button>
          {!user ? (
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '600',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
            >
              Sign In
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
              >
                Dashboard
              </button>
              <button
                onClick={async () => {
                  const { authService } = await import('../services/authService');
                  await authService.logout();
                }}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(51, 65, 85, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.3)';
                }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        padding: '6rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: '3.5rem',
          margin: '0 0 1rem',
          color: '#e2e8f0',
          fontWeight: '700',
          lineHeight: '1.1',
        }}>
          Precise Weather <span style={{ color: '#3b82f6' }}>API</span> at Scale
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#94a3b8',
          margin: '0 0 2rem',
          lineHeight: '1.6',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Access real-time and forecasted weather data with precise location information. Built for developers and businesses.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '0.75rem 2rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/map')}
            style={{
              padding: '0.75rem 2rem',
              background: 'transparent',
              color: '#e2e8f0',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(51, 65, 85, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.8)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)';
            }}
          >
            View Demo
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        padding: '4rem 2rem',
        background: 'rgba(30, 41, 59, 0.5)',
        borderTop: '1px solid rgba(51, 65, 85, 0.2)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2rem',
            textAlign: 'center',
            color: '#e2e8f0',
            margin: '0 0 3rem',
            fontWeight: '600',
          }}>
            Why Choose ATMOSENSE
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
          }}>
            {[
              { title: 'Precise Data', desc: 'Accurate location-based weather information' },
              { title: 'High Performance', desc: 'Sub-second response times with 99.9% uptime' },
              { title: 'Easy Integration', desc: 'RESTful API with comprehensive documentation' },
              { title: 'Scalable', desc: 'Handle millions of requests effortlessly' },
              { title: '24/7 Support', desc: 'Dedicated support team ready to help' },
              { title: 'Developer Friendly', desc: 'SDKs for popular programming languages' },
            ].map((feature) => (
              <div key={feature.title} style={{
                background: '#1e293b',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid rgba(51, 65, 85, 0.2)',
              }}>
                <h3 style={{
                  margin: '0 0 1rem',
                  color: '#e2e8f0',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  margin: 0,
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        padding: '4rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: '2rem',
          color: '#e2e8f0',
          margin: '0 0 1rem',
          fontWeight: '600',
        }}>
          Ready to Get Started?
        </h2>
        <p style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          margin: '0 0 2rem',
        }}>
          Join thousands of developers using ATMOSENSE
        </p>
        <button
          onClick={() => navigate('/pricing')}
          style={{
            padding: '0.75rem 2.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
        >
          View Pricing Plans
        </button>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '2rem',
        background: 'rgba(15, 23, 42, 0.8)',
        borderTop: '1px solid rgba(51, 65, 85, 0.2)',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '0.9rem',
      }}>
        <p style={{ margin: 0 }}>© 2026 ATMOSENSE. All rights reserved.</p>
      </footer>
    </div>
  );
}