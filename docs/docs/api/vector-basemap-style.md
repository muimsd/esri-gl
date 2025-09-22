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

