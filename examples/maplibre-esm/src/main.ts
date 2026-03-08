import maplibregl from 'maplibre-gl';
import {
  DynamicMapService,
  TiledMapService,
  ImageService,
  FeatureService,
  VectorTileService,
  Query,
  Find,
  IdentifyFeatures,
} from 'esri-gl';

// ── URLs ──
const USA_MAP_SERVER = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
const TILED_MAP_SERVER = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer';
const IMAGE_SERVER = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer';
const FEATURE_SERVER = 'https://services6.arcgis.com/drBkxhK7nF7o7hKT/arcgis/rest/services/TN_Bridges/FeatureServer/0';
const VECTOR_TILE_SERVER = 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer';

// ── Helpers ──
const $ = (id: string) => document.getElementById(id)!;
const log = (msg: string) => {
  const el = $('log');
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.prepend(line);
};

const addBadge = (container: HTMLElement, text: string, cls: string) => {
  const badge = document.createElement('span');
  badge.className = `badge ${cls}`;
  badge.textContent = text;
  container.appendChild(badge);
  return badge;
};

// ── Map ──
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-86.5, 36.2],
  zoom: 7,
});

// ── State ──
const services: Record<string, { service: any; layerId?: string; active: boolean }> = {};
let queryResultsAdded = false;

