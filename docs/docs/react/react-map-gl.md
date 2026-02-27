# React Map GL Components

Drop-in components for using Esri services with [react-map-gl](https://visgl.github.io/react-map-gl/). Works with both MapLibre GL and Mapbox GL.

## Components

All components share these common props:

| Prop | Type | Description |
|------|------|-------------|
| id | `string` | **Required** Unique layer ID |
| sourceId | `string` | Custom source ID (defaults to `id`) |
| beforeId | `string` | Insert layer before this layer ID |
| visible | `boolean` | Layer visibility |

### EsriDynamicLayer

Renders an Esri Dynamic Map Service as a raster layer.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| url | `string` | | **Required** MapService URL |
| layers | `number[] \| number \| false` | | Layer IDs to show |
| layerDefs | `Record<string, string> \| false` | | SQL filters per layer |
| format | `string` | | Image format |
| dpi | `number` | | Output DPI |
| transparent | `boolean` | | Transparent background |

```tsx
import { EsriDynamicLayer } from 'esri-gl/react-map-gl';

<Map>
  <EsriDynamicLayer
    id="census"
    url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer"
    layers={[2, 3]}
    layerDefs={{ 2: "STATE_NAME='California'" }}
  />
</Map>
```

### EsriTiledLayer

Renders an Esri Tiled Map Service as a raster layer.

| Prop | Type | Description |
|------|------|-------------|
| url | `string` | **Required** Tiled MapService URL |

```tsx
import { EsriTiledLayer } from 'esri-gl/react-map-gl';

<Map>
  <EsriTiledLayer
    id="topo"
    url="https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer"
  />
</Map>
```

### EsriImageLayer

Renders an Esri Image Service as a raster layer.

| Prop | Type | Description |
|------|------|-------------|
| url | `string` | **Required** ImageService URL |
| renderingRule | `Record<string, unknown> \| false` | Server-side rendering rule |
| mosaicRule | `Record<string, unknown> \| false` | Mosaic rule for image selection |
| format | `string` | Image format |

```tsx
import { EsriImageLayer } from 'esri-gl/react-map-gl';

<Map>
  <EsriImageLayer
    id="landcover"
    url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover/ImageServer"
  />
</Map>
```

### EsriFeatureLayer

Renders an Esri Feature Service as a GeoJSON vector layer.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| url | `string` | | **Required** Feature layer URL |
| where | `string` | | SQL WHERE filter |
| outFields | `string \| string[]` | | Fields to include |
| paint | `Record<string, unknown>` | | MapLibre paint properties |
| layout | `Record<string, unknown>` | | MapLibre layout properties |

```tsx
import { EsriFeatureLayer } from 'esri-gl/react-map-gl';

<Map>
  <EsriFeatureLayer
    id="states"
    url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3"
    where="POP2000 > 5000000"
    outFields={['STATE_NAME', 'POP2000']}
    paint={{ 'fill-color': '#0080ff', 'fill-opacity': 0.4 }}
  />
</Map>
```

### EsriVectorTileLayer

Renders an Esri Vector Tile Service. The service handles layer creation internally.

| Prop | Type | Description |
|------|------|-------------|
| url | `string` | **Required** Vector Tile Service URL |

```tsx
import { EsriVectorTileLayer } from 'esri-gl/react-map-gl';

<Map>
  <EsriVectorTileLayer
    id="basemap-vtiles"
    url="https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer"
  />
</Map>
```

### EsriVectorBasemapLayer

Applies an Esri Vector Basemap Style to the map. Note: this replaces the entire map style rather than adding a layer.

| Prop | Type | Description |
|------|------|-------------|
| basemapEnum | `string` | **Required** Basemap style (e.g., `'arcgis/streets'`, `'arcgis/navigation'`) |
| token | `string` | **Required** Authentication token |

```tsx
import { EsriVectorBasemapLayer } from 'esri-gl/react-map-gl';

<Map>
  <EsriVectorBasemapLayer
    id="basemap"
    basemapEnum="arcgis/navigation"
    token="YOUR_TOKEN"
  />
</Map>
```

## Integration Hooks

These hooks provide access to the underlying map instance and pre-configured service hooks for react-map-gl applications.

### useEsriMaplibreLayer

Hook for using Esri services with **MapLibre GL** via react-map-gl.

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| map | `Map \| null` | The MapLibre GL map instance |
| useDynamicMapService | `function` | Pre-configured hook |
| useTiledMapService | `function` | Pre-configured hook |
| useImageService | `function` | Pre-configured hook |
| useVectorTileService | `function` | Pre-configured hook |
| useFeatureService | `function` | Pre-configured hook |

```tsx
import { useEsriMaplibreLayer } from 'esri-gl/react-map-gl';

function MyLayer() {
  const { map, useDynamicMapService } = useEsriMaplibreLayer();
  const { service } = useDynamicMapService({
    sourceId: 'census',
    map,
    options: { url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer' },
  });
  return null;
}
```

### useEsriMapboxLayer

Hook for using Esri services with **Mapbox GL** via react-map-gl. Same API as `useEsriMaplibreLayer` but uses the Mapbox provider.

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| map | `Map \| null` | The Mapbox GL map instance |
| useDynamicMapService | `function` | Pre-configured hook |
| useTiledMapService | `function` | Pre-configured hook |
| useImageService | `function` | Pre-configured hook |
| useVectorTileService | `function` | Pre-configured hook |
| useFeatureService | `function` | Pre-configured hook |

```tsx
import { useEsriMapboxLayer } from 'esri-gl/react-map-gl';

function MyLayer() {
  const { map, useDynamicMapService } = useEsriMapboxLayer();
  const { service } = useDynamicMapService({
    sourceId: 'census',
    map,
    options: { url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer' },
  });
  return null;
}
```
