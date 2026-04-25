import type { Feature, Polygon } from 'geojson';
import type { LngLat } from '../types';

const R = 6378137;
const MAX_LAT = 85.05112878;

export type XYMeters = { x: number; y: number };

export function lngLatToWebMercatorMeters(lngLat: LngLat): XYMeters {
  const lng = ((lngLat.lng + 180) % 360 + 360) % 360 - 180;
  const lat = Math.max(-MAX_LAT, Math.min(MAX_LAT, lngLat.lat));

  const x = (lng * Math.PI * R) / 180;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

  return { x, y };
}

export function webMercatorMetersToLngLat(m: XYMeters): LngLat {
  const lng = (m.x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(m.y / R)) - Math.PI / 2) * (180 / Math.PI);
  return { lng, lat };
}

export function squarePolygonFromCenterMeters(center: LngLat, sideMeters: number): Feature<Polygon> {
  const half = sideMeters / 2;
  const c = lngLatToWebMercatorMeters(center);

  const nw = webMercatorMetersToLngLat({ x: c.x - half, y: c.y + half });
  const ne = webMercatorMetersToLngLat({ x: c.x + half, y: c.y + half });
  const se = webMercatorMetersToLngLat({ x: c.x + half, y: c.y - half });
  const sw = webMercatorMetersToLngLat({ x: c.x - half, y: c.y - half });

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [nw.lng, nw.lat],
          [ne.lng, ne.lat],
          [se.lng, se.lat],
          [sw.lng, sw.lat],
          [nw.lng, nw.lat],
        ],
      ],
    },
  };
}
