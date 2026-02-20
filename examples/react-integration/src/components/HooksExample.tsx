import { useEffect, useRef, useState } from 'react';
import {
  useDynamicMapService,
  useImageService,
  useTiledMapService,
} from 'esri-gl/react';
import type { Map as EsriMap } from 'esri-gl';
import { useMaplibreMap } from '../hooks/useMaplibreMap';

type ActiveService = 'dynamic' | 'tiled' | 'image';

const SERVICES: Record<ActiveService, { label: string; description: string }> = {
  dynamic: {
    label: 'Dynamic Map Service',
    description: 'Server-rendered USA map service with states, highways, and cities.',
  },
  tiled: {
    label: 'Tiled Map Service',
    description: 'Cached World Imagery tiles from ArcGIS Online.',
  },
  image: {
    label: 'Image Service',
    description: 'WorldElevation3D terrain image service.',
  },
};

const SOURCE_IDS: Record<ActiveService, string> = {
  dynamic: 'hooks-dynamic',
  tiled: 'hooks-tiled',
  image: 'hooks-image',
};

function useRasterLayer(map: maplibregl.Map | null, sourceId: string, visible: boolean) {
  const layerId = `${sourceId}-layer`;

  useEffect(() => {
    if (!map || !visible) return;

    const tryAdd = () => {
      if (map.getSource(sourceId) && !map.getLayer(layerId)) {
        map.addLayer({ id: layerId, type: 'raster', source: sourceId });
      }
    };

    // Source may already exist or arrive shortly after hook renders.
    tryAdd();
    const timer = setTimeout(tryAdd, 200);

    return () => {
      clearTimeout(timer);
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      } catch { /* map may already be removed */ }
    };
  }, [map, sourceId, layerId, visible]);
}

export default function HooksExample() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const map = useMaplibreMap({ container: containerRef });
  const [activeService, setActiveService] = useState<ActiveService>('dynamic');

  const typedMap = map as unknown as EsriMap | null;

  const dynamicResult = useDynamicMapService({
    sourceId: SOURCE_IDS.dynamic,
    map: activeService === 'dynamic' ? typedMap : null,
    options: {
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      layers: [0, 1, 2],
      transparent: true,
    },
  });

  const tiledResult = useTiledMapService({
    sourceId: SOURCE_IDS.tiled,
    map: activeService === 'tiled' ? typedMap : null,
    options: {
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    },
  });

  const imageResult = useImageService({
    sourceId: SOURCE_IDS.image,
    map: activeService === 'image' ? typedMap : null,
    options: {
      url: 'https://elevation3d.arcgisonline.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      format: 'jpgpng',
    },
  });

  const results: Record<ActiveService, { loading: boolean; error: Error | null; service: unknown }> = {
    dynamic: dynamicResult,
    tiled: tiledResult,
    image: imageResult,
  };

  useRasterLayer(map, SOURCE_IDS.dynamic, activeService === 'dynamic');
  useRasterLayer(map, SOURCE_IDS.tiled, activeService === 'tiled');
  useRasterLayer(map, SOURCE_IDS.image, activeService === 'image');

  const { loading, error, service } = results[activeService];

  return (
    <div className="example-section">
      <h2>React Hooks Example</h2>
      <p>
        Toggle between different ArcGIS service types to see how the esri-gl React hooks manage
        source lifecycle on a single MapLibre map.
      </p>

      <div className="controls">
        {(Object.keys(SERVICES) as ActiveService[]).map(key => (
          <button
            key={key}
            className={activeService === key ? 'active' : undefined}
            onClick={() => setActiveService(key)}
          >
            {SERVICES[key].label}
          </button>
        ))}
      </div>

      {loading && <div className="status loading">Loading {SERVICES[activeService].label}&hellip;</div>}
      {error && (
        <div className="status error">
          Failed to load {SERVICES[activeService].label}: {error.message}
        </div>
      )}
      {!loading && !error && service && (
        <div className="status success">{SERVICES[activeService].label} ready</div>
      )}

      <div className="map-container" ref={containerRef} />

      <div className="card-grid">
        {(Object.keys(SERVICES) as ActiveService[]).map(key => (
          <div key={key} className={`card${activeService === key ? ' active' : ''}`}>
            <strong>{SERVICES[key].label}</strong>
            <p>{SERVICES[key].description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
