// ⚠️ DEPRECATED PACKAGE
// This package has been consolidated into 'esri-map-gl'
// Please update your imports to use 'esri-map-gl' instead

console.warn(`
⚠️  WARNING: The 'esri-maplibre-gl' package is deprecated!

Please update your code to use 'esri-map-gl' instead:

OLD:
  import { DynamicMapService } from 'esri-maplibre-gl'

NEW:
  import { DynamicMapService } from 'esri-map-gl'

The 'esri-map-gl' package provides the same functionality with better
compatibility for both Mapbox GL JS and MapLibre GL JS.

For more information, visit: https://github.com/muimsd/esri-map-gl
`)

// Re-export everything from the main package
module.exports = require('esri-map-gl')
