import { useCallback, useMemo, useRef, useState } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

import { HeatmapLayer } from './map/HeatmapLayer';
import { Legend } from './map/Legend';
import { LocationSearch } from './map/LocationSearch';
import type { Cell, ViewportBbox } from './types';
import { fetchCellsForViewport } from './api/cellsApi';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export default function App() {
  const mapRef = useRef<MapRef | null>(null);
  const loadingRef = useRef(false);
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [inputKey, setInputKey] = useState('');

  const [summaryData, setSummaryData] = useState<Cell[]>([]);
  const [zoom, setZoom] = useState(4);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      localStorage.setItem('apiKey', inputKey.trim());
      setApiKey(inputKey.trim());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('apiKey');
    setApiKey('');
  };

  const loadCells = useCallback(async () => {
    const map = mapRef.current?.getMap();
    if (!map || loadingRef.current) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const currentZoom = map.getZoom();
    setZoom(currentZoom);

    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const bbox: ViewportBbox = {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
      };

      const res = await fetchCellsForViewport({ bbox, zoom: currentZoom, maxCells: 12000 });
      setSummaryData(res.summaryData);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const handleLocationSelect = useCallback((location: { name: string; latitude: number; longitude: number; type: 'city' | 'country' | 'continent' }) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Determine zoom level based on location type
    let zoom: number;
    if (location.type === 'continent') {
      zoom = 3.5;
    } else if (location.type === 'country') {
      zoom = 5;
    } else {
      zoom = 11;
    }

    map.flyTo({
      center: [location.longitude, location.latitude],
      zoom: zoom,
      duration: 1500,
    });
  }, []);

  const overlayText = useMemo(() => {
    if (isLoading) return 'Loading rain forecast data...';
    if (summaryData.length === 0) return 'No rain predicted in this area.';
    return null;
  }, [isLoading, summaryData.length, zoom]);

  const jumpToZoom = useCallback((targetZoom: number) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.flyTo({ zoom: targetZoom, duration: 1200 });
  }, []);

  if (!apiKey) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white', fontFamily: 'system-ui' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#1e293b', padding: '2rem', borderRadius: '8px', minWidth: '300px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)' }}>
          <h2 style={{ margin: 0, textAlign: 'center' }}>Enter API Key</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center' }}>Please provide your API key to access the map.</p>
          <input 
            type="password" 
            value={inputKey} 
            onChange={(e) => setInputKey(e.target.value)} 
            placeholder="Your API Key" 
            style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white' }}
          />
          <button type="submit" style={{ padding: '0.75rem', borderRadius: '4px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Access Map</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, height: '100%', width: '100%', overflow: 'hidden' }}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{ longitude: 10, latitude: 54, zoom: 4 }}
        mapStyle={MAP_STYLE}
        style={{ height: '100%', width: '100%' }}
        onLoad={loadCells}
        onDrag={loadCells}
        onZoom={loadCells}
      >
        {summaryData.length > 0 ? <HeatmapLayer cells={summaryData} /> : null}
      </Map>

      <LocationSearch onLocationSelect={handleLocationSelect} />
      <Legend />

      {/* Pre-defined Optimal Zoom Levels */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          borderRadius: 8,
          padding: 8,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            background: '#ef4444',
            border: 'none',
            color: '#f8fafc',
            padding: '6px 12px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 'bold',
            cursor: 'pointer',
            marginBottom: 8,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#dc2626')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ef4444')}
        >
          Logout
        </button>

        <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4, textAlign: 'center' }}>
          Smart Zoom
        </div>
        {[
          { label: 'Continent', level: 4 },
          { label: 'Country', level: 6 },
          { label: 'Region', level: 9 },
          { label: 'City', level: 12 },
          { label: 'Neighborhood', level: 15 },
          { label: 'Street', level: 18.5 },
        ].map((zl) => (
          <button
            key={zl.label}
            onClick={() => jumpToZoom(zl.level)}
            style={{
              background: 'rgba(51, 65, 85, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
              transition: 'background 0.2s',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(71, 85, 105, 0.8)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(51, 65, 85, 0.6)')}
          >
            <span>{zl.label}</span>
            <span style={{ color: '#64748b', fontSize: 10, marginLeft: 12 }}>{zl.level}x</span>
          </button>
        ))}
      </div>

      {overlayText ? (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '10px 14px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            borderRadius: 8,
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
            fontSize: 13,
            lineHeight: 1.2,
            color: '#cbd5e1',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          }}
        >
          {overlayText}
        </div>
      ) : null}
    </div>
  );
}