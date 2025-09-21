# IdentifyImage

Task for identifying pixel values and raster information from ArcGIS Image Services at specific geographic locations.

## Constructor

```typescript
new IdentifyImage(options: IdentifyImageOptions)
```

| Argument | Type | Description |
|----------|------|-------------|
| options | `IdentifyImageOptions` | Configuration options for the identify operation |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** Image Service URL |
| geometry | `object` | | **Required** Point geometry to identify |
| geometryType | `string` | `'esriGeometryPoint'` | Type of geometry |
| mosaicRule | `object` | | Mosaic rule for multi-raster services |
| renderingRule | `object` | | Rendering rule to apply |
| pixelSize | `object` | | Pixel size for resampling |
| timeExtent | `object` | | Time extent for temporal data |
| returnGeometry | `boolean` | `false` | Include geometry in response |
| returnCatalogItems | `boolean` | `false` | Return catalog items |
| returnPixelValues | `boolean` | `true` | Return pixel values |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
identify.at(geometry).pixelSize({x: 10, y: 10}).renderingRule(rule)
```

| Method | Description |
|--------|-------------|
| `at(geometry)` | Set location to identify |
| `pixelSize(size)` | Set pixel size for resampling |
| `renderingRule(rule)` | Apply rendering rule |
| `mosaicRule(rule)` | Set mosaic rule |
| `returnGeometry(boolean)` | Include geometry in results |
| `returnCatalogItems(boolean)` | Include catalog information |
| `token(token)` | Set authentication token |

## Execution Methods

### `.run()`

Execute the identify operation with current parameters.

**Returns:** `Promise<IdentifyImageResponse>`

## Basic Example

```typescript
import { IdentifyImage } from 'esri-gl'

// Identify pixel values at a location
const identify = new IdentifyImage({
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
})

const point = {
  x: -118.2437,
  y: 34.0522,
  spatialReference: { wkid: 4326 }
}

const result = await identify
  .at(point)
  .returnPixelValues(true)
  .run()
```

## Advanced Usage

```typescript
// Identify with rendering rule
const advancedIdentify = new IdentifyImage({
  url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
})

const renderingRule = {
  rasterFunction: 'NDVI',
  rasterFunctionArguments: {
    VisibleBandID: 3,
    InfraredBandID: 4
  }
}

const result = await advancedIdentify
  .at({
    x: -95.7129,
    y: 37.0902,
    spatialReference: { wkid: 4326 }
  })
  .renderingRule(renderingRule)
  .pixelSize({ x: 30, y: 30 })
  .returnGeometry(true)
  .run()
```

## Multi-band Analysis

```typescript
// Identify values from multiple bands
const multibandIdentify = new IdentifyImage({
  url: 'https://services.arcgisonline.com/arcgis/rest/services/Specialty/Multispectral_Landsat/ImageServer'
})

const location = {
  x: -122.4194,
  y: 37.7749,
  spatialReference: { wkid: 4326 }
}

const bands = await multibandIdentify
  .at(location)
  .returnPixelValues(true)
  .returnCatalogItems(true)
  .run()

console.log('Band values:', bands.pixelValues)
console.log('Source images:', bands.catalogItems)
```

## Time-enabled Services

```typescript
// Identify historical imagery
const temporalIdentify = new IdentifyImage({
  url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery_Temporal/ImageServer'
})

const timeExtent = {
  startTime: new Date('2020-01-01').getTime(),
  endTime: new Date('2020-12-31').getTime()
}

const historical = await temporalIdentify
  .at({
    x: -74.0060,
    y: 40.7128,
    spatialReference: { wkid: 4326 }
  })
  .timeExtent(timeExtent)
  .returnCatalogItems(true)
  .run()
```

## Response Format

The identify operation returns detailed pixel and metadata information:

```typescript
interface IdentifyImageResponse {
  location: {
    x: number
    y: number
    spatialReference: object
  }
  pixelValues?: Array<number>
  name?: string
  properties?: Record<string, any>
  catalogItems?: Array<{
    id: number
    name: string
    acquisitionDate: number
    metadata: Record<string, any>
  }>
  value?: string
  geometry?: Geometry
}
```

## Pixel Value Interpretation

```typescript
// Process pixel values for analysis
const processPixelData = async (geometry) => {
  const identify = new IdentifyImage({
    url: 'https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer'
  })
  
  const result = await identify.at(geometry).run()
  
  if (result.pixelValues && result.pixelValues.length >= 4) {
    const [red, green, blue, nir] = result.pixelValues
    
    // Calculate NDVI
    const ndvi = (nir - red) / (nir + red)
    
    console.log('NDVI value:', ndvi)
    console.log('Classification:', ndvi > 0.3 ? 'Vegetation' : 'Non-vegetation')
  }
}
```

## Common Use Cases

### Environmental Monitoring
```typescript
const environmentalMonitor = new IdentifyImage({
  url: 'https://services.arcgisonline.com/arcgis/rest/services/Specialty/LandsatGLS/ImageServer'
})

const samplePoint = {
  x: -120.5,
  y: 35.5,
  spatialReference: { wkid: 4326 }
}

const data = await environmentalMonitor
  .at(samplePoint)
  .renderingRule({ rasterFunction: 'Natural Color' })
  .run()
```

### Agricultural Analysis
```typescript
const cropAnalysis = new IdentifyImage({
  url: 'https://services.arcgisonline.com/arcgis/rest/services/Specialty/NAIP/ImageServer'
})

const fieldLocation = {
  x: -98.5,
  y: 39.5,
  spatialReference: { wkid: 4326 }
}

const cropData = await cropAnalysis
  .at(fieldLocation)
  .pixelSize({ x: 1, y: 1 }) // 1-meter resolution
  .returnPixelValues(true)
  .run()
```