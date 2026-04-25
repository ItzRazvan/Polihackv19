  import { useNavigate } from 'react-router-dom';
import { authService, AppUser } from '../services/authService';

const PENDING_PLAN_STORAGE_KEY = 'pendingSubscriptionPlan';

const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Trojan Horse Partner',
    price: '$0',
    period: '/month',
    description: 'Free local dashboard access in exchange for embedding our SDK.',
    features: [
      'Real-time Local Dashboard',
      '15-min early storm warnings',
      'Surge-pricing alerts',
      'Requires active SDK integration',
    ],
    buttonText: 'Contact to Partner',
    requiresContact: true,
  },
  {
    id: 'pro',
    name: 'Regional Fleet SaaS',
    price: '$199',
    period: '/month',
    description: 'For dispatchers who want alerts without providing data.',
    features: [
      'Access to 1 City/Region',
      'Real-time Push Notifications',
      'Web Dashboard Access',
      'Standard Support',
    ],
    buttonText: 'Get Plan',
    requiresContact: false,
  },
  {
    id: 'business',
    name: 'Commercial API',
    price: '$999',
    period: '/month',
    description: 'For regional logistics and drone operators.',
    features: [
      'Up to 5 Metro Areas',
      'Sub-5 minute latency',
      '5,000,000 API requests/month',
      'Priority Support',
    ],
    buttonText: 'Get Plan',
    requiresContact: false,
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Global Syndicate',
    price: 'Custom',
    period: 'Contact us',
    description: 'For parametric insurance & smart cities.',
    features: [
      'Full Global Mesh Network',
      'Sub-minute latency',
      'Raw Barometric Firehose',
      '99.99% Custom SLA',
    ],
    buttonText: 'Contact Sales',
    requiresContact: true,
  },
];

interface PricingPageProps {
  user: AppUser | null;
  onPlanActivated: (planId: string) => void;
}

export function PricingPage({ user, onPlanActivated }: PricingPageProps) {
  const navigate = useNavigate();

  const handleActionClick = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (plan.requiresContact) {
      window.location.href = 'mailto:support@atmosense.com?subject=ATMOSENSE%20Plan%20Inquiry';
      return;
    }

    if (!user) {
      sessionStorage.setItem(PENDING_PLAN_STORAGE_KEY, plan.id);
      navigate('/auth', { state: { from: '/pricing' } });
      return;
    }

    // Standard checkout flow for paid tiers
    try {
      await authService.updateSubscription(user.uid, plan.id);
      onPlanActivated(plan.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Error updating subscription. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '3rem 1rem',
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
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
          Back
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            margin: '0 0 1rem',
            color: '#e2e8f0',
            fontWeight: '700',
          }}>
            Pricing Built for Scale
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#94a3b8',
            margin: 0,
          }}>
            From local delivery fleets to global data syndicates.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlighted ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#1e293b',
                border: plan.highlighted ? 'none' : '1px solid rgba(51, 65, 85, 0.3)',
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: plan.highlighted ? '0 10px 40px rgba(59, 130, 246, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
              }}
              onMouseOver={(e) => !plan.highlighted && (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseOut={(e) => !plan.highlighted && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {plan.highlighted && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#10b981',
                  color: 'white',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                }}>
                  MOST POPULAR
                </div>
              )}

              <h3 style={{
                fontSize: '1.5rem',
                margin: '0 0 0.5rem',
                color: plan.highlighted ? 'white' : '#e2e8f0',
                fontWeight: '600',
              }}>
                {plan.name}
              </h3>

              <p style={{
                margin: '0 0 1.5rem',
                color: plan.highlighted ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8',
                fontSize: '0.95rem',
                minHeight: '40px', // Keeps cards aligned
              }}>
                {plan.description}
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: plan.highlighted ? 'white' : '#e2e8f0',
                }}>
                  {plan.price}
                </span>
                <span style={{
                  fontSize: '0.9rem',
                  color: plan.highlighted ? 'rgba(255, 255, 255, 0.8)' : '#94a3b8',
                  marginLeft: '0.5rem',
                }}>
                  {plan.period}
                </span>
              </div>

              <button
                onClick={() => handleActionClick(plan)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  background: plan.highlighted ? 'white' : '#3b82f6',
                  color: plan.highlighted ? '#3b82f6' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  marginBottom: '1.5rem',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => {
                  if (plan.highlighted) {
                    e.currentTarget.style.background = '#f3f4f6';
                  } else {
                    e.currentTarget.style.background = '#2563eb';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = plan.highlighted ? 'white' : '#3b82f6';
                }}
              >
                {!user ? `Sign in to ${plan.buttonText}` : plan.buttonText}
              </button>

              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: plan.highlighted ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8',
                  margin: '0 0 1rem',
                  letterSpacing: '0.05em',
                }}>
                  Included
                </h4>
                <ul style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{
                      color: plan.highlighted ? 'rgba(255, 255, 255, 0.9)' : '#cbd5e1',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        width: '1.2rem',
                        height: '1.2rem',
                        flexShrink: 0,
                        background: plan.highlighted ? 'rgba(255, 255, 255, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                        borderRadius: '50%',
                        marginRight: '0.75rem',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                      }}>
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}