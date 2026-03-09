# VectorTileService

High-performance vector tiles from ArcGIS Vector Tile Services. Crisp rendering at all zoom levels, client-side styling, and queryable features.

## Live Demo

<iframe
  src="/examples/vector-tile-service.html"
  width="100%"
  height="500px"
  style={{border: '1px solid #ddd', borderRadius: '8px'}}
  title="VectorTileService Demo">
</iframe>

*Interactive demo showing scalable vector tiles with dynamic layer addition and removal controls.*

## Quick Start

```bash
npm install esri-gl maplibre-gl
```

```typescript
import { VectorTileService } from 'esri-gl';

const service = new VectorTileService('parcels-source', map, {
  url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer'
});

const style = await service.getStyle();
map.addLayer({
  id: 'parcels-layer',
  type: style.type,
  source: 'parcels-source',
  'source-layer': style['source-layer'],
  paint: style.paint
});
```

## Constructor

```typescript
new VectorTileService(id, map, esriServiceOptions, vectorSourceOptions?)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique source ID for MapLibre |
| `map` | `Map` | MapLibre map instance |
| `esriServiceOptions` | `object` | Service configuration (see below) |
| `vectorSourceOptions` | `object` | Optional MapLibre vector source overrides (see below) |

## Service Options (`esriServiceOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | ArcGIS VectorTileServer URL |
| `token` | `string` | — | ArcGIS authentication token |
| `fetchOptions` | `object` | — | Custom fetch options (headers, etc.) |

## Vector Source Options (`vectorSourceOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minzoom` | `number` | `0` | Minimum zoom level |
| `maxzoom` | `number` | `22` | Maximum zoom level |
| `attribution` | `string` | — | Custom attribution text |

## Examples

### Custom Styling
```typescript
map.addLayer({
  id: 'custom-parcels',
  type: 'fill',
  source: 'parcels-source',
  'source-layer': 'Santa_Monica_Mountains_Parcels',
  paint: {
    'fill-color': '#ff6b6b',
    'fill-opacity': 0.7,
    'fill-outline-color': '#fff'
  }
});
```

### Feature Queries
```typescript
map.on('click', 'parcels-layer', (e) => {
  const features = map.queryRenderedFeatures(e.point, {
    layers: ['parcels-layer']
  });

  if (features.length > 0) {
    console.log('Feature properties:', features[0].properties);
  }
});
```

### Style Updates
```typescript
map.setPaintProperty('parcels-layer', 'fill-color', '#4CAF50');
map.setPaintProperty('parcels-layer', 'fill-opacity', 0.8);
```
