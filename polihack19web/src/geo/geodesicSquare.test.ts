import distance from '@turf/distance';
import { point } from '@turf/helpers';
import { describe, expect, it } from 'vitest';
import { geodesicSquareFromCenter } from './geodesicSquare';

describe('geodesicSquareFromCenter', () => {
  it('creates a closed polygon with ~1km sides', () => {
    const center = { lng: 0, lat: 0 };
    const poly = geodesicSquareFromCenter(center);

    expect(poly.geometry.type).toBe('Polygon');
    const ring = poly.geometry.coordinates[0];
    expect(ring.length).toBe(5);
    expect(ring[0]).toEqual(ring[4]);

    const a = point(ring[0]);
    const b = point(ring[1]);
    const c = point(ring[2]);

    const ab = distance(a, b, { units: 'kilometers' });
    const bc = distance(b, c, { units: 'kilometers' });

    expect(ab).toBeGreaterThan(0.98);
    expect(ab).toBeLessThan(1.02);
    expect(bc).toBeGreaterThan(0.98);
    expect(bc).toBeLessThan(1.02);
  });
});
