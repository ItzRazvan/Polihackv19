export type LngLat = {
  lng: number;
  lat: number;
};

export type ViewportBbox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type Cell = {
  id: string;
  geohash: string;
  center: LngLat;
  pointCount: number; // Rain severity: 0-16 based on barometric pressure drop
  sizeMeters: number;
};
