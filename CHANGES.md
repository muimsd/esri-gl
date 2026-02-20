Change Log
==========

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