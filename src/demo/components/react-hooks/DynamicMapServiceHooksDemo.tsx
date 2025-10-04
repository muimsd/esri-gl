import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useDynamicMapService, useIdentifyFeatures } from '../../../react';
import {
  DEMO_CONTAINER_STYLE,
  DEMO_SIDEBAR_STYLE,
  DEMO_SECTION_TITLE_STYLE,
  DEMO_FOOTER_STYLE,
  DEMO_MAP_CONTAINER_STYLE,
  createBadgeStyle,
} from '../shared/styles';
import { useMapLibreDemo } from './useMapLibreDemo';

const SOURCE_ID = 'hooks-dynamic-source';
const LAYER_ID = 'hooks-dynamic-layer';
const DYNAMIC_SERVICE_URL =
  'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';

const layerOptions = [
  { id: 0, name: 'Cities' },
  { id: 1, name: 'Highways' },
  { id: 2, name: 'States' },
];

const labelOptions = [
  { value: 'none', label: 'No Labels' },
  { value: 'city_names', label: 'City Names', field: 'areaname', layerId: 0 },
  { value: 'city_state', label: 'City State', field: 'st', layerId: 0 },
  { value: 'highway_route', label: 'Highway Route', field: 'route', layerId: 1 },
  { value: 'state_name', label: 'State Name', field: 'state_name', layerId: 2 },
  { value: 'state_population', label: 'Population', field: 'pop2000', layerId: 2 },
];

type IdentifyState =
  | { status: 'idle'; message: string }
  | { status: 'loading' }
  | { status: 'success'; html: string }
  | { status: 'error'; message: string };

type StatisticsState =
  | { status: 'idle'; summary: string }
  | { status: 'loading' }
  | { status: 'success'; summary: string }
  | { status: 'error'; message: string };

const popupContentFromFeature = (feature: GeoJSON.Feature | undefined) => {
  if (!feature || !feature.properties) {
    return '<div>No feature attributes available at this location.</div>';
  }

  const entries = Object.entries(feature.properties).filter(([, value]) =>
    ['string', 'number', 'boolean'].includes(typeof value)
  );
  if (!entries.length) {
    return '<div>No displayable attributes available.</div>';
  }

  const rows = entries
    .slice(0, 8)
    .map(
      ([key, value]) =>
        `<div style="display:flex; justify-content:space-between; gap:12px;"><strong>${
          key ?? '—'
        }</strong><span>${value ?? '—'}</span></div>`
    )
    .join('');

  return `<div style="max-width:260px; font-size:13px; line-height:1.4;">${rows}</div>`;
};

