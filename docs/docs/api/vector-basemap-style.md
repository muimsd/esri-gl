# VectorBasemapStyle

For loading complete [Esri Vector Basemap Styles](https://developers.arcgis.com/rest/services-reference/enterprise/vector-basemap-style-service.htm) that provide ready-to-use basemap designs with consistent styling and global coverage.

## Static Methods

### applyStyle (Recommended)

```typescript
static applyStyle(
  map: { setStyle: (style: string) => void },
  styleName: EsriBasemapStyleName,
  auth: VectorBasemapStyleAuthOptions
): void
```

Simple wrapper method for applying Esri basemap styles to a map.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| map | `{ setStyle: (style: string) => void }` | **Required** MapLibre or Mapbox GL map instance |
| styleName | `EsriBasemapStyleName` | **Required** Esri basemap style name (e.g., 'arcgis/streets') |
| auth | `VectorBasemapStyleAuthOptions` | **Required** Authentication options |

#### Example

```typescript
// Using API key
VectorBasemapStyle.applyStyle(map, 'arcgis/streets', { apiKey: 'YOUR_API_KEY' });

// Using token
VectorBasemapStyle.applyStyle(map, 'arcgis/dark-gray', { token: 'YOUR_TOKEN' });

// With language options
VectorBasemapStyle.applyStyle(map, 'arcgis/navigation', {
  apiKey: 'YOUR_API_KEY',
  language: 'es'
});

// Using legacy format
VectorBasemapStyle.applyStyle(map, 'arcgis:streets', { apiKey: 'YOUR_API_KEY' });
```

## Constructor

```typescript
new VectorBasemapStyle(styleId: EsriBasemapStyleName, auth: VectorBasemapStyleAuthOptions)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| styleId | `EsriBasemapStyleName` | **Required** Esri basemap style identifier |
| auth | `VectorBasemapStyleAuthOptions` | **Required** Authentication options |

## Properties

| Property | Type | Description |
|----------|------|-------------|
| styleUrl | `string` | The constructed style URL for MapLibre/Mapbox |
| auth | `VectorBasemapStyleAuthOptions` | The authentication configuration |
| styleId | `EsriBasemapStyleName` | The basemap style identifier |

## Methods

### setStyle

```typescript
setStyle(styleId: EsriBasemapStyleName): void
```

Updates the style ID and regenerates the style URL.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| styleId | `EsriBasemapStyleName` | **Required** New basemap style identifier |

## Types

### EsriBasemapStyleName

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

### VectorBasemapStyleAuthOptions

```typescript
interface VectorBasemapStyleAuthOptions {
  apiKey?: string;
  token?: string;
  language?: string;
  worldview?: string;
}
```

## Available Styles

### Modern Slash Format (Recommended)

| Style Name | Description | Use Case |
|------------|-------------|----------|
| `arcgis/streets` | Standard street map | General purpose mapping |
| `arcgis/topographic` | Topographic map with terrain | Outdoor recreation, analysis |
| `arcgis/navigation` | High-contrast navigation style | Turn-by-turn navigation |
| `arcgis/streets-relief` | Streets with hillshade relief | Context with terrain |
| `arcgis/dark-gray` | Dark gray reference map | Dark theme applications |
| `arcgis/light-gray` | Light gray reference map | Data visualization overlay |
| `arcgis/oceans` | Bathymetric ocean mapping | Marine applications |
| `arcgis/imagery` | Satellite imagery basemap | Aerial context |
| `arcgis/streets-night` | Dark streets with night styling | Night-time applications |

### Legacy Colon Format (Backwards Compatibility)

| Style Name | Description | Modern Equivalent |
|------------|-------------|------------------|
| `arcgis:streets` | Standard street map | `arcgis/streets` |
| `arcgis:topographic` | Topographic map with terrain | `arcgis/topographic` |
| `arcgis:navigation` | High-contrast navigation style | `arcgis/navigation` |
| `arcgis:streetsrelief` | Streets with hillshade relief | `arcgis/streets-relief` |
| `arcgis:darkgray` | Dark gray reference map | `arcgis/dark-gray` |
| `arcgis:lightgray` | Light gray reference map | `arcgis/light-gray` |
| `arcgis:oceans` | Bathymetric ocean mapping | `arcgis/oceans` |
| `arcgis:imagery` | Satellite imagery basemap | `arcgis/imagery` |
| `arcgis:streetsnight` | Dark streets with night styling | `arcgis/streets-night` |

### Custom Enterprise Styles

The service also supports custom enterprise basemap styles by accepting any string as a style name:

```typescript
// Custom enterprise style
VectorBasemapStyle.applyStyle(map, 'my-org/custom-style', { 
  apiKey: 'YOUR_API_KEY' 
});

// Custom portal style  
VectorBasemapStyle.applyStyle(map, 'enterprise/street-map-v2', { 
  token: 'YOUR_TOKEN' 
});
```

## Authentication

The service supports both API Key and Token authentication:

- **API Key**: Use for v1 styles (basemaps-api.arcgis.com)
- **Token**: Use for v2 styles (basemapstyles-api.arcgis.com)

The service automatically detects which authentication method to use based on the provided credentials.

