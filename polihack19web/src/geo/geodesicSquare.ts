import destination from '@turf/destination';
import { point } from '@turf/helpers';
import type { Feature, Polygon } from 'geojson';
import type { LngLat } from '../types';

const SIDE_METERS = 1000;
const HALF_DIAGONAL_KM = (Math.SQRT2 * (SIDE_METERS / 2)) / 1000; // 1000/sqrt(2) meters

export function geodesicSquareFromCenter(center: LngLat): Feature<Polygon> {
  const c = point([center.lng, center.lat]);

  // Corners are on diagonals at bearings 45, 135, 225, 315.
  const ne = destination(c, HALF_DIAGONAL_KM, 45, { units: 'kilometers' });
  const se = destination(c, HALF_DIAGONAL_KM, 135, { units: 'kilometers' });
  const sw = destination(c, HALF_DIAGONAL_KM, 225, { units: 'kilometers' });
  const nw = destination(c, HALF_DIAGONAL_KM, 315, { units: 'kilometers' });

  const coords = [
    ne.geometry.coordinates,
    se.geometry.coordinates,
    sw.geometry.coordinates,
    nw.geometry.coordinates,
    ne.geometry.coordinates,
  ];

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
  };
}
