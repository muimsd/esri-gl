# Basic Examples

Get started with simple examples of each service type.

## DynamicMapService Basic

Display server-rendered raster tiles from an ArcGIS Dynamic Map Service:

```typescript
import { DynamicMapService } from 'esri-map-gl'
import maplibregl from 'maplibre-gl'

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [-95.7129, 37.0902],
    zoom: 4
})

map.on('load', () => {
    // Create Dynamic Map Service
    const service = new DynamicMapService('usa-source', map, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: [0, 1, 2, 3], 
        format: 'png32',
        transparent: true
    })

    // Add layer to map
    map.addLayer({
        id: 'usa-layer',
        type: 'raster',
        source: 'usa-source'
    })
})
```

## TiledMapService Basic

Display pre-cached raster tiles from an ArcGIS Tiled Map Service:

```typescript
import { TiledMapService } from 'esri-map-gl'

map.on('load', () => {
    // Create Tiled Map Service
    const service = new TiledMapService('imagery-source', map, {
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    })

    // Add layer to map  
    map.addLayer({
        id: 'imagery-layer',
        type: 'raster',
        source: 'imagery-source'
    })
})
```

## ImageService Basic

Display analytical raster data from an ArcGIS Image Service:

```typescript
import { ImageService } from 'esri-map-gl'

map.on('load', () => {
    // Create Image Service
    const service = new ImageService('elevation-source', map, {
        url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
        renderingRule: {
            rasterFunction: 'Hillshade'
        }
    })

    // Add layer to map
    map.addLayer({
        id: 'elevation-layer', 
        type: 'raster',
        source: 'elevation-source'
    })
})
```

## VectorTileService Basic

Display vector tiles from an ArcGIS Vector Tile Service:

```typescript
import { VectorTileService } from 'esri-map-gl'

map.on('load', () => {
    // Create Vector Tile Service
    const service = new VectorTileService('streets-source', map, {
        url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer'
    })

    // Add layers (vector tiles include their own styling)
    // The service automatically adds all styled layers from the service
})
```

## FeatureService Basic

Display GeoJSON features from an ArcGIS Feature Service:

```typescript
import { FeatureService } from 'esri-map-gl'

map.on('load', () => {
    // Create Feature Service
    const service = new FeatureService('states-source', map, {
        url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
        where: '1=1',
        outFields: ['STATE_NAME', 'POP2000']
    })

    // Add fill layer
    map.addLayer({
        id: 'states-fill',
        type: 'fill',
        source: 'states-source',
        paint: {
            'fill-color': '#088',
            'fill-opacity': 0.6
        }
    })

    // Add outline layer  
    map.addLayer({
        id: 'states-outline',
        type: 'line', 
        source: 'states-source',
        paint: {
            'line-color': '#000',
            'line-width': 1
        }
    })
})
```

## Next Steps

- [API Reference](../api/dynamic-map-service) - Detailed documentation for each service
- [Advanced Examples](./advanced) - Complex use cases and patterns