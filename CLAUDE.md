# CLAUDE.md

Guidance for working in this repo. Keep it short and durable — record conventions, not changelogs.

## What this is

`esri-gl` is a TypeScript library that bridges Esri ArcGIS REST services with **MapLibre GL JS**
and **Mapbox GL JS**, following Esri Leaflet's architecture. It is published to npm with three
entry points:

| Import | Source entry | Contents |
|--------|--------------|----------|
| `esri-gl` | `src/index.ts` | Services, Tasks, Portal resolution, request/auth helpers |
| `esri-gl/react` | `src/react.ts` | React hooks |
| `esri-gl/react-map-gl` | `src/react-map-gl.ts` | react-map-gl components |

## Layout

- `src/Services/` — `Service` (base), `MapService`, `DynamicMapService`, `TiledMapService`,
  `ImageService`, `FeatureService`, `VectorTileService`, `VectorBasemapStyle`. Services create a
  MapLibre/Mapbox GL source and manage its lifecycle. Universal constructor:
  `new ServiceClass(sourceId, map, esriOptions, sourceOptions?)`.
- `src/Tasks/` — `Task` (base), `Query`, `Find`, `IdentifyFeatures`, `IdentifyImage`. Chainable,
  Esri-Leaflet-style operations.
- `src/Portal/` — `serviceFromPortalItem()` / `servicesFromWebMap()` resolve a portal item id or
  Web Map to services.
- `src/request.ts` — the request + auth layer (see below).
- `src/esri-rest.ts` — curated re-exports of `@esri/arcgis-rest-*` types (geometry, feature,
  query/edit/layer, basemap-session) so consumers get them from `esri-gl`. Add new
  consumer-facing arcgis-rest types here, not ad-hoc.
- `src/react/`, `src/react-map-gl/` — framework integrations. `src/types.ts` — shared types.
- Path alias: `@/*` → `src/*` (configured in tsconfig, jest, and rollup).

## Conventions

- **All ArcGIS REST calls go through `src/request.ts`.** Use `esriRequest()` (a thin wrapper over
  `@esri/arcgis-rest-request`'s `request()`) — do **not** hand-roll `fetch` for REST endpoints.
  The exception is raster/vector **tile and image-export URL builders**
  (`/export`, `/exportImage`, `/tile/{z}/{y}/{x}`), which stay URL templates consumed by the GL
  renderer. Prefer a **typed helper** when one exists over a generic `esriRequest`:
  `@esri/arcgis-rest-feature-service` (`getLayer`, `getAllLayersAndTables`, `queryFeatures`,
  `queryRelated`, `decodeValues`, feature CRUD) and `@esri/arcgis-rest-portal` (`getItem`,
  `getItemData`, `searchItems`). Fall back to `esriRequest` only for endpoints without a helper
  (`/identify`, `/find`, `/legend`, vector-tile style docs).
- **Authentication** is uniform: every service/task accepts `token`, `apiKey`, or `authentication`
  (an `IAuthenticationManager`), precedence `authentication` → `apiKey` → `token`. Normalize with
  `resolveAuthentication()`; never inject tokens as raw query params. `apiKey` is sent as the
  `token` parameter (via `ApiKeyManager`), not an `X-Esri-Authorization` header.
- Errors surfaced from requests are `ArcGISRequestError` (numeric `.code`; message prefixed with
  the code for ArcGIS service errors).
- Match the surrounding code's style; Prettier + ESLint are enforced. `any` is discouraged
  (warns, doesn't fail).

## Commands

```bash
npm run validate     # type-check + lint + prettier:check + tests (the full gate)
npm run test         # jest (ts-jest, jsdom)
npm run type-check   # tsc --noEmit
npm run lint         # eslint (0 errors required; warnings allowed)
npm run build        # rollup: ESM + UMD + .d.ts
npm run dev          # demo dev server (vite)
npm run build:docs   # build the Docusaurus site in docs/
```

The Husky pre-commit hook runs the full validate gate.

## Build & test notes

- Rollup externalizes `@esri/*` (and other runtime deps) in the **ESM** and **`.d.ts`** builds, but
  **bundles** them in the **UMD/CDN** build (`dist/index.umd.js`). If you add a runtime dependency,
  update `commonExternal` in `rollup.config.js`.
- Jest stubs the ESM-only `pbf` package via `moduleNameMapper` (`src/tests/__mocks__/pbf.js`) — it
  is pulled in transitively by `@esri/arcgis-rest-feature-service` and would otherwise break the
  loader. Tests mock `global.fetch`; `@esri/arcgis-rest-request` parses by `params.f`, so
  `{ ok, json }` mocks work, but error-path mocks must provide a `json()` method.

## Docs

Docusaurus site in `docs/` (`onBrokenLinks: 'throw'`). Service/task option tables and the
`docs/docs/guides/` pages (Authentication, Portal Items) should stay in sync with the option
types and the `src/Portal` / `src/request` APIs.
