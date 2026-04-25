import { describe, expect, it } from 'vitest';
import {
  lngLatToWebMercatorMeters,
  squarePolygonFromCenterMeters,
} from './mercatorGrid';

describe('mercatorGrid', () => {
  it('creates a square of the requested side length in meter space', () => {
    const center = { lng: 0, lat: 0 };
    const side = 1000;
    const poly = squarePolygonFromCenterMeters(center, side);
    const ring = poly.geometry.coordinates[0];

    const nw = lngLatToWebMercatorMeters({ lng: ring[0][0], lat: ring[0][1] });
    const ne = lngLatToWebMercatorMeters({ lng: ring[1][0], lat: ring[1][1] });
    const se = lngLatToWebMercatorMeters({ lng: ring[2][0], lat: ring[2][1] });

    const width = Math.abs(ne.x - nw.x);
    const height = Math.abs(ne.y - se.y);

    expect(width).toBeGreaterThan(999.5);
    expect(width).toBeLessThan(1000.5);
    expect(height).toBeGreaterThan(999.5);
    expect(height).toBeLessThan(1000.5);
  });
});
