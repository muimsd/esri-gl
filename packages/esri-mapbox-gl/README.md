# ⚠️ DEPRECATED: esri-mapbox-gl

**This package has been consolidated into [`esri-gl`](https://www.npmjs.com/package/esri-gl)**

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
    "esri-gl": "^0.0.7"
  }
}
```

```javascript
import { DynamicMapService } from 'esri-gl'
```

## Why the Change?

The `esri-gl` package provides better compatibility with both Mapbox GL JS and MapLibre GL JS in a single package, eliminating the need for separate packages.

## Features in esri-gl

- ✅ Compatible with both Mapbox GL JS and MapLibre GL JS
- ✅ TypeScript support
- ✅ ArcGIS Dynamic Map Services
- ✅ ArcGIS Feature Layer Services
- ✅ ArcGIS Tiled Map Services  
- ✅ ArcGIS Image Services
- ✅ ArcGIS Vector Tile Services
- ✅ ArcGIS Feature Services
- ✅ Identify and Query operations

## Links

- [GitHub Repository](https://github.com/muimsd/esri-gl)
- [NPM Package](https://www.npmjs.com/package/esri-gl)
- [Documentation](https://github.com/muimsd/esri-gl#readme)

---

**Note**: This package will continue to work by re-exporting from `esri-gl`, but it's recommended to migrate to the main package for better long-term support.
