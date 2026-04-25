const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export type GeohashBounds = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export function geohashEncode(lat: number, lng: number, precision = 6): string {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Invalid lat/lng');
  }
  if (precision < 1 || precision > 12) {
    throw new Error('Invalid precision');
  }

  // Clamp to valid ranges.
  let latitude = Math.max(-90, Math.min(90, lat));
  let longitude = ((lng + 180) % 360 + 360) % 360 - 180;
  if (longitude === 180) longitude = -180;

  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  let isEven = true;
  let bit = 0;
  let ch = 0;
  let hash = '';

  while (hash.length < precision) {
    if (isEven) {
      const mid = (lngMin + lngMax) / 2;
      if (longitude >= mid) {
        ch = (ch << 1) | 1;
        lngMin = mid;
      } else {
        ch = (ch << 1) | 0;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        ch = (ch << 1) | 1;
        latMin = mid;
      } else {
        ch = (ch << 1) | 0;
        latMax = mid;
      }
    }

    isEven = !isEven;
    bit++;

    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

export function geohashDecodeBounds(hash: string): GeohashBounds {
  if (!hash || typeof hash !== 'string') throw new Error('Invalid geohash');

  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  let isEven = true;

  for (const c of hash.toLowerCase()) {
    const cd = BASE32.indexOf(c);
    if (cd === -1) throw new Error('Invalid geohash');

    for (let mask = 16; mask !== 0; mask >>= 1) {
      const bit = (cd & mask) !== 0;
      if (isEven) {
        const mid = (lngMin + lngMax) / 2;
        if (bit) lngMin = mid;
        else lngMax = mid;
      } else {
        const mid = (latMin + latMax) / 2;
        if (bit) latMin = mid;
        else latMax = mid;
      }
      isEven = !isEven;
    }
  }

  return { minLat: latMin, minLng: lngMin, maxLat: latMax, maxLng: lngMax };
}

export function geohashDecodeCenter(hash: string): { lat: number; lng: number } {
  const b = geohashDecodeBounds(hash);
  return {
    lat: (b.minLat + b.maxLat) / 2,
    lng: (b.minLng + b.maxLng) / 2,
  };
}
