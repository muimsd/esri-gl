# ImageService

For accessing [ArcGIS Image Services](https://developers.arcgis.com/rest/services-reference/image-service.htm) that provide analytical raster data with advanced rendering capabilities.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the MapLibre GL source |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Esri ImageService (see below) |
| rasterSourceOptions | `object` | Optional MapLibre GL raster source options |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the ImageService |
| renderingRule | `object` | | Raster function and parameters for visualization |
| mosaicRule | `object` | | Controls which images are displayed from a mosaic dataset |
| format | `string` | `'jpgpng'` | Output format (`jpg`, `png`, `jpgpng`, `gif`, `bmp`) |
| interpolation | `string` | | Resampling method (`RSP_BilinearInterpolation`, `RSP_CubicConvolution`, etc.) |
| compressionQuality | `number` | | JPEG compression quality (1-100) |
| bandIds | `Array<number>` | | Specific bands to display |
| pixelType | `string` | | Output pixel type |
| noData | `number` | | NoData value |
| token | `string` | | Authentication token |
| fetchOptions | `object` | | Fetch request options |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `identify(lngLat, options?)` | `Promise<IdentifyResponse>` | Get pixel values at a point |
| `setRenderingRule(rule)` | `void` | Update rendering rule |
| `setMosaicRule(rule)` | `void` | Update mosaic rule |

## Basic Example

```typescript
import { ImageService } from 'esri-gl'

// World Elevation service
const elevationService = new ImageService('elevation-source', map, {
    url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
})

map.addLayer({
    id: 'elevation-layer',
    type: 'raster',
    source: 'elevation-source'
})
```

## Hillshade Visualization

```typescript
// Elevation with hillshade rendering
const hillshadeService = new ImageService('hillshade-source', map, {
    url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
    renderingRule: {
        rasterFunction: 'Hillshade',
        rasterFunctionArguments: {
            Azimuth: 315,
            Altitude: 45,
            ZFactor: 1
        }
    }
})

map.addLayer({
    id: 'hillshade-layer',
    type: 'raster',
    source: 'hillshade-source'
})
```

## Color Ramp Visualization

```typescript
// Temperature data with color ramp
const temperatureService = new ImageService('temp-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Temperature/ImageServer',
    renderingRule: {
        rasterFunction: 'Colormap',
        rasterFunctionArguments: {
            Colormap: [
                [0, 0, 0, 255],    // Cold - Blue
                [128, 255, 255, 0], // Medium - Yellow  
                [255, 255, 0, 0]    // Hot - Red
            ]
        }
    },
    format: 'png'
})

map.addLayer({
    id: 'temperature-layer',
    type: 'raster',
    source: 'temp-source',
    paint: {
        'raster-opacity': 0.7
    }
})
```

## Multispectral Imagery

```typescript
// Landsat imagery with band combination
const landsatService = new ImageService('landsat-source', map, {
    url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/PS/ImageServer',
    renderingRule: {
        rasterFunction: 'Stretch',
        rasterFunctionArguments: {
            StretchType: 0, // StandardDeviations
            StandardDeviationsParam: 2,
            DRA: true
        }
    },
    bandIds: [4, 3, 2], // Near-infrared, Red, Green for false color
    mosaicRule: {
        mosaicMethod: 'esriMosaicLockRaster',
        lockRasterIds: [1234] // Specific scene ID
    }
})

map.addLayer({
    id: 'landsat-layer',
    type: 'raster',
    source: 'landsat-source'
})
```

## Identify Pixel Values

```typescript
// Click to get pixel values
map.on('click', async (e) => {
    try {
        const results = await elevationService.identify(e.lngLat, {
            returnGeometry: false,
            returnCatalogItems: false
        })
        
        if (results.value) {
            console.log(`Elevation: ${results.value} meters`)
        }
    } catch (error) {
        console.error('Identify failed:', error)
    }
})
```

## Dynamic Rendering Updates

```typescript
// Change visualization on the fly
function updateVisualization(type: string) {
    let renderingRule
    
    switch (type) {
        case 'hillshade':
            renderingRule = {
                rasterFunction: 'Hillshade',
                rasterFunctionArguments: {
                    Azimuth: 315,
                    Altitude: 45
                }
            }
            break
            
        case 'slope':
            renderingRule = {
                rasterFunction: 'Slope',
                rasterFunctionArguments: {
                    SlopeType: 1, // Degrees
                    ZFactor: 1
                }
            }
            break
            
        case 'aspect':
            renderingRule = {
                rasterFunction: 'Aspect'
            }
            break
    }
    
    elevationService.setRenderingRule(renderingRule)
}
```

## Common Raster Functions

| Function | Purpose | Arguments |
|----------|---------|-----------|
| `Hillshade` | 3D terrain visualization | `Azimuth`, `Altitude`, `ZFactor` |
| `Slope` | Slope calculation | `SlopeType`, `ZFactor` |
| `Aspect` | Aspect calculation | None |
| `Colormap` | Color ramp application | `Colormap` array |
| `Stretch` | Contrast enhancement | `StretchType`, `StandardDeviationsParam` |
| `NDVI` | Vegetation index | `VisibleBandID`, `InfraredBandID` |
| `Clip` | Geometric clipping | `ClippingGeometry` |

## Performance Tips

1. **Use appropriate format**: JPG for imagery, PNG for data with transparency
2. **Limit band count**: Only request needed bands to reduce bandwidth
3. **Cache rendering rules**: Reuse complex rendering configurations
4. **Use mosaic rules**: Filter to specific time periods or quality criteria
5. **Consider compression**: Balance quality vs. speed with `compressionQuality`