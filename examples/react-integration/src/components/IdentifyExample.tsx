import { useState, useEffect, useRef } from 'react';
import { useIdentifyFeatures } from 'esri-gl/react';
import { useMaplibreMap } from '../hooks/useMaplibreMap';
import type { Map as EsriMap } from 'esri-gl';

export default function IdentifyExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const map = useMaplibreMap({ container: containerRef });
  const [clickPoint, setClickPoint] = useState<{ lng: number; lat: number } | null>(null);
  const [results, setResults] = useState<GeoJSON.FeatureCollection | null>(null);

  const { identify, loading, error } = useIdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 3,
    returnGeometry: true,
  });

  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      const point = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      setClickPoint(point);
      setResults(null);

      try {
        const res = await identify(point, { map: map as unknown as EsriMap });
        setResults(res);
      } catch {
        // error state handled by hook
      }
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map, identify]);

  return (
    <div className="example-section">
      <h2>Identify Features Example</h2>
      <p>
        Click anywhere on the map to run an <code>IdentifyFeatures</code> query against the USA
        MapServer. The <code>useIdentifyFeatures</code> hook manages request state automatically.
      </p>

      {loading && <div className="status loading">Identifying features&hellip;</div>}
      {error && <div className="status error">Identify failed: {error.message}</div>}

      <div className="map-container" ref={containerRef} />

      {clickPoint && (
        <p>
          Clicked: {clickPoint.lng.toFixed(4)}, {clickPoint.lat.toFixed(4)}
        </p>
      )}

      {results && results.features.length > 0 && (
        <div className="results-panel">
          <h4>Results ({results.features.length})</h4>
          {results.features.map((f, i) => (
            <div className="result-item" key={i}>
              <strong>{(f.properties?.layerName as string) ?? `Feature ${i + 1}`}</strong>
              <div className="attrs">
                {Object.entries(f.properties ?? {})
                  .filter(([k]) => !['layerId', 'layerName', 'displayFieldName', 'value'].includes(k))
                  .slice(0, 5)
                  .map(([k, v]) => (
                    <div key={k}><strong>{k}:</strong> {String(v)}</div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {results && results.features.length === 0 && (
        <p>No features found at this location.</p>
      )}

      <div className="tip-box">
        <strong>Tip:</strong> The hook passes the live map instance to <code>IdentifyFeatures.on(map)</code>,
        which provides <code>mapExtent</code> and <code>imageDisplay</code> automatically.
      </div>
    </div>
  );
}
