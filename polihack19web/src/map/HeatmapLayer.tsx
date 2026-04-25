import { useMemo } from 'react';
import { Layer, Source, type HeatmapLayer as HeatmapLayerType } from 'react-map-gl/maplibre';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { Cell } from '../types';

type Props = {
  cells: Cell[];
};

const layer: HeatmapLayerType = {
  id: 'heatmap-layer',
  type: 'heatmap',
  source: 'heatmap',
  paint: {
    'heatmap-weight': ['get', 'severity'],
    
    // Dynamically scale intensity specifically to match the grid resolution changes
    // This perfectly preserves the color (green->red) exactly as it appeared zoomed out
    'heatmap-intensity': [
      'interpolate', 
      ['linear'], 
      ['zoom'], 
      0, 0.4, 
      5, 0.6, 
      9, 1.0, 
      12, 1.2, 
      15, 1.4, 
      18, 1.6, 
      22, 1.8
    ],
    
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0, 0, 0, 0)',
      0.02, 'rgba(34, 197, 94, 0)', // Extended invisible feathering for ultra-smooth edges
      0.1, 'rgba(34, 197, 94, 0.4)', // very light green
      0.2, '#22c55e', // green - low severity
      0.3, '#84cc16', // lime - low-medium
      0.45, '#eab308', // yellow - medium
      0.65, '#fb923c', // orange - medium-high
      0.8, '#ef4444', // red - high
      1, '#991b1b', // dark red - severe
    ],
    
    // Larger radius at high zoom to make circles more pronounced and merge perfectly at street level
    'heatmap-radius': [
      'interpolate', 
      ['linear'], 
      ['zoom'], 
      0, 15, 
      5, 25, 
      9, 45, 
      12, 70, 
      15, 175,  // slightly boosted to make gaps disappear
      18, 400, 
      22, 1400 
    ],
    
    // Much more visible at high zoom levels
    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0,
      0.5,
      5,
      0.55,
      9,
      0.6,
      12,
      0.65,
      15,
      0.75,
      18,
      0.85,
    ],
  },
};export function HeatmapLayer({ cells }: Props) {
  const data = useMemo<FeatureCollection<Point>>(() => {
    // Filter out cells with zero severity (no rain predicted)
    const rainCells = cells.filter((cell) => cell.pointCount > 0);
    
    const features: Array<Feature<Point>> = rainCells.map((cell) => ({
      type: 'Feature',
      properties: {
        id: cell.id,
        geohash: cell.geohash,
        // Normalize severity to 0-1 range for heatmap weighting
        severity: cell.pointCount / 16,
      },
      geometry: {
        type: 'Point',
        coordinates: [cell.center.lng, cell.center.lat],
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [cells]);

  return (
    <Source id="heatmap" type="geojson" data={data}>
      <Layer {...layer} />
    </Source>
  );
}