map.on('load', async () => {
  log('Map loaded');
  const statusEl = $('status');
  const controlsEl = $('controls');

  // ────────────────────────────────────────
  // 1. DynamicMapService
  // ────────────────────────────────────────
  try {
    const dynamicSrc = 'esm-dynamic-source';
    const dynamicLayer = 'esm-dynamic-layer';
    const dynamic = new DynamicMapService(dynamicSrc, map as any, {
      url: USA_MAP_SERVER,
      layers: [2],
      transparent: true,
    });
    services.dynamic = { service: dynamic, layerId: dynamicLayer, active: true };

    map.addLayer({ id: dynamicLayer, type: 'raster', source: dynamicSrc });
    addBadge(statusEl, 'Dynamic OK', 'badge-ok');
    log('DynamicMapService created');
  } catch (e: any) {
    addBadge(statusEl, 'Dynamic ERR', 'badge-error');
    log(`DynamicMapService error: ${e.message}`);
  }

  // ────────────────────────────────────────
  // 2. TiledMapService
  // ────────────────────────────────────────
  try {
    const tiledSrc = 'esm-tiled-source';
    const tiledLayer = 'esm-tiled-layer';
    const tiled = new TiledMapService(tiledSrc, map as any, {
      url: TILED_MAP_SERVER,
    });
    services.tiled = { service: tiled, layerId: tiledLayer, active: false };

    map.addLayer({
      id: tiledLayer,
      type: 'raster',
      source: tiledSrc,
      layout: { visibility: 'none' },
    });
    addBadge(statusEl, 'Tiled OK', 'badge-ok');
    log('TiledMapService created');
  } catch (e: any) {
    addBadge(statusEl, 'Tiled ERR', 'badge-error');
    log(`TiledMapService error: ${e.message}`);
  }

  // ────────────────────────────────────────
  // 3. ImageService
  // ────────────────────────────────────────
  try {
    const imageSrc = 'esm-image-source';
    const imageLayer = 'esm-image-layer';
    const image = new ImageService(imageSrc, map as any, {
      url: IMAGE_SERVER,
    });
    services.image = { service: image, layerId: imageLayer, active: false };

    map.addLayer({
      id: imageLayer,
      type: 'raster',
      source: imageSrc,
      layout: { visibility: 'none' },
    });
    addBadge(statusEl, 'Image OK', 'badge-ok');
    log('ImageService created');
  } catch (e: any) {
    addBadge(statusEl, 'Image ERR', 'badge-error');
    log(`ImageService error: ${e.message}`);
  }

  // ────────────────────────────────────────
  // 4. FeatureService
  // ────────────────────────────────────────
  try {
    const featureSrc = 'esm-feature-source';
    const featureLayer = 'esm-feature-layer';
    const feature = new FeatureService(featureSrc, map as any, {
      url: FEATURE_SERVER,
      where: '1=1',
      outFields: '*',
    });
    services.feature = { service: feature, layerId: featureLayer, active: true };

    map.addLayer({
      id: featureLayer,
      type: 'circle',
      source: featureSrc,
      paint: {
        'circle-radius': 4,
        'circle-color': '#3b82f6',
        'circle-stroke-color': '#1e40af',
        'circle-stroke-width': 1,
      },
    });
    addBadge(statusEl, 'Feature OK', 'badge-ok');
    log('FeatureService created (TN Bridges)');
  } catch (e: any) {
    addBadge(statusEl, 'Feature ERR', 'badge-error');
    log(`FeatureService error: ${e.message}`);
  }

  // ────────────────────────────────────────
  // 5. VectorTileService
  // ────────────────────────────────────────
  try {
    const vtSrc = 'esm-vector-tile-source';
    const vt = new VectorTileService(vtSrc, map as any, {
      url: VECTOR_TILE_SERVER,
    });
    services.vectorTile = { service: vt, active: false };
    addBadge(statusEl, 'VectorTile OK', 'badge-ok');
    log('VectorTileService created');
  } catch (e: any) {
    addBadge(statusEl, 'VectorTile ERR', 'badge-error');
    log(`VectorTileService error: ${e.message}`);
  }

  // ────────────────────────────────────────
  // Layer Toggle Controls
  // ────────────────────────────────────────
  const toggles: Array<{ key: string; label: string }> = [
    { key: 'dynamic', label: 'Dynamic (USA states)' },
    { key: 'tiled', label: 'Tiled (World Topo)' },
    { key: 'image', label: 'Image (Land Cover)' },
    { key: 'feature', label: 'Feature (TN Bridges)' },
  ];

  const toggleTitle = document.createElement('h2');
  toggleTitle.textContent = 'Layer Toggles';
  controlsEl.appendChild(toggleTitle);

  toggles.forEach(({ key, label }) => {
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = services[key]?.active ?? false;
    cb.addEventListener('change', () => {
      const entry = services[key];
      if (!entry?.layerId) return;
      const vis = cb.checked ? 'visible' : 'none';
      map.setLayoutProperty(entry.layerId, 'visibility', vis);
      entry.active = cb.checked;
      log(`${label}: ${cb.checked ? 'shown' : 'hidden'}`);
    });
    lbl.appendChild(cb);
    lbl.append(` ${label}`);
    controlsEl.appendChild(lbl);
  });

  // ────────────────────────────────────────
  // Task Controls
  // ────────────────────────────────────────
  const taskTitle = document.createElement('h2');
  taskTitle.textContent = 'Tasks';
  controlsEl.appendChild(taskTitle);

  // Query button
  const queryBtn = document.createElement('button');
  queryBtn.className = 'btn btn-primary';
  queryBtn.textContent = 'Query: States pop > 1M';
  queryBtn.addEventListener('click', async () => {
    log('Running Query task...');
    try {
      const q = new Query({
        url: `${USA_MAP_SERVER}/2`,
        where: 'pop2000 > 1000000',
        outFields: 'state_name,pop2000',
        returnGeometry: true,
      });
      const results = await q.run();
      log(`Query returned ${results.features.length} features`);

      // Show results on map
      if (queryResultsAdded) {
        if (map.getLayer('esm-query-results')) map.removeLayer('esm-query-results');
        if (map.getSource('esm-query-src')) map.removeSource('esm-query-src');
      }
      map.addSource('esm-query-src', { type: 'geojson', data: results });
      map.addLayer({
        id: 'esm-query-results',
        type: 'fill',
        source: 'esm-query-src',
        paint: { 'fill-color': '#f97316', 'fill-opacity': 0.35, 'fill-outline-color': '#c2410c' },
      });
      queryResultsAdded = true;
    } catch (e: any) {
      log(`Query error: ${e.message}`);
    }
  });
  controlsEl.appendChild(queryBtn);

  // Find button
  const findBtn = document.createElement('button');
  findBtn.className = 'btn btn-primary';
  findBtn.textContent = 'Find: "CA" in states';
  findBtn.addEventListener('click', async () => {
    log('Running Find task...');
    try {
      const f = new Find({
        url: USA_MAP_SERVER,
        searchText: 'CA',
        searchFields: ['STATE_ABBR'],
        layers: [2],
        contains: true,
        returnGeometry: true,
      });
      const results = await f.run();
      log(`Find returned ${results.features.length} features`);
      results.features.forEach((feat) => {
        const name = feat.properties?.state_name || feat.properties?.STATE_NAME || 'unknown';
        log(`  Found: ${name}`);
      });
    } catch (e: any) {
      log(`Find error: ${e.message}`);
    }
  });
  controlsEl.appendChild(findBtn);

  // Identify button
  const identifyBtn = document.createElement('button');
  identifyBtn.className = 'btn btn-primary';
  identifyBtn.textContent = 'Identify at map center';
  identifyBtn.addEventListener('click', async () => {
    const center = map.getCenter();
    log(`Running Identify at ${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}...`);
    try {
      const identify = new IdentifyFeatures(USA_MAP_SERVER);
      const results = await identify
        .at({ lng: center.lng, lat: center.lat })
        .on(map as any)
        .layers('all')
        .tolerance(5)
        .run();
      log(`Identify returned ${results.features.length} features`);
      results.features.slice(0, 3).forEach((feat) => {
        const layer = feat.properties?.layerName || 'unknown';
        log(`  Layer: ${layer}`);
      });
    } catch (e: any) {
      log(`Identify error: ${e.message}`);
    }
  });
  controlsEl.appendChild(identifyBtn);

  // Clear query results
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn';
  clearBtn.textContent = 'Clear query results';
  clearBtn.addEventListener('click', () => {
    if (map.getLayer('esm-query-results')) map.removeLayer('esm-query-results');
    if (map.getSource('esm-query-src')) map.removeSource('esm-query-src');
    queryResultsAdded = false;
    log('Cleared query results');
  });
  controlsEl.appendChild(clearBtn);
});
