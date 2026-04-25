import { useMemo } from 'react';
import { Layer, Source, type FillLayer } from 'react-map-gl';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { Cell } from '../types';
import { squarePolygonFromCenterMeters } from '../geo/mercatorGrid';

type Props = {
  cells: Cell[];
};

const layer: FillLayer = {
  id: 'cells-fill',
  type: 'fill',
  source: 'cells',
  paint: {
    'fill-color': [
      'step',
      ['get', 'pointCount'],
      '#22c55e',
      5,
      '#eab308',
      10,
      '#ef4444',
    ],
    'fill-opacity': [
      'interpolate',
      ['linear'],
      ['get', 'pointCount'],
      0,
      0.08,
      5,
      0.14,
      10,
      0.22,
      16,
      0.28,
    ],
    'fill-outline-color': [
      'step',
      ['get', 'pointCount'],
      'rgba(34,197,94,0.3)',
      5,
      'rgba(234,179,8,0.4)',
      10,
      'rgba(239,68,68,0.5)',
    ],
  },
};

export function GridLayer({ cells }: Props) {
  const data = useMemo<FeatureCollection<Polygon>>(() => {
    const features: Array<Feature<Polygon>> = cells.map((cell) => {
      const sq = squarePolygonFromCenterMeters(cell.center, cell.sizeMeters);
      return {
        ...sq,
        properties: {
          id: cell.id,
          geohash: cell.geohash,
          pointCount: cell.pointCount,
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [cells]);

  return (
    <Source id="cells" type="geojson" data={data}>
      <Layer {...layer} />
    </Source>
  );
}
