import { useState, useCallback, useRef, useEffect } from 'react';

type SearchResult = {
  name: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'country' | 'continent';
};

type Props = {
  onLocationSelect: (location: SearchResult) => void;
};

const CONTINENTS: SearchResult[] = [
  { name: 'Europe', latitude: 54, longitude: 10, type: 'continent' },
  { name: 'North America', latitude: 40, longitude: -95, type: 'continent' },
  { name: 'South America', latitude: -15, longitude: -60, type: 'continent' },
  { name: 'Africa', latitude: 0, longitude: 20, type: 'continent' },
  { name: 'Asia', latitude: 30, longitude: 100, type: 'continent' },
  { name: 'Oceania', latitude: -25, longitude: 135, type: 'continent' },
  { name: 'Antarctica', latitude: -90, longitude: 0, type: 'continent' },
];

// Simple geocoding using Open-Meteo Geocoding API (free, no API key needed)
const geocodeLocation = async (query: string): Promise<SearchResult[]> => {
  if (query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en`
    );
    const data = await response.json();
    
    if (!data.results) return [];
    
    return data.results.map((result: any) => ({
      name: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`,
      latitude: result.latitude,
      longitude: result.longitude,
      type: result.admin1 ? 'city' : 'country',
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
};

export function LocationSearch({ onLocationSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      // Check if query matches any continents
      const matchingContinents = CONTINENTS.filter((continent) =>
        continent.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Get geocoding results
      const geoResults = await geocodeLocation(searchQuery);
      
      // Combine continent matches with geocoding results
      const allResults = [...matchingContinents, ...geoResults];
      setResults(allResults);
      setIsOpen(allResults.length > 0);
      setIsLoading(false);
    }, 300);
  }, []);

  const handleSelectResult = useCallback((result: SearchResult) => {
    onLocationSelect(result);
    setQuery(result.name);
    setIsOpen(false);
    setResults([]);
  }, [onLocationSelect]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 20,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        width: '340px',
      }}
    >
      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '16px',
            pointerEvents: 'none',
            color: '#64748b',
          }}
        >
          🔍
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search continent, country or city..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          style={{
            width: '100%',
            padding: '11px 12px 11px 40px',
            borderRadius: '10px',
            border: '1px solid #334155',
            backgroundColor: '#1e293b',
            fontSize: '13px',
            fontWeight: 500,
            color: '#e2e8f0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setQuery('');
              setResults([]);
            } else if (e.key === 'Enter' && results.length > 0) {
              e.preventDefault();
              handleSelectResult(results[0]);
            }
          }}
        />
        
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: '#64748b',
              animation: 'spin 1s linear infinite',
            }}
          >
            ⟳
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '10px',
            border: '1px solid #334155',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            maxHeight: '320px',
            overflowY: 'auto',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
          }}
        >
          {results.map((result, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectResult(result)}
              style={{
                padding: '13px 16px',
                borderBottom: idx < results.length - 1 ? '1px solid rgba(51, 65, 85, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                fontSize: '13px',
                color: '#cbd5e1',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(51, 65, 85, 0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
                {result.type === 'continent' ? '🌍' : result.type === 'country' ? '🌐' : '🏙️'} {result.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {result.type === 'continent' ? 'Continent' : result.type === 'country' ? 'Country' : 'City'}
              </div>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !isLoading && results.length === 0 && isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '10px',
            border: '1px solid #334155',
            padding: '16px',
            fontSize: '13px',
            color: '#94a3b8',
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          No locations found for "{query}"
        </div>
      )}
    </div>
  );
}
