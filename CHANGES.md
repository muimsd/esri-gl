Change Log
==========

### Unreleased

#### Internal Refactor — no public API changes
- **react-map-gl layer components**: Extracted the "wait for map style load" effect into a shared `useMapLoaded` hook used by all five layer components. `EsriDynamicLayer`, `EsriTiledLayer`, and `EsriImageLayer` now share a `useRasterLayer` hook for service creation + raster-layer lifecycle.
- **react-map-gl hooks**: `useEsriMapboxLayer` and `useEsriMaplibreLayer` now delegate to a shared `createEsriLayerHooks` factory — they differed only by which `useMap` implementation they imported.
- **Services**: Added `removeMapSource` and `appendTokenIfExists` helpers in `utils.ts`; `DynamicMapService`, `TiledMapService`, `ImageService`, `VectorTileService`, and `FeatureService` `remove()` methods now share one implementation instead of five near-duplicates.
- **Task hooks**: `useFind`, `useQuery`, `useIdentifyFeatures`, `useIdentifyImage`, and `useFeatureEditing` now share a `useAsyncOperation` hook that owns the loading/error state machine instead of each hook re-implementing the same `try/catch/finally` dance.
- Net diff: **–430 lines** across layer components, services, and task hooks; 733/733 tests still pass; lint errors 1 → 0.

### v1.0.0
**Stable Release**

#### Highlights
- **First stable release** — APIs are now considered production-ready
- **Three entry points**: `esri-gl` (core), `esri-gl/react` (hooks), `esri-gl/react-map-gl` (components)
- **727 tests** across 31 test suites, all passing

#### New in v0.10.0 → v1.0.0
- **EsriVectorTileLayer fix**: react-map-gl component now properly fetches and applies the full vector tile style document including all layers, paint, layout, filters, and zoom constraints
- **EsriFeatureLayer enhancements**: Added `type` prop (`circle`, `fill`, `line`, `symbol`, `heatmap`) and `paint`/`layout` props for react-map-gl component
- **Query & Find demos**: Added react-map-gl demo components for Query and Find tasks
- **Service cleanup guards**: All service `remove()` methods now safely handle destroyed map styles
- **Example projects**: Three new standalone examples under `examples/` using esri-gl from npm:
  - `maplibre-esm` — vanilla MapLibre GL JS with all services and tasks
  - `maplibre-react-hooks` — React hooks with all service and task hooks
  - `maplibre-react-map-gl` — react-map-gl with all layer components and tasks

#### Bug Fixes
- Fixed spurious console warning when source not yet in style caches
- Fixed `useIdentifyFeatures` not passing map reference for mapExtent
- Guarded `map.getLayer` cleanup calls against destroyed map style

### v0.9.0
**ArcGIS Online (AGOL) Support & Feature Editing**

#### Critical Bug Fixes
- **AGOL JSON Error Detection**: Services and Tasks now properly detect ArcGIS error responses returned with HTTP 200 status (e.g., `{error: {code, message, details}}`)
- **Auth Queue Fix**: Prevented double-callback in `_createServiceCallback` when authentication errors occur — auth errors now correctly queue and replay requests
- **Token in Tile URLs**: DynamicMapService, TiledMapService, and ImageService now append authentication tokens to tile request URLs
- **Secure Metadata Fetches**: `getServiceDetails()` now accepts an optional `token` parameter for fetching metadata from secured services

#### New Features
- **Feature Editing**: FeatureService now supports `addFeatures()`, `updateFeatures()`, `deleteFeatures()`, and `applyEdits()` methods
- **Attachments**: FeatureService now supports `queryAttachments()`, `addAttachment()`, and `deleteAttachments()` methods
- **Query Pagination**: New `Query.runAll()` method automatically paginates through all results using `exceededTransferLimit`
- **GlobalId Support**: `Query.ids()` now returns globalIds when objectIds are not available
- **API Key Auth**: Services support `apiKey` option for `X-Esri-Authorization: Bearer` header authentication
- **Custom Basemap Styles**: VectorBasemapStyle supports `itemId` for loading custom portal item styles
- **Token Management**: `setToken()` method added to DynamicMapService, TiledMapService, and ImageService
- **Auth Events**: FeatureService supports `on('authenticationrequired', cb)` / `off()` event listeners

#### React Hooks
- **useFeatureEditing**: New hook for feature editing operations (add, update, delete, applyEdits)
- **useQuery**: Added `queryAll` callback for automatic query pagination

#### Types
- Added `EditResult`, `ApplyEditsResult`, `AttachmentInfo`, `AGOLServiceError`, `PaginatedFeatureCollection` interfaces
- Added AGOL capability flags to `ServiceMetadata` and `LayerMetadata`
- Added `apiKey` option to `FeatureServiceOptions`

#### Tests
- 717 tests (up from 693), all passing
- 24 new tests covering AGOL error handling, token support, editing, pagination, and attachments

### v0.9.0-alpha
**🎉 First Stable Release**
- **Stable Release**: Graduated from alpha to stable release
- **Code Quality**: 92.94% test coverage with 651 comprehensive tests
- **Build System**: Consolidated TypeScript declarations in single `dist/types/` directory
- **Architecture**: Clean codebase with removed duplicates and improved organization
- **TypeScript**: Full type support with proper GeoJSON null geometry handling
- **CI/CD**: Automated publishing and GitHub releases
- **Documentation**: Complete API documentation and examples

### v0.9.0-alpha.3 (pre-release)
**Major Improvements**
- **Code Quality**: Removed duplicate test files and legacy source files, improving test coverage from 77.69% to 92.94%
- **Build System**: Consolidated TypeScript declarations into single `dist/types/` directory using `@rollup/plugin-typescript`
- **TypeScript**: Fixed compilation errors in Tasks system with proper GeoJSON null geometry handling
- **Architecture**: Cleaned up codebase by removing 6 duplicate test files and 7 redundant source files
- **Performance**: Streamlined test suite from 825 to 651 tests while maintaining comprehensive coverage
- **Developer Experience**: All builds now pass cleanly with proper type generation and organization

### v0.0.7
Update for clearing the source cache in newer versions of MapboxGL (eg 2.9+). 

### v0.0.6
Fix up clearing the source cache in MapboxGL

### v0.0.5
Add an `ImageService` class
Fix `layers` parameter for identify calls.

### v0.0.4
Add support for fetch options to support authorization headers.

### v0.0.3
Improve Dynamic Map Service requests by including a `imageSR`, `size` and `dpi` params. Setting `imageSR` particuarly helps with tile edges.

### v0.0.2
Remove unused import from bundle

### v0.0.1
Initial alpha release