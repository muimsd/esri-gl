import { useState, useEffect, useRef } from 'react';
import { useDynamicMapService, useIdentifyFeatures } from 'esri-gl/react';
import type { Map as EsriMap } from 'esri-gl';
import { useMaplibreMap } from '../hooks/useMaplibreMap';

const SOURCE_ID = 'advanced-dynamic';

function useRasterLayer(map: maplibregl.Map | null, sourceId: string) {
  const layerId = `${sourceId}-layer`;

  useEffect(() => {
    if (!map) return;

    const tryAdd = () => {
      if (map.getSource(sourceId) && !map.getLayer(layerId)) {
        map.addLayer({ id: layerId, type: 'raster', source: sourceId });
      }
    };

    tryAdd();
    const timer = setTimeout(tryAdd, 200);

    return () => {
      clearTimeout(timer);
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      } catch { /* map may be removed */ }
    };
  }, [map, sourceId, layerId]);
}

export default function AdvancedFeaturesExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const map = useMaplibreMap({ container: containerRef });

  const [layerConfig, setLayerConfig] = useState({
    layers: [0, 1, 2] as number[],
    layerDefs: {} as Record<string, string>,
    format: 'png24',
    dpi: 96,
    transparent: true,
  });

  const [identifyResults, setIdentifyResults] = useState<
    Array<{ layerId: number; layerName?: string; attributes?: Record<string, unknown> }>
  >([]);

  const typedMap = map as unknown as EsriMap | null;

  const { service: dynamicService } = useDynamicMapService({
    sourceId: SOURCE_ID,
    map: typedMap,
    options: {
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      ...layerConfig,
    },
  });

  useRasterLayer(map, SOURCE_ID);

  const { identify, loading: identifyLoading } = useIdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 5,
    returnGeometry: true,
  });

  // Wire real map click for identify.
  useEffect(() => {
    if (!map) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      try {
        const fc = await identify(
          { lng: e.lngLat.lng, lat: e.lngLat.lat },
          { map: map as unknown as EsriMap },
        );
        setIdentifyResults(
          (fc?.features ?? []).map(f => ({
            layerId: (f.properties?.layerId as number) ?? 0,
            layerName: (f.properties?.layerName as string) ?? undefined,
            attributes: f.properties ?? {},
          })),
        );
      } catch {
        setIdentifyResults([]);
      }
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map, identify]);

  return (
    <div className="example-section">
      <h2>Advanced Features Example</h2>
      <p>
        Configure layer parameters in real-time and click the map to identify features.
        Changes propagate to the service immediately via <code>useDynamicMapService</code>.
      </p>

      {/* Configuration panel */}
      <div className="config-panel">
        <div className="config-grid">
          {/* Left column - layer config */}
          <div>
            <h4>Layer Configuration</h4>
            <div className="field" style={{ marginBottom: 12 }}>
              <span>Visible Layers</span>
              <div>
                {[0, 1, 2, 3].map(id => (
                  <label key={id} style={{ marginRight: 14, fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={layerConfig.layers.includes(id)}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...layerConfig.layers, id].sort((a, b) => a - b)
                          : layerConfig.layers.filter(l => l !== id);
                        setLayerConfig(prev => ({ ...prev, layers: next }));
                      }}
                      style={{ marginRight: 4 }}
                    />
                    Layer {id}
                  </label>
                ))}
              </div>
            </div>

            <label className="field" style={{ marginBottom: 12 }}>
              <span>Image Format</span>
              <select
                value={layerConfig.format}
                onChange={e => setLayerConfig(prev => ({ ...prev, format: e.target.value }))}
              >
                <option value="png24">PNG24</option>
                <option value="png32">PNG32</option>
                <option value="jpg">JPEG</option>
                <option value="gif">GIF</option>
              </select>
            </label>

            <label className="field" style={{ marginBottom: 12 }}>
              <span>DPI</span>
              <select
                value={layerConfig.dpi}
                onChange={e => setLayerConfig(prev => ({ ...prev, dpi: parseInt(e.target.value) }))}
              >
                <option value={96}>96 (Standard)</option>
                <option value={150}>150 (High)</option>
                <option value={300}>300 (Print)</option>
              </select>
            </label>

            <label className="field">
              <span>Transparency</span>
              <input
                type="checkbox"
                checked={layerConfig.transparent}
                onChange={e => setLayerConfig(prev => ({ ...prev, transparent: e.target.checked }))}
              />
            </label>
          </div>

          {/* Right column - layer definitions */}
          <div>
            <h4>Layer Definitions (SQL Filters)</h4>
            {[
              { id: '0', label: 'States', placeholder: 'e.g., POP2000 > 1000000' },
              { id: '1', label: 'Highways', placeholder: "e.g., ROUTE_NUM LIKE 'I-%'" },
              { id: '2', label: 'Cities', placeholder: 'e.g., POP_RANGE > 5' },
            ].map(({ id, label, placeholder }) => (
              <label className="field" key={id} style={{ marginBottom: 10 }}>
                <span>{label} (Layer {id})</span>
                <input
                  type="text"
                  placeholder={placeholder}
                  onChange={e => {
                    const val = e.target.value.trim();
                    setLayerConfig(prev => ({
                      ...prev,
                      layerDefs: val
                        ? { ...prev.layerDefs, [id]: val }
                        : Object.fromEntries(Object.entries(prev.layerDefs).filter(([k]) => k !== id)),
                    }));
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {identifyLoading && <div className="status loading">Identifying&hellip;</div>}

      {!dynamicService && !map && <div className="status loading">Initialising map&hellip;</div>}

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
                  .slice(0, 4)
                  .map(([k, v]) => (
                    <div key={k}><strong>{k}:</strong> {String(v)}</div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="tip-box">
        <strong>Tip:</strong> Use SQL WHERE clause syntax in layer definitions (e.g.,{' '}
        <code>POPULATION &gt; 500000</code>). Changes are applied on the next tile request.
      </div>
    </div>
  );
}
