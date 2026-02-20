import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { DynamicMapService, TiledMapService, IdentifyFeatures } from 'esri-gl';
import type { Map as EsriMap } from 'esri-gl';
import { useMaplibreMap } from '../hooks/useMaplibreMap';

interface IdentifyResult {
  layerId: number;
  layerName?: string;
  attributes?: Record<string, unknown>;
}

export default function MapLibreIntegrationExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const map = useMaplibreMap({ container: containerRef });

  const [services, setServices] = useState<{
    dynamic?: DynamicMapService;
    tiled?: TiledMapService;
  }>({});
  const [visibleLayers, setVisibleLayers] = useState({ dynamic: false, tiled: false });
  const [identifyResults, setIdentifyResults] = useState<IdentifyResult[]>([]);

  // Keep refs in sync so the click handler always sees current values.
  const servicesRef = useRef(services);
  const visibleRef = useRef(visibleLayers);
  servicesRef.current = services;
  visibleRef.current = visibleLayers;

  // Click handler for identify – uses refs to avoid stale closures.
  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      if (!servicesRef.current.dynamic || !visibleRef.current.dynamic) return;

      try {
        const task = new IdentifyFeatures({
          url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        });
        task.at({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        task.on(map as unknown as EsriMap);

        const fc = await task.run();
        setIdentifyResults(
          fc.features.map(f => ({
            layerId: (f.properties?.layerId as number) ?? 0,
            layerName: (f.properties?.layerName as string) ?? undefined,
            attributes: f.properties ?? {},
          })),
        );
      } catch (err) {
        console.error('Identify failed:', err);
        setIdentifyResults([]);
      }
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map]);

  const toggleDynamicLayer = useCallback(() => {
    if (!map) return;

    if (visibleLayers.dynamic && services.dynamic) {
      if (map.getLayer('usa-dynamic')) map.removeLayer('usa-dynamic');
      services.dynamic.remove();
      setServices(prev => ({ ...prev, dynamic: undefined }));
      setVisibleLayers(prev => ({ ...prev, dynamic: false }));
    } else {
      const svc = new DynamicMapService(
        'usa-dynamic-source',
        map as unknown as EsriMap,
        {
          url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
          layers: [0, 1, 2],
          transparent: true,
        },
      );
      map.addLayer({ id: 'usa-dynamic', type: 'raster', source: 'usa-dynamic-source' });
      setServices(prev => ({ ...prev, dynamic: svc }));
      setVisibleLayers(prev => ({ ...prev, dynamic: true }));
    }
  }, [map, visibleLayers.dynamic, services.dynamic]);

  const toggleTiledLayer = useCallback(() => {
    if (!map) return;

    if (visibleLayers.tiled && services.tiled) {
      if (map.getLayer('world-topo')) map.removeLayer('world-topo');
      services.tiled.remove();
      setServices(prev => ({ ...prev, tiled: undefined }));
      setVisibleLayers(prev => ({ ...prev, tiled: false }));
    } else {
      const svc = new TiledMapService(
        'world-topo-source',
        map as unknown as EsriMap,
        {
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
        },
      );
      map.addLayer(
        { id: 'world-topo', type: 'raster', source: 'world-topo-source' },
        map.getLayer('usa-dynamic') ? 'usa-dynamic' : undefined,
      );
      setServices(prev => ({ ...prev, tiled: svc }));
      setVisibleLayers(prev => ({ ...prev, tiled: true }));
    }
  }, [map, visibleLayers.tiled, services.tiled]);

  return (
    <div className="example-section">
      <h2>MapLibre GL Integration</h2>
      <p>
        Direct integration with MapLibre GL JS using esri-gl service classes &mdash; no React
        wrapper components needed. Click on the map when the dynamic layer is visible to identify
        features.
      </p>

      <div className="controls">
        <button
          className={visibleLayers.dynamic ? 'active' : undefined}
          disabled={!map}
          onClick={toggleDynamicLayer}
        >
          {visibleLayers.dynamic ? 'Hide' : 'Show'} USA Dynamic Layer
        </button>
        <button
          className={visibleLayers.tiled ? 'active' : undefined}
          disabled={!map}
          onClick={toggleTiledLayer}
        >
          {visibleLayers.tiled ? 'Hide' : 'Show'} World Topo Layer
        </button>
      </div>

      <div className="map-container" ref={containerRef} />

      {identifyResults.length > 0 && (
        <div className="results-panel">
          <h4>Identify Results ({identifyResults.length})</h4>
          {identifyResults.slice(0, 5).map((result, i) => (
            <div className="result-item" key={i}>
              <strong>{result.layerName ?? `Layer ${result.layerId}`}</strong>
              <div className="attrs">
                {Object.entries(result.attributes ?? {})
                  .filter(([k]) => !['layerId', 'layerName', 'displayFieldName', 'value'].includes(k))
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <div key={k}><strong>{k}:</strong> {String(v)}</div>
                  ))}
              </div>
            </div>
          ))}
          {identifyResults.length > 5 && (
            <p style={{ fontSize: 13, color: '#64748b' }}>
              &hellip; and {identifyResults.length - 5} more
            </p>
          )}
        </div>
      )}

      <div className="tip-box">
        <strong>Tip:</strong> This example uses the esri-gl service classes directly with a
        MapLibre GL map &mdash; ideal when you need full control over the map instance or prefer
        not to depend on react-map-gl.
      </div>
    </div>
  );
}
