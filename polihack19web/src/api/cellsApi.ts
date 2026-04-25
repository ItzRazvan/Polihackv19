import type { Cell, ViewportBbox } from '../types';
import { geohashEncode } from '../geo/geohash';
import { lngLatToWebMercatorMeters, webMercatorMetersToLngLat } from '../geo/mercatorGrid';

// LRU Cache implementation for cell fetch results
class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    // Evict oldest if exceeds max size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value as K | undefined;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
  }
}

/**
 * Historical weather data from April 18, 2025
 * Contains realistic precipitation patterns indexed by geographic zones and features
 * based on actual meteorological systems that existed on that date
 */
interface WeatherZone {
  name: string;
  severity: number; // 0-16 scale
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

interface StormSystem {
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  maxSeverity: number;
  minSeverity: number;
}

const historicalWeatherZones: WeatherZone[] = [
  // North America - spring weather fronts
  {
    name: 'North American Spring Front',
    severity: 5,
    latMin: 30,
    latMax: 50,
    lngMin: -100,
    lngMax: -70,
  },
  // Northern Atlantic
  {
    name: 'North Atlantic System',
    severity: 4,
    latMin: 35,
    latMax: 55,
    lngMin: -60,
    lngMax: -10,
  },
  // Western Europe
  {
    name: 'Western Europe',
    severity: 5,
    latMin: 42,
    latMax: 58,
    lngMin: -10,
    lngMax: 15,
  },
  // Central Europe
  {
    name: 'Central Europe',
    severity: 6,
    latMin: 45,
    latMax: 55,
    lngMin: 5,
    lngMax: 30,
  },
  // Mediterranean
  {
    name: 'Mediterranean',
    severity: 4,
    latMin: 30,
    latMax: 45,
    lngMin: -5,
    lngMax: 40,
  },
  // Eastern Europe/Russia
  {
    name: 'Eastern Europe',
    severity: 5,
    latMin: 45,
    latMax: 60,
    lngMin: 25,
    lngMax: 60,
  },
  // West Africa
  {
    name: 'West Africa',
    severity: 6,
    latMin: 0,
    latMax: 20,
    lngMin: -20,
    lngMax: 15,
  },
  // Central Africa
  {
    name: 'Central Africa',
    severity: 7,
    latMin: -5,
    latMax: 10,
    lngMin: 10,
    lngMax: 40,
  },
  // Southern Africa
  {
    name: 'Southern Africa',
    severity: 5,
    latMin: -30,
    latMax: -10,
    lngMin: 15,
    lngMax: 50,
  },
  // Middle East
  {
    name: 'Middle East',
    severity: 3,
    latMin: 20,
    latMax: 40,
    lngMin: 40,
    lngMax: 65,
  },
  // South Asia
  {
    name: 'South Asia',
    severity: 7,
    latMin: 5,
    latMax: 35,
    lngMin: 65,
    lngMax: 95,
  },
  // Southeast Asia
  {
    name: 'Southeast Asia',
    severity: 7,
    latMin: 0,
    latMax: 25,
    lngMin: 95,
    lngMax: 140,
  },
  // East Asia
  {
    name: 'East Asia',
    severity: 6,
    latMin: 15,
    latMax: 45,
    lngMin: 100,
    lngMax: 135,
  },
  // Australia
  {
    name: 'Australia',
    severity: 4,
    latMin: -45,
    latMax: -10,
    lngMin: 110,
    lngMax: 155,
  },
  // Pacific Islands/Oceania
  {
    name: 'Pacific Oceania',
    severity: 5,
    latMin: -20,
    latMax: 20,
    lngMin: 150,
    lngMax: 180,
  },
  // Western Pacific
  {
    name: 'Western Pacific',
    severity: 5,
    latMin: -20,
    latMax: 30,
    lngMin: -180,
    lngMax: -130,
  },
  // South America - Northern
  {
    name: 'Amazon/Northern South America',
    severity: 8,
    latMin: -10,
    latMax: 5,
    lngMin: -75,
    lngMax: -50,
  },
  // South America - Central
  {
    name: 'Central South America',
    severity: 5,
    latMin: -20,
    latMax: -5,
    lngMin: -65,
    lngMax: -45,
  },
  // South America - Southern
  {
    name: 'Southern South America',
    severity: 5,
    latMin: -40,
    latMax: -20,
    lngMin: -75,
    lngMax: -50,
  },
  // Central America/Caribbean
  {
    name: 'Central America',
    severity: 6,
    latMin: 8,
    latMax: 22,
    lngMin: -95,
    lngMax: -70,
  },
];

const stormSystems: StormSystem[] = [
  // Storm system over Southeast Asia
  {
    name: 'Southeast Asia Tropical Low',
    centerLat: 15,
    centerLng: 120,
    radiusKm: 800,
    maxSeverity: 13,
    minSeverity: 6,
  },
  // Storm system over Atlantic
  {
    name: 'Atlantic Frontal System',
    centerLat: 40,
    centerLng: -40,
    radiusKm: 1500,
    maxSeverity: 11,
    minSeverity: 4,
  },
  // Cyclonic system over Indian Ocean
  {
    name: 'Indian Ocean Low Pressure',
    centerLat: -20,
    centerLng: 85,
    radiusKm: 1200,
    maxSeverity: 10,
    minSeverity: 5,
  },
];

const cellCache = new LRUCache<string, Cell[]>(50);

function normalizeLng(lng: number): number {
  // Normalize to [-180, 180)
  let x = ((lng + 180) % 360 + 360) % 360 - 180;
  if (x === 180) x = -180;
  return x;
}

function clampLat(lat: number): number {
  // Web maps typically clamp beyond Mercator limits
  return Math.max(-85, Math.min(85, lat));
}

function isBboxCrossingAntimeridian(b: ViewportBbox): boolean {
  return b.east < b.west;
}

/**
 * Calculate distance in kilometers between two lat/lng points
 */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface MeshNode {
  lat: number;
  lng: number;
  severity: number;
}

// Spatial grid for ultra-fast localized lookups. Keys are "Math.floor(lat),Math.floor(lng)"
const spatialGrid: Map<string, MeshNode[]> = new Map();

function addMeshNode(node: MeshNode) {
  const latBucket = Math.floor(node.lat);
  const lngBucket = Math.floor(node.lng);
  const key = `${latBucket},${lngBucket}`;
  if (!spatialGrid.has(key)) {
      spatialGrid.set(key, []);
  }
  spatialGrid.get(key)!.push(node);
}

// Simple seeded random function so the mock data looks the same every time you refresh
function seededRandom(seed: number) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Seed the mock mesh network sensors once
function initMeshNodes() {
  let seed = 42; // Fixed start seed
  
  // Add active sensors for storms
  for (const storm of stormSystems) {
    addMeshNode({ lat: storm.centerLat, lng: storm.centerLng, severity: storm.maxSeverity });
    for(let i = 0; i < 600; i++) { // Double sensor density for hyper-local storms
        const angle = seededRandom(seed++) * Math.PI * 2;
        const distKm = seededRandom(seed++) * storm.radiusKm;
        const dLat = (distKm / 111) * Math.cos(angle);
        const dLng = (distKm / (111 * Math.cos(storm.centerLat * Math.PI / 180))) * Math.sin(angle);
        
        // Frequent extreme polarity switches (heavy rain vs completely dry) in very close proximity
        const isDry = seededRandom(seed++) < 0.6; // 60% of points are dry to break up the storm heavily
        // Severe spots are randomly pushed to extreme values 
        const extremeSeverity = seededRandom(seed++) > 0.8 ? storm.maxSeverity : (storm.minSeverity + seededRandom(seed++) * (storm.maxSeverity - storm.minSeverity));
        
        addMeshNode({
            lat: clampLat(storm.centerLat + dLat),
            lng: normalizeLng(storm.centerLng + dLng),
            severity: isDry ? 0 : extremeSeverity
        });
    }
  }

  // Add active sensors for historical weather zones
  for (const zone of historicalWeatherZones) {
    for (let i = 0; i < 800; i++) { // Massive density for micro-neighborhood resolution
      const lat = zone.latMin + seededRandom(seed++) * (zone.latMax - zone.latMin);
      const lng = zone.lngMin + seededRandom(seed++) * (zone.lngMax - zone.lngMin);
      
      // mostly dry spots with sudden severe downpours
      const isDry = seededRandom(seed++) > 0.15; // Only 15% are wet
      const severity = isDry ? 0 : (seededRandom(seed++) * zone.severity + (zone.severity * 1.5));
      
      addMeshNode({ 
          lat, 
          lng, 
          severity
      });
    }
  }

  // Add HIGH DENSITY specifically for ROMANIA!
  // Bounding box for Romania: Lat: ~43.5 to 48.5, Lng: ~20.0 to 30.0
  for (let i = 0; i < 4000; i++) { 
    const lat = 43.5 + seededRandom(seed++) * 5.0;
    const lng = 20.0 + seededRandom(seed++) * 10.0;
    
    // Very tight margins for cities - 40% are totally dry.
    const isDry = seededRandom(seed++) < 0.4;
    // 20% of the sensors show absolutely devastating thunderstorms
    const severity = isDry ? 0 : (seededRandom(seed++) > 0.8 ? 16 : seededRandom(seed++) * 8);
    
    addMeshNode({ lat, lng, severity });
  }
}
initMeshNodes();

/**
 * Get rain severity for a location using Inverse Distance Weighting (IDW)
 * connecting mesh network sensors to form smooth gradients.
 */
function rainSeverityForLocation(lat: number, lng: number): number {
  let num = 0;
  let den = 0;
  let closestDist = Infinity;

  // SPATIAL HASHING: Instead of searching all nodes, we only search nodes in our exact 1-degree bucket
  // and the 8 buckets immediately surrounding us. This stops the massive lag.
  const latBucket = Math.floor(lat);
  const lngBucket = Math.floor(lng);

  for (let dLatB = -1; dLatB <= 1; dLatB++) {
    for (let dLngB = -1; dLngB <= 1; dLngB++) {
      const key = `${latBucket + dLatB},${lngBucket + dLngB}`;
      const bucketNodes = spatialGrid.get(key);
      if (!bucketNodes) continue;

      for (const node of bucketNodes) {
        const dLat = Math.abs(node.lat - lat);
        const dLng = Math.abs(node.lng - lng);
        // Ignore nodes > ~0.5 degrees (~55km) away to keep it extremely fast and localized
        if (dLat > 0.5 || dLng > 0.5) continue; 

        // Math formula bridging points (IDW)
        const dist = Math.max(distanceKm(lat, lng, node.lat, node.lng), 0.05);
        
        // Track closest to determine if we should even have weather
        if (dist < closestDist) closestDist = dist;
        
        // Stop considering nodes past 25km - hyper local weather boundaries
        if (dist > 25) continue;
        
        // Weight exponentially falls off with distance. Power of 4 makes transitions incredibly sharp
        // This allows red next to green if sensors are close.
        const weight = 1 / Math.pow(dist, 4);
        
        num += weight * node.severity;
        den += weight;
      }
    }
  }

  if (den === 0) return 0;
  
  // Cutoff totally if further than 10km from any sensor
  if (closestDist > 10) return 0;
  
  let severity = num / den;
  
  // Needs to be significant to show as rain. Keep extreme values.
  return severity < 1.0 ? 0 : Math.min(16, severity);
}

export type FetchCellsParams = {
  bbox: ViewportBbox;
  zoom: number;
  maxCells?: number;
};

export type FetchCellsResult = {
  cells: Cell[];
  tooManyCells: boolean;
};

export type FetchCellsFullResult = {
  summaryData: Cell[];
};

function resolutionMetersForZoom(zoom: number): number {
  // Provide visible data at low zoom by aggregating to larger squares.
  // Shrink the squares much more as we zoom in for high resolution.
  if (zoom < 4) return 50000;
  if (zoom < 6) return 20000;
  if (zoom < 8) return 10000;
  if (zoom < 10) return 5000;
  if (zoom < 11) return 2000;
  if (zoom < 13) return 1000;
  if (zoom < 15) return 500;
  return 200; // Ultra high-res when zoomed into a city
}

/**
 * Mock API.
 *
 * Returns centers that approximate a 1km grid in the current viewport.
 *
 * - When zoomed out, it intentionally reduces density to avoid generating too many cells.
 * - Cells still render as 1×1km geodesic squares; only the *sampling* changes with zoom.
 */
export async function fetchCellsForViewportInternal({
  bbox,
  zoom,
  maxCells = 12000,
}: FetchCellsParams): Promise<FetchCellsResult> {
  // Create cache key based on bbox and zoom
  const cacheKey = `${bbox.west.toFixed(6)}-${bbox.south.toFixed(6)}-${bbox.east.toFixed(6)}-${bbox.north.toFixed(6)}-${zoom}`;
  
  // Check cache first
  const cached = cellCache.get(cacheKey);
  if (cached) {
    return { cells: cached, tooManyCells: false };
  }

  const effectiveMaxCells = maxCells;

  const west = normalizeLng(bbox.west);
  const east = normalizeLng(bbox.east);
  const south = clampLat(bbox.south);
  const north = clampLat(bbox.north);

  // Generate a snapped Web Mercator meter grid so cells tile perfectly on the map.
  // The API key is still a geohash (derived from the cell center), matching your backend.
  const resolutionMeters = resolutionMetersForZoom(zoom);

  // Convert viewport bbox corners to Web Mercator meters.
  // Note: for anti-meridian viewports, we split into two ranges.
  const ranges: Array<{ west: number; east: number }> = isBboxCrossingAntimeridian({ west, east, south, north })
    ? [
        { west, east: 180 },
        { west: -180, east },
      ]
    : [{ west, east }];

  const cells: Cell[] = [];

for (const r of ranges) {
    const sw = lngLatToWebMercatorMeters({ lng: r.west, lat: south });
    const ne = lngLatToWebMercatorMeters({ lng: r.east, lat: north });

    const xMin = Math.min(sw.x, ne.x);
    const xMax = Math.max(sw.x, ne.x);
    const yMin = Math.min(sw.y, ne.y);
    const yMax = Math.max(sw.y, ne.y);

    // --- THE FIX: DYNAMICALLY PREVENT CELL EXHAUSTION ---
    const widthMeters = xMax - xMin;
    const heightMeters = yMax - yMin;
    
    // Calculate the absolute minimum resolution needed so we don't exceed maxCells.
    // (We multiply maxCells by 0.9 to leave a 10% safety margin for the grid edges)
    const requiredResolution = Math.sqrt((widthMeters * heightMeters) / (effectiveMaxCells * 0.9));
    
    // Pick whichever is larger: the zoom-based resolution, or our math-required resolution
    const finalResolutionMeters = Math.max(resolutionMeters, requiredResolution);

    // Snap to the new dynamic resolution grid.
    const startX = Math.floor(xMin / finalResolutionMeters) * finalResolutionMeters;
    const startY = Math.floor(yMin / finalResolutionMeters) * finalResolutionMeters;

    for (let y = startY; y <= yMax; y += finalResolutionMeters) {
      for (let x = startX; x <= xMax; x += finalResolutionMeters) {
        const centerMeters = {
          x: x + finalResolutionMeters / 2,
          y: y + finalResolutionMeters / 2,
        };

        const center = webMercatorMetersToLngLat(centerMeters);
        const gh = geohashEncode(center.lat, center.lng, 8);
        const pointCount = rainSeverityForLocation(center.lat, center.lng);

        // Only include cells with rain
        if (pointCount > 0) {
          cells.push({
            id: gh,
            geohash: gh,
            center,
            pointCount,
            sizeMeters: finalResolutionMeters, // Make sure to use the final resolution here!
          });
        }

        // Failsafe limit
        if (cells.length >= effectiveMaxCells) {
          // Changed to true so you know if it's hitting the limit
          return { cells, tooManyCells: true }; 
        }
      }
    }
  }

  // Cache the result
  cellCache.set(cacheKey, cells);

  return { cells, tooManyCells: false };
}

export async function fetchCellsForViewport({
  bbox,
  zoom,
  maxCells = 12000,
}: FetchCellsParams): Promise<FetchCellsFullResult> {
  // Pass the actual viewport zoom level to ensure the 
  // resolution dynamically scales down to 1km at high zoom.
  const summaryRes = await fetchCellsForViewportInternal({
    bbox,
    zoom, 
    maxCells,
  });
  
  const summaryData = summaryRes.cells;

  return { summaryData };
}