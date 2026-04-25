import { useNavigate } from 'react-router-dom';

export function DocsPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <button
          onClick={() => navigate('/')}
          type="button"
          style={{
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
            marginBottom: '1.25rem',
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
          <span aria-hidden="true">{'\u2190'}</span>
          Back
        </button>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#e2e8f0',
          margin: '0 0 1rem',
          fontWeight: '700',
        }}>
          API Documentation
        </h1>
        
        <div style={{
          background: '#1e293b',
          padding: '3rem',
          borderRadius: '12px',
          border: '1px solid rgba(51, 65, 85, 0.2)',
          textAlign: 'center',
          marginTop: '2rem',
        }}>
          <p style={{
            fontSize: '1.2rem',
            color: '#94a3b8',
            margin: '0 0 1.5rem',
          }}>
            📚 Documentation coming soon!
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#64748b',
            margin: 0,
            lineHeight: '1.6',
          }}>
            We're building comprehensive API documentation including:<br />
            • Getting started guide<br />
            • API reference and endpoints<br />
            • Code examples (Node.js, Python, JavaScript)<br />
            • Webhook documentation<br />
            • Rate limiting and best practices<br />
            <br />
            Check back soon or contact support@atmosense.com for early access.
          </p>
        </div>
      </div>
    </div>
  );
}
