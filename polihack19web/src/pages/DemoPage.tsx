import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Type definitions based on your API response
interface Aggregations {
  barometer?: { mean: number; trend: number };
  altitude?: { mean: number; trend: number };
  accelerometer?: { mean: number; trend: number };
}

interface ApiResponse {
  userId: string;
  timeRange: { start: number; end: number };
  readingsCount: number;
  aggregations: Aggregations;
}

export function DemoPage() {
  const navigate = useNavigate();
  
  const [data, setData] = useState<Aggregations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const API_URL = 'https://us-central1-polihack19.cloudfunctions.net/sensor_api/api/readings';
  const API_KEY = 'pk_live_he7uu4tv0if3noniryk6qmdc245xwpacp'; 

  const fetchData = useCallback(async () => {
    try {
      // Query the last 60 seconds to get the "latest" batch from the single phone
      const now = Date.now();
      const startTime = now - 60000; 
      
      const response = await fetch(
        `${API_URL}?aggregation=mean,trend`,
        {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.readingsCount > 0) {
        setData(result.aggregations);
        setLastUpdated(new Date());
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [API_URL, API_KEY]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Poll every 10 seconds (SDK batches every 30s, or 5s if raining)
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        {/* Back Button */}
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
            marginBottom: '2rem',
            width: 'fit-content',
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
          ← Back to Home
        </button>

        {/* Header */}
        <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              margin: '0 0 0.5rem',
              color: '#e2e8f0',
              fontWeight: '700',
            }}>
              Live Sensor Data
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '1.1rem' }}>
              Real-time feed from the Atmosense mobile SDK
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: error ? '#ef4444' : loading && !data ? '#f59e0b' : '#10b981',
                boxShadow: error ? '0 0 8px #ef4444' : loading && !data ? 'none' : '0 0 8px #10b981'
              }} />
              <span style={{ color: '#e2e8f0', fontWeight: '500' }}>
                {error ? 'Connection Error' : loading && !data ? 'Connecting...' : 'Receiving Data'}
              </span>
            </div>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        {/* Data Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          
          {/* Barometer Card */}
          <MetricCard 
            title="Atmospheric Pressure" 
            value={data?.barometer?.mean ? `${data.barometer.mean} hPa` : '--'} 
            trend={data?.barometer?.trend}
            trendLabel="hPa/hr"
          />

          {/* Altitude Card */}
          <MetricCard 
            title="Altitude" 
            value={data?.altitude?.mean ? `${data.altitude.mean} m` : '--'} 
            trend={data?.altitude?.trend}
            trendLabel="m/hr"
          />

          {/* Accelerometer Card */}
          <MetricCard 
            title="Z-Axis Acceleration" 
            value={data?.accelerometer?.mean ? `${data.accelerometer.mean} m/s²` : '--'} 
            trend={data?.accelerometer?.trend}
            trendLabel="trend"
          />

        </div>
      </div>
    </div>
  );
}

// Reusable Card Component matching your design system
function MetricCard({ title, value, trend, trendLabel }: { title: string, value: string, trend?: number, trendLabel: string }) {
  const getTrendColor = (val: number) => {
    if (val > 0) return '#10b981'; // Green for up
    if (val < 0) return '#ef4444'; // Red for down
    return '#94a3b8'; // Slate for neutral
  };

  return (
    <div style={{
      background: '#1e293b',
      padding: '2rem',
      borderRadius: '12px',
      border: '1px solid rgba(51, 65, 85, 0.4)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }}>
      <h3 style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '1.1rem', fontWeight: '500' }}>
        {title}
      </h3>
      <div style={{ fontSize: '2.5rem', color: '#e2e8f0', fontWeight: '700', marginBottom: '0.5rem' }}>
        {value}
      </div>
      
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: getTrendColor(trend) }}>
          <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
          <span>{Math.abs(trend)} {trendLabel}</span>
        </div>
      )}
    </div>
  );
}