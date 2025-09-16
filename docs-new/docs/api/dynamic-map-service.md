# DynamicMapService

For accessing [ArcGIS Dynamic Map Services](https://developers.arcgis.com/rest/services-reference/map-service.htm) as raster tile sources.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the [MapLibre GL source](https://maplibre.org/maplibre-gl-js-docs/api/map/#map#addsource) |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options passed when requesting the Esri MapService (see below) |
| rasterSourceOptions | `object` | Optional object passed to the MapLibre GL [raster source](https://maplibre.org/maplibre-style-spec/sources/#raster) |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the MapService (Note: Map Service URLs do not end in a number) |
| fetchOptions | `object` | | Options passed to the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) method for authorization headers |
| layers | `Array<string>` | | Array of layer IDs to restrict which layers to show (e.g., `[1, 2, 3]`) |
| format | `string` | `'png24'` | Output format of the image |
| transparent | `boolean` | `true` | Allow the server to produce transparent images |
| layerDefs | `object` | | SQL filters for features. Object with keys mapping queries to layers (e.g., `{ 3: "STATE_NAME='Kansas'", 9: "POP2007>25000" }`) |
| from | `Date` | | Start date for time-enabled layers |
| to | `Date` | | End date for time-enabled layers |
| getAttributionFromService | `boolean` | `true` | Retrieve copyrightText from service and add as map attribution |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `identify(lngLat, returnGeometry?)` | `Promise<IdentifyResponse>` | Identify features at a point |
| `setLayers(layers)` | `void` | Update which layers are visible |
| `setLayerDefs(layerDefs)` | `void` | Update layer definition filters |

## Basic Example

```typescript
import { DynamicMapService } from 'esri-map-gl'

// Create the service
const service = new DynamicMapService('usa-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    layers: [0, 1, 2],
    format: 'png32',
    transparent: true
})

// Add a layer to display the service
map.addLayer({
    id: 'usa-layer',
    type: 'raster', 
    source: 'usa-source'
})
```

## Identify Features

```typescript
// Identify features at a point
const results = await service.identify({
    lng: -95.7129,
    lat: 37.0902  
}, true) // returnGeometry = true

console.log('Identified features:', results.results)
```

## Layer Filtering

```typescript
// Filter specific layers with SQL
service.setLayerDefs({
    0: "POP2000 > 100000",
    1: "STATE_NAME IN ('California', 'Texas', 'Florida')"
})

// Show only specific layers
service.setLayers([0, 2])
```

## Time-Enabled Services

```typescript
const timeService = new DynamicMapService('time-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/SampleWorldCities/MapServer',
    from: new Date('2020-01-01'),
    to: new Date('2020-12-31')
})
```