import { describe, expect, it } from 'vitest';
import { geohashDecodeCenter, geohashEncode } from './geohash';

describe('geohash', () => {
  it('roundtrips roughly at precision 6', () => {
    const lat = 46.7712;
    const lng = 23.6236;

    const h = geohashEncode(lat, lng, 6);
    const c = geohashDecodeCenter(h);

    // Precision 6 cell is ~0.6-1.2km scale depending on latitude.
    expect(Math.abs(c.lat - lat)).toBeLessThan(0.02);
    expect(Math.abs(c.lng - lng)).toBeLessThan(0.02);
  });
});
