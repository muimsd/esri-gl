import { useDynamicMapService } from '../../react/hooks/useDynamicMapService';
import { useTiledMapService } from '../../react/hooks/useTiledMapService';
import { useImageService } from '../../react/hooks/useImageService';
import { useVectorTileService } from '../../react/hooks/useVectorTileService';
import { useFeatureService } from '../../react/hooks/useFeatureService';
import type { Map } from '@/types';

type MapRefLike = { getMap: () => unknown };
type MapCollection = { current?: MapRefLike | null } | null;

/**
 * Build the `useEsri{Mapbox,Maplibre}Layer` hook result from a map collection
 * returned by the corresponding react-map-gl `useMap` hook. Keeps the two
 * flavors of the hook identical except for the map source.
 */
export function createEsriLayerHooks(collection: MapCollection) {
  // Preserve legacy return shape: `map` is undefined when no ref, the
  // underlying map otherwise. Child hooks type `map: Map | null`, so we
  // coerce for the injection below.
  const map = collection?.current?.getMap?.() as Map | undefined;
  const injectedMap = (map ?? null) as Map | null;

  return {
    map,
    useDynamicMapService: (options: Parameters<typeof useDynamicMapService>[0]) =>
      useDynamicMapService({ ...options, map: injectedMap }),
    useTiledMapService: (options: Parameters<typeof useTiledMapService>[0]) =>
      useTiledMapService({ ...options, map: injectedMap }),
    useImageService: (options: Parameters<typeof useImageService>[0]) =>
      useImageService({ ...options, map: injectedMap }),
    useVectorTileService: (options: Parameters<typeof useVectorTileService>[0]) =>
      useVectorTileService({ ...options, map: injectedMap }),
    useFeatureService: (options: Parameters<typeof useFeatureService>[0]) =>
      useFeatureService({ ...options, map: injectedMap }),
  };
}