const DynamicMapServiceHooksDemo: React.FC = () => {
  const { containerRef, mapRef, mapReady, esriMap } = useMapLibreDemo({
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm-tiles',
        },
      ],
    },
    center: [-95.7129, 37.0902],
    zoom: 4,
  });

  const [selectedLayers, setSelectedLayers] = useState<number[]>([0, 1, 2]);
  const [styleApplied, setStyleApplied] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [labelsApplied, setLabelsApplied] = useState(false);
  const [selectedLabelType, setSelectedLabelType] = useState<string>('none');

  const [identifyState, setIdentifyState] = useState<IdentifyState>({
    status: 'idle',
    message: 'Click the map to identify features.',
  });
  const [statisticsState, setStatisticsState] = useState<StatisticsState>({
    status: 'idle',
    summary: 'Click "Layer Statistics" to fetch state population metrics.',
  });

  const popupRef = useRef<maplibregl.Popup | null>(null);

  const dynamicOptions = useMemo(
    () => ({
      url: DYNAMIC_SERVICE_URL,
      layers: selectedLayers,
      format: 'png32',
      transparent: true,
    }),
    [selectedLayers]
  );

  const {
    service,
    loading: serviceLoading,
    error: serviceError,
    reload,
  } = useDynamicMapService({
    sourceId: SOURCE_ID,
    map: esriMap,
    options: dynamicOptions,
  });

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    const eventedMap = map as unknown as {
      loaded?: () => boolean;
      isStyleLoaded?: () => boolean;
      on?: (type: string, listener: (...args: unknown[]) => void) => void;
      off?: (type: string, listener: (...args: unknown[]) => void) => void;
    };
    const layerApi = map as unknown as {
      getLayer?: (id: string) => unknown;
      addLayer?: (layer: unknown) => void;
      removeLayer?: (id: string) => void;
    };

    const internalMap = map as unknown as { _listeners?: unknown; style?: unknown };

    if (
      typeof layerApi.addLayer !== 'function' ||
      typeof layerApi.removeLayer !== 'function' ||
      typeof layerApi.getLayer !== 'function' ||
      !internalMap ||
      !internalMap.style
    ) {
      return;
    }

    const addLayer = layerApi.addLayer.bind(layerApi) as typeof layerApi.addLayer;
    const removeLayer = layerApi.removeLayer.bind(layerApi) as typeof layerApi.removeLayer;
    const getLayer = layerApi.getLayer.bind(layerApi) as typeof layerApi.getLayer;
    const mapOn = typeof eventedMap.on === 'function' ? eventedMap.on.bind(eventedMap) : undefined;
    const mapOff =
      typeof eventedMap.off === 'function' ? eventedMap.off.bind(eventedMap) : undefined;

    if (!mapOn || !mapOff || !(internalMap as { _listeners?: unknown })._listeners) {
      return;
    }

    let ensureLayerTimeout: number | null = null;

    const safeHasLayer = () => {
      try {
        return Boolean(getLayer(LAYER_ID));
      } catch {
        return false;
      }
    };

    const scheduleEnsureLayerRetry = () => {
      if (ensureLayerTimeout !== null) return;
      ensureLayerTimeout = window.setTimeout(() => {
        ensureLayerTimeout = null;
        safeEnsureLayer();
      }, 120);
    };

    const safeEnsureLayer = () => {
      if (safeHasLayer()) return;

      // Ensure source exists before adding layer
      const sourceApi = map as unknown as { getSource?: (id: string) => unknown };
      if (!sourceApi.getSource?.(SOURCE_ID)) {
        scheduleEnsureLayerRetry();
        return;
      }

      try {
        addLayer({
          id: LAYER_ID,
          type: 'raster',
          source: SOURCE_ID,
          layout: { visibility: 'visible' },
        });
      } catch (error) {
        scheduleEnsureLayerRetry();
        const message = error instanceof Error ? (error.message ?? '') : '';
        if (!message.includes('_lazyInitEmptyStyle')) {
          console.warn('Dynamic service demo failed to add layer', error);
        }
      }
    };

    const safeRemoveLayer = () => {
      if (ensureLayerTimeout !== null) {
        window.clearTimeout(ensureLayerTimeout);
        ensureLayerTimeout = null;
      }
      if (!safeHasLayer()) return;
      try {
        removeLayer(LAYER_ID);
      } catch (error) {
        console.warn('Dynamic service demo failed to remove layer', error);
      }
    };

    const isMapLoaded = eventedMap.isStyleLoaded?.() ?? eventedMap.loaded?.() ?? false;
    const onLoad = () => {
      safeEnsureLayer();
      try {
        mapOff('load', onLoad);
      } catch (error) {
        console.warn('Dynamic service demo failed to unbind load listener', error);
      }
    };

    let loadBound = false;
    if (isMapLoaded) {
      safeEnsureLayer();
    } else {
      try {
        mapOn('load', onLoad);
        loadBound = true;
      } catch (error) {
        console.warn('Dynamic service demo failed to bind load listener', error);
      }
    }

    return () => {
      if (loadBound) {
        try {
          mapOff('load', onLoad);
        } catch (error) {
          console.warn('Dynamic service demo failed to unbind load listener', error);
        }
      }
      safeRemoveLayer();
    };
  }, [mapReady, service]);

  useEffect(() => {
    if (!service) return;
    try {
      service.setLayers(selectedLayers);
    } catch (error) {
      // Ignore AbortError and other transient errors from rapid layer updates
      const errorString = String(error).toLowerCase();
      const isTransient =
        errorString.includes('abort') ||
        errorString.includes('network') ||
        errorString.includes('fetch') ||
        (error instanceof Error && error.name === 'AbortError') ||
        (error as { name?: string })?.name === 'AbortError';

      if (!isTransient) {
        console.warn('Failed to update dynamic layers', error);
      }
    }
  }, [service, selectedLayers]);

  const {
    identify,
    loading: identifyLoading,
    error: identifyError,
  } = useIdentifyFeatures({
    url: DYNAMIC_SERVICE_URL,
    tolerance: 5,
    returnGeometry: false,
  });

  useEffect(() => {
    if (!mapReady || !mapRef.current || !service) return;

    const map = mapRef.current as maplibregl.Map;
    const eventMap = map as unknown as {
      on?: (type: string, listener: (...args: unknown[]) => void) => void;
      off?: (type: string, listener: (...args: unknown[]) => void) => void;
    };
    const internalMap = map as unknown as { _listeners?: unknown };
    const mapOn = typeof eventMap.on === 'function' ? eventMap.on.bind(eventMap) : undefined;
    const mapOff = typeof eventMap.off === 'function' ? eventMap.off.bind(eventMap) : undefined;

    if (!mapOn || !mapOff || !(internalMap as { _listeners?: unknown })._listeners) {
      return;
    }

    const handleClick = async (event: { lngLat: { lng: number; lat: number } }) => {
      if (popupRef.current) {
        const possible = popupRef.current as unknown as { remove?: () => void };
        possible.remove?.();
        popupRef.current = null;
      }
      setIdentifyState({ status: 'loading' });

      const layersParam = selectedLayers.length ? `visible:${selectedLayers.join(',')}` : 'all';

      try {
        const results = await identify(
          { lng: event.lngLat.lng, lat: event.lngLat.lat },
          { layers: layersParam, tolerance: 5 }
        );

        const feature = results?.features?.[0];
        const html = popupContentFromFeature(feature);

        const popup = new maplibregl.Popup({ closeOnMove: true });
        (
          popup as unknown as { setLngLat: (lngLat: { lng: number; lat: number }) => unknown }
        ).setLngLat(event.lngLat);
        (popup as unknown as { setHTML: (html: string) => unknown }).setHTML(html);
        (popup as unknown as { addTo: (target: unknown) => unknown }).addTo(map);
        popupRef.current = popup;

        if (feature) {
          setIdentifyState({ status: 'success', html });
        } else {
          setIdentifyState({
            status: 'idle',
            message: 'No features found. Try another location.',
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Identify failed';
        setIdentifyState({ status: 'error', message });
      }
    };

    let clickBound = false;
    try {
      mapOn('click', handleClick as unknown as (...args: unknown[]) => void);
      clickBound = true;
    } catch (error) {
      console.warn('Dynamic service demo failed to bind click listener', error);
    }
    return () => {
      if (clickBound) {
        try {
          mapOff('click', handleClick as unknown as (...args: unknown[]) => void);
        } catch (error) {
          console.warn('Dynamic service demo failed to unbind click listener', error);
        }
      }
      if (popupRef.current) {
        const possible = popupRef.current as unknown as { remove?: () => void };
        possible.remove?.();
        popupRef.current = null;
      }
    };
  }, [mapReady, service, identify, selectedLayers]);

  const applyStatesStyle = useCallback(() => {
    if (!service) return;
    service.setLayerRenderer(2, {
      type: 'simple',
      symbol: {
        type: 'esriSFS',
        style: 'esriSFSSolid',
        color: [255, 200, 100, 120],
        outline: {
          type: 'esriSLS',
          style: 'esriSLSSolid',
          color: [255, 140, 0, 255],
          width: 2,
        },
      },
    });
    setStyleApplied(true);
  }, [service]);

  const resetServerStyle = useCallback(() => {
    if (!service) return;
    service.setDynamicLayers(false);
    service.setLayerDefinition(2, '');
    setStyleApplied(false);
    setFilterApplied(false);
  }, [service]);

  const applyPacificStatesFilter = useCallback(() => {
    if (!service) return;
    service.setLayerFilter(2, {
      field: 'sub_region',
      op: '=',
      value: 'Pacific',
    });
    setFilterApplied(true);
  }, [service]);

  const applyPopulationFilter = useCallback(() => {
    if (!service) return;
    service.setLayerFilter(2, {
      field: 'pop2000',
      op: '>',
      value: 5000000,
    });
    setFilterApplied(true);
  }, [service]);

  const clearFilter = useCallback(() => {
    if (!service) return;
    service.setLayerDefinition(2, '');
    setFilterApplied(false);
  }, [service]);

  const applyLabels = useCallback(
    (value: string) => {
      if (!service) return;

      setSelectedLabelType(value);
      setLabelsApplied(value !== 'none');

      if (value === 'none') {
        [0, 1, 2].forEach(layerId => service.setLayerLabelsVisible(layerId, false));
        return;
      }

      const option = labelOptions.find(opt => opt.value === value);
      if (!option) return;

      const layerId = option.layerId ?? 2;
      const labelExpression = `[${option.field}]`;

      service.setLayerLabels(layerId, {
        labelExpression,
        symbol: {
          type: 'esriTS',
          color: [255, 255, 255, 255],
          backgroundColor: [0, 0, 0, 160],
          borderLineColor: [0, 0, 0, 255],
          borderLineSize: 1,
          font: {
            family: 'Arial',
            size: 12,
            style: 'normal',
            weight: 'bold',
          },
          horizontalAlignment: 'center',
          verticalAlignment: 'middle',
        },
      });

      service.setLayerLabelsVisible(layerId, true);
      if (!selectedLayers.includes(layerId)) {
        setSelectedLayers(prev => [...prev, layerId].sort((a, b) => a - b));
      }
    },
    [service, selectedLayers]
  );

  const fetchStatistics = useCallback(async () => {
    if (!service) return;
    setStatisticsState({ status: 'loading' });

    try {
      const stats = await service.getLayerStatistics(2, [
        {
          statisticType: 'count',
          onStatisticField: 'pop2000',
          outStatisticFieldName: 'state_count',
        },
        {
          statisticType: 'sum',
          onStatisticField: 'pop2000',
          outStatisticFieldName: 'total_population',
        },
        {
          statisticType: 'avg',
          onStatisticField: 'pop2000',
          outStatisticFieldName: 'avg_population',
        },
      ]);

      if (!stats?.length) {
        setStatisticsState({
          status: 'idle',
          summary: 'No statistics returned. Try again.',
        });
        return;
      }

      const attributes = (stats[0]?.attributes ?? {}) as Record<string, unknown>;
      const formatNumber = (value: unknown) => {
        if (typeof value === 'number') return value.toLocaleString();
        if (typeof value === 'string' && !Number.isNaN(Number(value))) {
          return Number(value).toLocaleString();
        }
        return value ?? '—';
      };

      const summary = `States: ${formatNumber(attributes.state_count)} | Total pop: ${formatNumber(attributes.total_population)} | Avg pop: ${formatNumber(attributes.avg_population)}`;
      setStatisticsState({ status: 'success', summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch statistics';
      setStatisticsState({ status: 'error', message });
    }
  }, [service]);

  const handleLayerToggle = (layerId: number) => {
    setSelectedLayers(prev => {
      const exists = prev.includes(layerId);
      if (exists) {
        if (prev.length === 1) {
          return prev; // must keep at least one layer visible
        }
        return prev.filter(id => id !== layerId);
      }
      return [...prev, layerId].sort((a, b) => a - b);
    });
  };

  const renderIdentify = () => {
    switch (identifyState.status) {
      case 'idle':
        return <p style={{ margin: 0, color: '#4b5563' }}>{identifyState.message}</p>;
      case 'loading':
        return <p style={{ margin: 0, color: '#2563eb' }}>Identifying feature…</p>;
      case 'success':
        return (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: identifyState.html }}
          />
        );
      case 'error':
        return <p style={{ margin: 0, color: '#b91c1c' }}>{identifyState.message}</p>;
      default:
        return null;
    }
  };

  const renderStatistics = () => {
    switch (statisticsState.status) {
      case 'idle':
        return <p style={{ margin: 0, color: '#4b5563' }}>{statisticsState.summary}</p>;
      case 'loading':
        return <p style={{ margin: 0, color: '#2563eb' }}>Calculating statistics…</p>;
      case 'success':
        return <p style={{ margin: 0, color: '#047857' }}>{statisticsState.summary}</p>;
      case 'error':
        return <p style={{ margin: 0, color: '#b91c1c' }}>{statisticsState.message}</p>;
      default:
        return null;
    }
  };

  return (
    <div style={DEMO_CONTAINER_STYLE}>
      <aside style={DEMO_SIDEBAR_STYLE}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Dynamic Map Service (Hooks)</h2>
          <p style={{ margin: 0, color: '#4b5563' }}>
            Lifecycle-managed Dynamic Map Service with identify, filters, labels, and server-side
            statistics powered by esri-gl React hooks.
          </p>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Service Status</h3>
          {serviceLoading && (
            <span style={createBadgeStyle('#fde68a', '#78350f')}>Loading service…</span>
          )}
          {serviceError && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>
              Error: {serviceError.message}
            </span>
          )}
          {!serviceLoading && !serviceError && service && (
            <span style={createBadgeStyle('#bbf7d0', '#064e3b')}>Dynamic service active</span>
          )}
          <button
            onClick={reload}
            disabled={serviceLoading}
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              cursor: serviceLoading ? 'not-allowed' : 'pointer',
            }}
          >
            Reload Service
          </button>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Visible Sublayers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {layerOptions.map(layer => (
              <label key={layer.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedLayers.includes(layer.id)}
                  onChange={() => handleLayerToggle(layer.id)}
                />
                {layer.name}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Styling</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={applyStatesStyle}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              Highlight States
            </button>
            <button
              onClick={resetServerStyle}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              Reset Style
            </button>
          </div>
          {styleApplied && (
            <p style={{ margin: '8px 0 0', color: '#047857' }}>Custom renderer applied.</p>
          )}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Filters</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={applyPacificStatesFilter}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              Pacific States
            </button>
            <button
              onClick={applyPopulationFilter}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              Pop {`>`} 5M
            </button>
            <button
              onClick={clearFilter}
              disabled={!filterApplied}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                opacity: filterApplied ? 1 : 0.6,
              }}
            >
              Clear Filter
            </button>
          </div>
          {filterApplied && <p style={{ margin: '8px 0 0', color: '#7c3aed' }}>Filter active.</p>}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Labels</h3>
          <select
            value={selectedLabelType}
            onChange={event => applyLabels(event.target.value)}
            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            {labelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {labelsApplied && <p style={{ margin: '8px 0 0', color: '#1d4ed8' }}>Labels enabled.</p>}
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Layer Statistics</h3>
          <button
            onClick={fetchStatistics}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          >
            Calculate
          </button>
          <div style={{ marginTop: '8px' }}>{renderStatistics()}</div>
        </div>

        <div>
          <h3 style={DEMO_SECTION_TITLE_STYLE}>Identify</h3>
          {identifyLoading && <span style={createBadgeStyle('#fef3c7', '#92400e')}>Locating…</span>}
          {identifyError && (
            <span style={createBadgeStyle('#fecaca', '#7f1d1d')}>
              Identify error: {identifyError.message}
            </span>
          )}
          <div style={{ marginTop: '8px' }}>{renderIdentify()}</div>
        </div>

        <div style={DEMO_FOOTER_STYLE}>
          USA MapServer sublayers 0, 1, 2 with dynamic styling and identify workflows.
        </div>
      </aside>

      <div style={DEMO_MAP_CONTAINER_STYLE}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
};

export default DynamicMapServiceHooksDemo;
