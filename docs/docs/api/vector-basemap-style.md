# VectorBasemapStyle

<!-- Example iframe removed: referenced file /examples/minimal-example.html does not exist. -->

For loading complete [Esri Vector Basemap Styles](https://developers.arcgis.com/rest/services-reference/enterprise/vector-basemap-style-service.htm) that provide ready-to-use basemap designs with consistent styling and global coverage.

## Constructor

```typescript
new VectorBasemapStyle(styleId: string, apiKey: string)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| styleId | `string` | **Required** Esri basemap style identifier (e.g., 'ArcGIS:Streets') |
| apiKey | `string` | **Required** Esri API key for authentication |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| styleUrl | `string` | The constructed style URL for MapLibre/Mapbox |
| apiKey | `string` | The provided API key |
| styleId | `string` | The basemap style identifier |

## Available Style IDs

| Style ID | Description | Use Case |
|----------|-------------|----------|
| `ArcGIS:Streets` | Standard street map | General purpose mapping |
| `ArcGIS:Topographic` | Topographic map with terrain | Outdoor recreation, analysis |
| `ArcGIS:Navigation` | High-contrast navigation style | Turn-by-turn navigation |
| `ArcGIS:Streets:Relief` | Streets with hillshade relief | Context with terrain |
| `ArcGIS:LightGray` | Light gray reference map | Data visualization overlay |
| `ArcGIS:DarkGray` | Dark gray reference map | Dark theme applications |
| `ArcGIS:Oceans` | Bathymetric ocean mapping | Marine applications |
| `ArcGIS:Human:Geography` | Human geography emphasis | Demographics, social data |

## Basic Example

```typescript
import { VectorBasemapStyle } from 'esri-gl';

// Create basemap style instance
const basemapStyle = new VectorBasemapStyle('ArcGIS:Streets', 'YOUR_API_KEY');

// Apply to map
const response = await fetch(basemapStyle.styleUrl);
const style = await response.json();
map.setStyle(style);
```

## Dynamic Style Switching

```typescript
const basemap = new VectorBasemapStyle('ArcGIS:Streets', apiKey);

// Function to switch basemap styles
async function switchBasemap(newStyleId) {
  basemap.styleId = newStyleId;
  const response = await fetch(basemap.styleUrl);
  const style = await response.json();
  map.setStyle(style);
}

// Switch to topographic style
await switchBasemap('ArcGIS:Topographic');
```

## Error Handling

```typescript
async function loadBasemap(styleId, apiKey) {
  try {
    const basemap = new VectorBasemapStyle(styleId, apiKey);
    const response = await fetch(basemap.styleUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const style = await response.json();
    map.setStyle(style);
  } catch (error) {
    console.error('Failed to load basemap:', error);
  }
}
```

## Authentication

Vector basemap styles require an Esri API key. Get a free key from the [ArcGIS Developer Dashboard](https://developers.arcgis.com/):

1. Create an account at [developers.arcgis.com](https://developers.arcgis.com/)
2. Create a new application
3. Generate an API key with basemap privileges
4. Use the key in your VectorBasemapStyle constructor

## Browser Support

Compatible with MapLibre GL JS and Mapbox GL JS in all modern browsers. Vector tiles provide:

- Sharp rendering at all zoom levels
- Efficient data transfer and caching
- Client-side styling and customization
- High performance on mobile devices

## Service Documentation

For complete service details, see the official [Esri Vector Basemap Style Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-basemap-style-service.htm) documentation.