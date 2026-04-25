import { useState } from 'react';

export type ContinentViewport = {
  name: string;
  longitude: number;
  latitude: number;
  zoom: number;
};

const CONTINENTS: ContinentViewport[] = [
  {
    name: 'Europe',
    longitude: 10,
    latitude: 54,
    zoom: 4,
  },
  {
    name: 'North America',
    longitude: -95,
    latitude: 40,
    zoom: 3.5,
  },
  {
    name: 'South America',
    longitude: -60,
    latitude: -15,
    zoom: 3.5,
  },
  {
    name: 'Africa',
    longitude: 20,
    latitude: 0,
    zoom: 3.5,
  },
  {
    name: 'Asia',
    longitude: 100,
    latitude: 30,
    zoom: 3,
  },
  {
    name: 'Oceania',
    longitude: 135,
    latitude: -25,
    zoom: 3.5,
  },
  {
    name: 'Antarctica',
    longitude: 0,
    latitude: -90,
    zoom: 2,
  },
];

type Props = {
  onContinentSelect: (viewport: ContinentViewport) => void;
  defaultContinent?: string;
};

export function ContinentSelector({
  onContinentSelect,
  defaultContinent = 'Europe',
}: Props) {
  const [selected, setSelected] = useState(defaultContinent);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const continentName = e.target.value;
    setSelected(continentName);
    const continent = CONTINENTS.find((c) => c.name === continentName);
    if (continent) {
      onContinentSelect(continent);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <label
        htmlFor="continent-select"
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          marginBottom: '6px',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        🌍 Continent
      </label>
      <select
        id="continent-select"
        value={selected}
        onChange={handleChange}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #334155',
          backgroundColor: '#1e293b',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          color: '#e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s',
          minWidth: '160px',
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLSelectElement).style.borderColor = '#475569';
          (e.currentTarget as HTMLSelectElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLSelectElement).style.borderColor = '#334155';
          (e.currentTarget as HTMLSelectElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
        }}
      >
        {CONTINENTS.map((continent) => (
          <option key={continent.name} value={continent.name}>
            {continent.name}
          </option>
        ))}
      </select>
    </div>
  );
}
