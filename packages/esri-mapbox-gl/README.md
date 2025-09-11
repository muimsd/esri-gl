# ⚠️ DEPRECATED: esri-mapbox-gl

**This package has been consolidated into [`esri-map-gl`](https://www.npmjs.com/package/esri-map-gl)**

## Migration Guide

Please update your package.json and import statements:

### Before (deprecated):
```json
{
  "dependencies": {
    "esri-mapbox-gl": "^1.0.0"
  }
}
```

```javascript
import { DynamicMapService } from 'esri-mapbox-gl'
```

### After (recommended):
```json
{
  "dependencies": {
    "esri-map-gl": "^0.0.7"
  }
}
```

```javascript
import { DynamicMapService } from 'esri-map-gl'
```

## Why the Change?

The `esri-map-gl` package provides better compatibility with both Mapbox GL JS and MapLibre GL JS in a single package, eliminating the need for separate packages.

## Features in esri-map-gl

- ✅ Compatible with both Mapbox GL JS and MapLibre GL JS
- ✅ TypeScript support
- ✅ ArcGIS Dynamic Map Services
- ✅ ArcGIS Tiled Map Services  
- ✅ ArcGIS Image Services
- ✅ ArcGIS Vector Tile Services
- ✅ ArcGIS Feature Services
- ✅ Identify and Query operations

## Links

- [GitHub Repository](https://github.com/muimsd/esri-map-gl)
- [NPM Package](https://www.npmjs.com/package/esri-map-gl)
- [Documentation](https://github.com/muimsd/esri-map-gl#readme)

---

**Note**: This package will continue to work by re-exporting from `esri-map-gl`, but it's recommended to migrate to the main package for better long-term support.
