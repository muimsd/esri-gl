# VectorBasemapStyle

The `VectorBasemapStyle` class provides easy access to Esri's professionally designed vector basemap styles through the ArcGIS Basemaps API.

## Interactive Demo

<iframe 
  src="/examples/vector-basemap-style.html" 
  width="100%" 
  height="500"
  style={{border: '1px solid #ccc', borderRadius: '4px'}}>
</iframe>

*Switch between different Esri vector basemap styles with your API key*

## Quick Start

```typescript
import { VectorBasemapStyle } from 'esri-gl';

// Simple way - using the applyStyle wrapper
VectorBasemapStyle.applyStyle(map, 'arcgis/streets', { apiKey: 'YOUR_API_KEY' });

// Advanced way - create instance and manage manually
const basemapStyle = new VectorBasemapStyle('arcgis/streets', { apiKey: 'YOUR_API_KEY' });
map.setStyle(basemapStyle.styleUrl);
```

## Available Styles

| Style ID | Description | Use Cases |
|----------|-------------|-----------|
| `ArcGIS:Streets` | Standard street map | General purpose, navigation |
| `ArcGIS:Topographic` | Topographic map with terrain | Outdoor recreation, analysis |
| `ArcGIS:Navigation` | High-contrast navigation style | Turn-by-turn navigation |
| `ArcGIS:Streets:Relief` | Streets with hillshade relief | Context with terrain awareness |
| `ArcGIS:LightGray` | Light gray reference map | Data visualization overlay |
| `ArcGIS:DarkGray` | Dark gray reference map | Dark theme applications |
| `ArcGIS:Oceans` | Bathymetric ocean mapping | Marine applications |

## Usage Examples

### Basic Implementation
```javascript
// Initialize with default Streets style
const vectorStyle = new VectorBasemapStyle('ArcGIS:Streets', apiKey);
const response = await fetch(vectorStyle.styleUrl);
const style = await response.json();
map.setStyle(style);
```

### Dynamic Style Switching
```javascript
async function switchBasemap(styleId) {
  const vectorStyle = new VectorBasemapStyle(styleId, apiKey);
  const response = await fetch(vectorStyle.styleUrl);
  const style = await response.json();
  map.setStyle(style);
}

// Switch to topographic style
await switchBasemap('ArcGIS:Topographic');
```

### With Error Handling
```javascript
async function loadBasemap(styleId, apiKey) {
  try {
    const vectorStyle = new VectorBasemapStyle(styleId, apiKey);
    const response = await fetch(vectorStyle.styleUrl);
    
    if (!response.ok) {
      throw new Error('Failed to load basemap style');
    }
    
    const style = await response.json();
    map.setStyle(style);
  } catch (error) {
    console.error('Error loading basemap:', error);
  }
}
```

## Key Features

- **Professional Design** - Cartographically optimized styles from Esri
- **Global Coverage** - Consistent styling worldwide with localized labels  
- **High Performance** - Optimized vector tiles with efficient rendering
- **API Key Required** - Requires valid Esri API key for access
- **Style URL Generation** - Automatically constructs proper style URLs

## API Reference

## Available Style Names

The service supports full TypeScript type safety with these available styles:

```typescript
type EsriBasemapStyleName = 
  | 'arcgis/streets'
  | 'arcgis/topographic'
  | 'arcgis/navigation'
  | 'arcgis/streets-relief'
  | 'arcgis/dark-gray'
  | 'arcgis/light-gray'
  | 'arcgis/oceans'
  | 'arcgis/imagery'
  | 'arcgis/streets-night'
  // Legacy colon form (for backwards compatibility)
  | 'arcgis:streets'
  | 'arcgis:topographic'
  | 'arcgis:navigation'
  | 'arcgis:streetsrelief'
  | 'arcgis:darkgray'
  | 'arcgis:lightgray'
  | 'arcgis:oceans'
  | 'arcgis:imagery'
  | 'arcgis:streetsnight'
  // Custom enterprise styles also supported
  | string
```

## Advanced Examples

### Using the Simple Wrapper (Recommended)

```typescript
// Basic usage with API key
VectorBasemapStyle.applyStyle(map, 'arcgis/streets', { apiKey: 'YOUR_API_KEY' });

// With language and worldview options
VectorBasemapStyle.applyStyle(map, 'arcgis/navigation', {
  apiKey: 'YOUR_API_KEY',
  language: 'es',
  worldview: 'FRA'
});

// Using token authentication
VectorBasemapStyle.applyStyle(map, 'arcgis/dark-gray', { token: 'YOUR_TOKEN' });

// Using legacy colon format (backwards compatibility)
VectorBasemapStyle.applyStyle(map, 'arcgis:streets', { apiKey: 'YOUR_API_KEY' });
```

### Using the Full Service API

```typescript
// Create service instance
const basemap = new VectorBasemapStyle('arcgis/streets', { apiKey: 'YOUR_API_KEY' });

// Apply to map
map.setStyle(basemap.styleUrl);

// Change style later
basemap.setStyle('arcgis/dark-gray-canvas');
map.setStyle(basemap.styleUrl);
```

### Dynamic Style Switching

```typescript
const styles = ['arcgis/streets', 'arcgis/imagery', 'arcgis/topographic', 'arcgis/dark-gray'];
let currentIndex = 0;

function switchStyle() {
  VectorBasemapStyle.applyStyle(map, styles[currentIndex], { apiKey: 'YOUR_API_KEY' });
  currentIndex = (currentIndex + 1) % styles.length;
}
```

For detailed API documentation, see [VectorBasemapStyle API Reference](../api/vector-basemap-style).