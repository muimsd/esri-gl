Change Log
==========

### v0.9.0-alpha.3
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