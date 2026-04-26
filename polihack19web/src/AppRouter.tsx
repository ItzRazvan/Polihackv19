import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { authService, AppUser } from './services/authService';
import { AuthForm } from './components/AuthForm';
import { HomePage } from './pages/HomePage';
import { PricingPage } from './pages/PricingPage';
import { MapPage } from './pages/MapPage';
import { Dashboard } from './pages/Dashboard';
import { DocsPage } from './pages/DocsPage';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import { DemoPage } from './pages/DemoPage';

const PENDING_PLAN_STORAGE_KEY = 'pendingSubscriptionPlan';

function AppContent() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = async () => {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      navigate('/');
      return;
    }

    const pendingPlan = sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY);
    if (pendingPlan) {
      try {
        await authService.updateSubscription(currentUser.uid, pendingPlan);
      } catch (error) {
        console.error('Error applying pending plan after auth:', error);
      }
      sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
      setUser({ ...currentUser, subscription: pendingPlan });
      navigate('/dashboard');
      return;
    }

    setUser(currentUser);

    const state = location.state as { from?: string } | null;
    navigate(state?.from || '/');
  };

  const handlePlanActivated = (planId: string) => {
    setUser((current) => (current ? { ...current, subscription: planId } : current));
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage user={user} />} />
      <Route path="/pricing" element={<PricingPage user={user} onPlanActivated={handlePlanActivated} />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/sensor-demo" element={<DemoPage />} />

      {/* Auth routes */}
      <Route
        path="/auth"
        element={
          user ? <Navigate to="/" replace /> : <AuthForm onSuccess={handleAuthSuccess} />
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
