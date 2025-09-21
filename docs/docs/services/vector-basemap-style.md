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

// Create basemap style instance
const basemapStyle = new VectorBasemapStyle('ArcGIS:Streets', 'YOUR_API_KEY');

// Load and apply to map
const response = await fetch(basemapStyle.styleUrl);
const style = await response.json();
map.setStyle(style);
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
const vectorStyle = new EsriGL.VectorBasemapStyle('ArcGIS:Streets', apiKey);
const response = await fetch(vectorStyle.styleUrl);
const style = await response.json();
map.setStyle(style);
```

### Dynamic Style Switching
```javascript
async function switchBasemap(styleId) {
  const vectorStyle = new EsriGL.VectorBasemapStyle(styleId, apiKey);
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
    const vectorStyle = new EsriGL.VectorBasemapStyle(styleId, apiKey);
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

For detailed API documentation, see [VectorBasemapStyle API Reference](../api/vector-basemap-style).