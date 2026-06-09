// Live smoke test for esri-gl Portal resolution against public ArcGIS Online.
// Run: node scripts/portal-live-test.mjs   (requires network)
import {
  searchPortalItems,
  serviceFromPortalItem,
  servicesFromWebMap,
  SearchQueryBuilder,
} from '../dist/index.js';

// Services kick off background metadata fetches in their constructors; some
// "public" items point at token-required services. Those async rejections are
// the service's concern (surfaced via sourceReady), not Portal resolution, so
// don't let them crash this smoke test.
process.on('unhandledRejection', () => {});

const noop = () => undefined;
// Minimal MapLibre/Mapbox-like stub sufficient for the service constructors.
const mockMap = () => ({
  getSource: () => undefined,
  addSource: noop,
  removeSource: noop,
  getStyle: () => ({ layers: [] }),
  getLayer: () => undefined,
  addLayer: noop,
  removeLayer: noop,
  on: noop,
  off: noop,
  getZoom: () => 4,
  getBounds: () => ({ toArray: () => [[-180, -85], [180, 85]] }),
  getCanvas: () => ({ width: 800, height: 600 }),
  setStyle: noop,
});

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✅' : '❌'} ${msg}`);
  if (!cond) failures++;
};

async function main() {
  // 1) searchPortalItems — basic connectivity + correct shape
  const search = await searchPortalItems(
    new SearchQueryBuilder().match('Feature Service').in('type').and().match('public').in('access')
  );
  ok(search && Array.isArray(search.results), `searchPortalItems returned results array (total=${search?.total})`);

  // 2) serviceFromPortalItem — resolve a real single-layer item per type
  const TYPE_KINDS = [
    ['Feature Service', 'feature'],
    ['Map Service', null], // dynamic or tiled
    ['Image Service', 'image'],
    ['Vector Tile Service', 'vector-tile'],
  ];
  for (const [type, expectedKind] of TYPE_KINDS) {
    try {
      const res = await searchPortalItems(`type:"${type}" AND access:public`);
      const item = (res.results || []).find(i => i.url);
      if (!item) {
        ok(false, `no public ${type} item with a url found (skipping)`);
        continue;
      }
      const out = await serviceFromPortalItem(`src-${item.id}`, mockMap(), item.id);
      const kindOk = expectedKind ? out.kind === expectedKind : ['dynamic', 'tiled'].includes(out.kind);
      ok(
        kindOk && typeof out.url === 'string' && out.url.length > 0 && !!out.service,
        `${type} "${item.title}" → kind=${out.kind}, url=${out.url}`
      );
    } catch (e) {
      ok(false, `serviceFromPortalItem(${type}) threw: ${e.message}`);
    }
  }

  // 3) servicesFromWebMap — find a public Web Map that yields operational layers
  try {
    const res = await searchPortalItems('type:"Web Map" AND access:public');
    let resolved = null;
    for (const item of (res.results || []).slice(0, 8)) {
      const layers = await servicesFromWebMap(mockMap(), item.id);
      if (layers.length > 0) {
        resolved = { item, layers };
        break;
      }
    }
    if (resolved) {
      ok(
        true,
        `Web Map "${resolved.item.title}" → ${resolved.layers.length} layers: ` +
          resolved.layers.map(l => `${l.title ?? l.sourceId}[${l.kind}]`).join(', ')
      );
    } else {
      ok(false, 'no public Web Map yielded supported operational layers in the first 8 results');
    }
  } catch (e) {
    ok(false, `servicesFromWebMap threw: ${e.message}`);
  }

  console.log(failures === 0 ? '\nALL PORTAL CHECKS PASSED' : `\n${failures} PORTAL CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
