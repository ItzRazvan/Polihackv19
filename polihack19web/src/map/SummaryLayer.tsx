import { useMemo } from 'react';
import { Layer, Source, type FillLayer } from 'react-map-gl/maplibre';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { Cell } from '../types';
import { squarePolygonFromCenterMeters } from '../geo/mercatorGrid';

type Props = {
  cells: Cell[];
};

const layer: FillLayer = {
  id: 'summary-fill',
  type: 'fill',
  source: 'summary',
  paint: {
    'fill-color': [
      'step',
      ['get', 'pointCount'],
      '#1f9d55',
      5,
      '#f2c94c',
      10,
      '#eb5757',
    ],
    'fill-opacity': 0.25,
    'fill-outline-color': 'rgba(0,0,0,0.2)',
  },
};

export function SummaryLayer({ cells }: Props) {
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
    <Source id="summary" type="geojson" data={data}>
      <Layer {...layer} />
    </Source>
  );
}
