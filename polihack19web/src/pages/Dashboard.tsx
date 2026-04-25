import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppUser } from '../services/authService';
import { apiKeysService, APIKey } from '../services/apiKeysService';

interface DashboardProps {
  user: AppUser | null;
  onLogout: () => void;
}

function getDeviceLimit(subscription?: string): number {
  switch (subscription) {
    case 'starter':
      return 1;
    case 'pro':
      return 5;
    case 'business':
      return 25;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'subscription' | 'api-keys'>('subscription');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({ description: '', deviceName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const deviceLimit = getDeviceLimit(user?.subscription);
  const devicesUsed = user?.subscription ? apiKeys.length : user?.devices ?? 0;
  const atDeviceLimit = Number.isFinite(deviceLimit) && devicesUsed >= deviceLimit;

  useEffect(() => {
    if (user?.subscription) {
      loadAPIKeys();
    }
  }, [user, activeTab]);

  const loadAPIKeys = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const keys = await apiKeysService.getAPIKeys(user.uid);
      setApiKeys(keys);
    } catch (err) {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (atDeviceLimit) {
      setError('Device limit reached for your current plan. Upgrade to add more keys.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      const newKey = await apiKeysService.createAPIKey(
        user.uid,
        newKeyForm.description,
        newKeyForm.deviceName
      );
      setApiKeys([...apiKeys, newKey]);
      setNewKeyForm({ description: '', deviceName: '' });
      setShowCreateForm(false);
      setSuccess('API key created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      setError('');
      await apiKeysService.deleteAPIKey(keyId);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      setVisibleKeys((prev) => {
        const next = new Set(prev);
        next.delete(keyId);
        return next;
      });
      setSuccess('API key deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete API key');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const handleCopyKey = async (apiKey: APIKey) => {
    try {
      await navigator.clipboard.writeText(apiKey.key);
      setCopiedKeyId(apiKey.id);
      setSuccess('API key copied to clipboard.');
      setTimeout(() => {
        setCopiedKeyId(null);
        setSuccess('');
      }, 2000);
    } catch {
      setError('Failed to copy API key. Check clipboard permissions.');
    }
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
        padding: '1.5rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.85rem',
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
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
            <span aria-hidden="true">{'\u2190'}</span>
            Back
          </button>
          <div>
            <h1 style={{ margin: '0 0 0.25rem', color: '#e2e8f0', fontSize: '1.5rem' }}>
              Dashboard
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Welcome, {user.name}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ef4444')}
        >
          Logout
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
        }}>
          <button
            onClick={() => setActiveTab('subscription')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'subscription' ? 'transparent' : 'transparent',
              color: activeTab === 'subscription' ? '#3b82f6' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'subscription' ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              if (activeTab !== 'subscription') e.currentTarget.style.color = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'subscription') e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Subscription
          </button>
          {user.subscription && (
            <button
              onClick={() => setActiveTab('api-keys')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: activeTab === 'api-keys' ? '#3b82f6' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === 'api-keys' ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (activeTab !== 'api-keys') e.currentTarget.style.color = '#cbd5e1';
              }}
              onMouseOut={(e) => {
                if (activeTab !== 'api-keys') e.currentTarget.style.color = '#94a3b8';
              }}
            >
              API Keys
            </button>
          )}
        </div>

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div style={{
            background: '#1e293b',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(51, 65, 85, 0.2)',
          }}>
            <h2 style={{ margin: '0 0 1.5rem', color: '#e2e8f0', fontSize: '1.5rem' }}>
              Subscription Status
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}>
              <div style={{
                background: 'rgba(51, 65, 85, 0.3)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(51, 65, 85, 0.5)',
              }}>
                <p style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  Current Plan
                </p>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: '600' }}>
                  {user.subscription ? user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1) : 'No Plan'}
                </p>
              </div>

              <div style={{
                background: 'rgba(51, 65, 85, 0.3)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(51, 65, 85, 0.5)',
              }}>
                <p style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  Devices
                </p>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: '600' }}>
                  {devicesUsed} / {Number.isFinite(deviceLimit) ? deviceLimit : '∞'}
                </p>
              </div>

              <div style={{
                background: 'rgba(51, 65, 85, 0.3)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid rgba(51, 65, 85, 0.5)',
              }}>
                <p style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  Member Since
                </p>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem', fontWeight: '600' }}>
                  {user.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            {!user.subscription ? (
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
              >
                Browse Pricing Plans
              </button>
            ) : (
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Upgrade Plan
              </button>
            )}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && user.subscription && (
          <div>
            {success && (
              <div style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                borderRadius: '6px',
                color: '#86efac',
                marginBottom: '1.5rem',
              }}>
                {success}
              </div>
            )}

            {error && (
              <div style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fca5a5',
                marginBottom: '1.5rem',
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}>
              <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '1.5rem' }}>
                API Keys
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={atDeviceLimit && !showCreateForm}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: atDeviceLimit && !showCreateForm ? '#64748b' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: atDeviceLimit && !showCreateForm ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!(atDeviceLimit && !showCreateForm)) {
                    e.currentTarget.style.background = '#2563eb';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = atDeviceLimit && !showCreateForm ? '#64748b' : '#3b82f6';
                }}
              >
                {showCreateForm ? 'Cancel' : 'Create New Key'}
              </button>
            </div>

            {atDeviceLimit && (
              <div style={{
                padding: '0.9rem 1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                color: '#fcd34d',
                marginBottom: '1rem',
              }}>
                You reached your device limit ({devicesUsed}/{deviceLimit}). Delete a key or upgrade your plan.
              </div>
            )}

            {showCreateForm && (
              <form
                onSubmit={handleCreateKey}
                style={{
                  background: '#1e293b',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(51, 65, 85, 0.2)',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={newKeyForm.description}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, description: e.target.value })}
                      placeholder="e.g., Production API"
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#e2e8f0',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Device Name
                    </label>
                    <input
                      type="text"
                      value={newKeyForm.deviceName}
                      onChange={(e) => setNewKeyForm({ ...newKeyForm, deviceName: e.target.value })}
                      placeholder="e.g., Server #1"
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#e2e8f0',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#059669')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#10b981')}
                  >
                    Create Key
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <p style={{ color: '#94a3b8' }}>Loading API keys...</p>
            ) : apiKeys.length === 0 ? (
              <div style={{
                background: '#1e293b',
                padding: '2rem',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#94a3b8',
                border: '1px solid rgba(51, 65, 85, 0.2)',
              }}>
                No API keys yet. Create one to get started.
              </div>
            ) : (
              <div style={{
                background: '#1e293b',
                borderRadius: '8px',
                border: '1px solid rgba(51, 65, 85, 0.2)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 220px',
                  gap: 0,
                  padding: '1rem',
                  background: 'rgba(51, 65, 85, 0.2)',
                  borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
                  fontWeight: '600',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                }}>
                  <div>API Key</div>
                  <div>Device</div>
                  <div>Description</div>
                  <div>Created</div>
                  <div>Actions</div>
                </div>
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr 220px',
                      gap: 0,
                      padding: '1rem',
                      borderBottom: '1px solid rgba(51, 65, 85, 0.2)',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{
                      color: '#cbd5e1',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      filter: visibleKeys.has(key.id) ? 'none' : 'blur(4px)',
                      transition: 'filter 0.2s',
                    }}>
                      {key.key}
                    </div>
                    <div style={{ color: '#cbd5e1' }}>{key.deviceName}</div>
                    <div style={{ color: '#cbd5e1' }}>{key.description}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      {key.createdAt.toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-start' }}>
                      <button
                        onClick={() => toggleKeyVisibility(key.id)}
                        style={{
                          padding: '0.4rem 0.7rem',
                          background: '#334155',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        {visibleKeys.has(key.id) ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleCopyKey(key)}
                        style={{
                          padding: '0.4rem 0.7rem',
                          background: copiedKeyId === key.id ? '#10b981' : '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        {copiedKeyId === key.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        style={{
                          padding: '0.4rem 0.7rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
