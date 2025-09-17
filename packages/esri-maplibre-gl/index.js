// ⚠️ DEPRECATED PACKAGE
// This package has been consolidated into 'esri-gl'
// Please update your imports to use 'esri-gl' instead

console.warn(`
⚠️  WARNING: The 'esri-maplibre-gl' package is deprecated!

Please update your code to use 'esri-gl' instead:

OLD:
  import { DynamicMapService } from 'esri-maplibre-gl'

NEW:
  import { DynamicMapService } from 'esri-gl'

The 'esri-gl' package provides the same functionality with better
compatibility for both Mapbox GL JS and MapLibre GL JS.

For more information, visit: https://github.com/muimsd/esri-gl
`)

// Re-export everything from the main package
module.exports = require('esri-gl')
