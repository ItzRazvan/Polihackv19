import { useCallback, useMemo, useRef, useState } from 'react';
import Map, { type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { useNavigate } from 'react-router-dom';
import { HeatmapLayer } from '../map/HeatmapLayer';
import { Legend } from '../map/Legend';
import { LocationSearch } from '../map/LocationSearch';
import type { Cell, ViewportBbox } from '../types';
import { fetchCellsForViewport } from '../api/cellsApi';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export function MapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef | null>(null);
  const loadingRef = useRef(false);
  
  const [summaryData, setSummaryData] = useState<Cell[]>([]);
  const [zoom, setZoom] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

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

    let zoomLevel: number;
    if (location.type === 'continent') {
      zoomLevel = 3.5;
    } else if (location.type === 'country') {
      zoomLevel = 5;
    } else {
      zoomLevel = 11;
    }

    map.flyTo({
      center: [location.longitude, location.latitude],
      zoom: zoomLevel,
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

      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: 20,
          left: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '8px 12px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(51, 65, 85, 0.5)',
          borderRadius: 8,
          color: '#e2e8f0',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 500,
          lineHeight: 1,
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          zIndex: 10,
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(30, 41, 59, 0.95)';
          e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.8)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
          e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)';
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

      {/* Demo Warning Banner - Bottom Right Corner */}
      {showWarning && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          zIndex: 5,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
          fontSize: '0.85rem',
          maxWidth: '280px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}>
          <div style={{ flex: 1, lineHeight: '1.4' }}>
            <strong>⚠️ Demo Data</strong><br />
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              Generalized data only. <a href="/pricing" style={{ color: 'white', textDecoration: 'underline' }}>Buy API access</a> for production.
            </span>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '1rem',
              lineHeight: '1',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
          >
            ×
          </button>
        </div>
      )}

      {/* Zoom Controls */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 20,
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
          zIndex: 10,
        }}
      >
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
            top: 72,
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
            zIndex: 10,
          }}
        >
          {overlayText}
        </div>
      ) : null}
    </div>
  );
}
