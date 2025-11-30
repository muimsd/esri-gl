import { useMap } from 'react-map-gl/mapbox';
import { useDynamicMapService } from '../../react/hooks/useDynamicMapService';
import { useTiledMapService } from '../../react/hooks/useTiledMapService';
import { useImageService } from '../../react/hooks/useImageService';
import { useVectorTileService } from '../../react/hooks/useVectorTileService';
import { useFeatureService } from '../../react/hooks/useFeatureService';
import type { Map } from '@/types';

/**
 * Hook for using Esri services with Mapbox GL JS (via react-map-gl)
 */
export function useEsriMapboxLayer() {
  const { current: mapRef } = useMap();
  const map = mapRef?.getMap() as unknown as Map | null;

  return {
    map,
    useDynamicMapService: (options: Parameters<typeof useDynamicMapService>[0]) =>
      useDynamicMapService({ ...options, map }),
    useTiledMapService: (options: Parameters<typeof useTiledMapService>[0]) =>
      useTiledMapService({ ...options, map }),
    useImageService: (options: Parameters<typeof useImageService>[0]) =>
      useImageService({ ...options, map }),
    useVectorTileService: (options: Parameters<typeof useVectorTileService>[0]) =>
      useVectorTileService({ ...options, map }),
    useFeatureService: (options: Parameters<typeof useFeatureService>[0]) =>
      useFeatureService({ ...options, map }),
  };
}
