# MapLibre + React + esri-gl Dynamic Layers Example

This example demonstrates how to use the `esri-gl` library with MapLibre GL JS in a React application built with Vite and TypeScript.

## Features Demonstrated

- **Dynamic Map Services**: Loading ArcGIS Map Server layers with dynamic layer management
- **Interactive Layer Controls**: Toggle layers on/off dynamically
- **Server-side Labeling**: Add labels to map features using ArcGIS server-side rendering
- **Server-side Styling**: Apply custom styling to layers through ArcGIS services
- **Server-side Filtering**: Filter features based on attributes
- **Feature Identification**: Click on map features to see their attributes
- **TypeScript Integration**: Full type safety with TypeScript

## Technologies Used

- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **MapLibre GL JS** - Open-source web mapping library
- **esri-gl** - Bridge library for ArcGIS services

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to this example directory:
   ```bash
   cd examples/maplibre-react-dynamic
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Code Structure

```
src/
├── components/
│   ├── MapComponent.tsx      # Main map component with esri-gl integration
│   ├── MapComponent.css      # Styles for map and controls
│   └── LayerControls.tsx     # Layer management UI component
├── App.tsx                   # Main application component
├── App.css                   # Application styles
├── main.tsx                  # React application entry point
└── index.css                 # Global styles
```

## Key Implementation Details

### MapLibre + esri-gl Integration

The main integration happens in `MapComponent.tsx`:

```typescript
import { DynamicMapService } from 'esri-gl'
import maplibregl from 'maplibre-gl'

// Create the service
service.current = new DynamicMapService('usa-source', map.current, {
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
  layers: selectedLayers,
  format: 'png32',
  transparent: true,
})

// Add to MapLibre map
map.current.addLayer({
  id: 'usa-layer',
  type: 'raster',
  source: 'usa-source',
})
```

### Dynamic Layer Management

Layers can be toggled on/off using the esri-gl API:

```typescript
service.current.setLayers(newLayers)
```

### Server-side Features

The example demonstrates several server-side capabilities:

```typescript
// Add labels
service.current.setLayerLabels(layerId, labelConfig)

// Apply styling  
service.current.setLayerRenderer(layerId, renderer)

// Filter features
service.current.setLayerFilter(layerId, filter)
```

## Available Services

This example uses the public ArcGIS Sample Server:
- **Service URL**: `https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer`
- **Layer 0**: Cities (points)
- **Layer 1**: Highways (lines)
- **Layer 2**: States (polygons)

## Customization

To use your own ArcGIS services:

1. Replace the service URL in `MapComponent.tsx`
2. Update the layer options and IDs to match your service
3. Adjust the labeling, styling, and filtering logic as needed

## Learn More

- [esri-gl Documentation](https://esri-gl.netlify.app/)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## License

This example is provided under the MIT License.