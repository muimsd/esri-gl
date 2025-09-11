# NPM Package Name Reservation Strategy

This document explains the package name reservation strategy for the esri-map-gl ecosystem.

## Reserved Package Names

### Main Package
- **`esri-map-gl`** - The primary package that provides Esri ArcGIS integration for both Mapbox GL JS and MapLibre GL JS

### Redirect Packages (Reserved)
- **`esri-mapbox-gl`** - Redirects to `esri-map-gl` with deprecation warning
- **`esri-maplibre-gl`** - Redirects to `esri-map-gl` with deprecation warning

## Why Reserve These Names?

1. **Prevent Confusion**: Users might naturally look for packages with these specific names
2. **Traffic Consolidation**: Redirect users to the unified `esri-map-gl` package
3. **Namespace Protection**: Prevent others from publishing packages with similar names that could cause confusion

## How Redirect Packages Work

The redirect packages:
1. Show a deprecation warning when imported
2. Re-export all functionality from `esri-map-gl`
3. Include clear migration instructions in their README
4. Are marked as deprecated in their package.json

## Publishing Redirect Packages

### Prerequisites
```bash
npm login  # Make sure you're logged in
```

### Publish All Redirects
```bash
npm run publish:redirects
```

### Publish Individual Redirects
```bash
npm run publish:mapbox-redirect
npm run publish:maplibre-redirect
```

## Package Structure

```
packages/
├── esri-mapbox-gl/
│   ├── package.json      # Marked as deprecated, depends on esri-map-gl
│   ├── index.js          # Shows warning, re-exports esri-map-gl
│   └── README.md         # Migration guide
└── esri-maplibre-gl/
    ├── package.json      # Marked as deprecated, depends on esri-map-gl  
    ├── index.js          # Shows warning, re-exports esri-map-gl
    └── README.md         # Migration guide
```

## User Experience

When users install a redirect package:

1. **Installation**: Works normally, installs `esri-map-gl` as dependency
2. **Import Warning**: Console warning appears explaining the deprecation
3. **Functionality**: All features work exactly the same as `esri-map-gl`
4. **Documentation**: README provides clear migration path

## Migration Path for Users

### From esri-mapbox-gl
```javascript
// OLD (still works, but shows warning)
import { DynamicMapService } from 'esri-mapbox-gl'

// NEW (recommended)
import { DynamicMapService } from 'esri-map-gl'
```

### From esri-maplibre-gl
```javascript
// OLD (still works, but shows warning)
import { DynamicMapService } from 'esri-maplibre-gl'

// NEW (recommended)
import { DynamicMapService } from 'esri-map-gl'
```

## Benefits

1. **Seamless Migration**: Existing code continues to work
2. **Clear Direction**: Users are guided to the correct package
3. **Unified Ecosystem**: All users eventually use the same package
4. **Better Maintenance**: Only one package to maintain long-term

This strategy ensures that users can find the functionality they need while gradually migrating everyone to the unified `esri-map-gl` package.
