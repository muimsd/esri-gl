# IdentifyFeatures

Identify features at a point across multiple map services, with advanced tolerance and filtering options.

## Constructor

```typescript
new IdentifyFeatures(options: IdentifyOptions)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** MapService URL |
| layers | `Array<number> \| string` | `'all'` | Layers to identify |
| tolerance | `number` | `3` | Search tolerance in pixels |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| dynamicLayers | `Array<object>` | | Dynamic layer definitions |
| mapExtent | `object` | | Current map extent |
| imageDisplay | `object` | | Map image parameters |
| returnFieldName | `boolean` | `false` | Return field names with values |
| returnUnformattedValues | `boolean` | `false` | Return raw field values |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
task.tolerance(5).layers([0, 1]).returnGeometry(true)
```

### Configuration Methods

| Method | Description |
|--------|-------------|
| `layers(layers)` | Set layers to identify |
| `tolerance(pixels)` | Set search tolerance |
| `returnGeometry(boolean)` | Include geometry in results |
| `returnFieldName(boolean)` | Include field names |
| `token(token)` | Set authentication token |

## Execution Methods

### `.at(point, map, callback?)`

Identify features at a geographic point.

```typescript
// Promise-based
const results = await task.at({ lng: -95.7, lat: 37.1 }, map)

// Callback-based  
task.at({ lng: -95.7, lat: 37.1 }, map, (error, results) => {
    if (error) {
        console.error(error)
    } else {
        console.log(results)
    }
})
```

**Parameters:**
- `point` - `{lng: number, lat: number}` - Geographic coordinates
- `map` - MapLibre/Mapbox GL map instance
- `callback` - Optional callback function

## Basic Example

```typescript
import { IdentifyFeatures } from 'esri-map-gl'

// Create identify task
const identifyTask = new IdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 5,
    returnGeometry: true,
    layers: 'all'
})

// Handle map clicks
map.on('click', async (e) => {
    try {
        const results = await identifyTask.at(e.lngLat, map)
        
        if (results.results.length > 0) {
            console.log('Identified features:', results.results)
            showPopup(e.lngLat, results.results)
        } else {
            console.log('No features found')
        }
    } catch (error) {
        console.error('Identify failed:', error)
    }
})
```

## Advanced Configuration

```typescript
// Configure with chained methods
const advancedTask = new IdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer'
})
.layers([0, 1, 2]) // Specific layers only
.tolerance(10) // Larger search area
.returnGeometry(true) // Include feature shapes
.returnFieldName(true) // Include field names
.returnUnformattedValues(true) // Raw values

// Execute identify
const results = await advancedTask.at({ lng: -95.7, lat: 37.1 }, map)
```

## Multiple Services

```typescript
// Identify across multiple services
const services = [
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer'
]

async function identifyMultiple(point, map) {
    const tasks = services.map(url => 
        new IdentifyFeatures({ url })
            .tolerance(5)
            .returnGeometry(true)
    )
    
    const results = await Promise.all(
        tasks.map(task => task.at(point, map))
    )
    
    // Combine results from all services
    const allFeatures = results.flatMap(result => result.results)
    return allFeatures
}
```

## Custom Popup Display

```typescript
function showPopup(lngLat, features) {
    // Create popup content
    const content = features.map(feature => {
        const { layerName, attributes } = feature
        
        const rows = Object.entries(attributes)
            .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
            .join('')
            
        return `
            <div>
                <h3>${layerName}</h3>
                <table>
                    ${rows}
                </table>
            </div>
        `
    }).join('<hr>')
    
    // Show popup
    new maplibregl.Popup()
        .setLngLat(lngLat)
        .setHTML(content)
        .addTo(map)
}
```

## Response Format

```typescript
interface IdentifyResponse {
    results: IdentifyResult[]
}

interface IdentifyResult {
    layerId: number
    layerName: string
    value: string
    displayFieldName: string
    attributes: Record<string, any>
    geometry?: GeoJSON.Geometry
    geometryType?: string
    feature?: GeoJSON.Feature
}
```

## Error Handling

```typescript
// Handle different types of errors
map.on('click', async (e) => {
    try {
        const results = await identifyTask.at(e.lngLat, map)
        handleResults(results)
    } catch (error) {
        if (error.code === 400) {
            console.error('Invalid request parameters')
        } else if (error.code === 404) {
            console.error('Service not found')
        } else if (error.name === 'NetworkError') {
            console.error('Network connection failed')
        } else {
            console.error('Unexpected error:', error.message)
        }
    }
})
```

## Performance Tips

1. **Set appropriate tolerance**: Balance accuracy vs. performance
2. **Limit layers**: Only identify needed layers
3. **Avoid geometry**: Skip geometry if not needed for display
4. **Cache tasks**: Reuse task instances for multiple identifies
5. **Debounce clicks**: Prevent rapid successive requests

```typescript
// Debounced identify
let identifyTimeout
map.on('click', (e) => {
    clearTimeout(identifyTimeout)
    identifyTimeout = setTimeout(async () => {
        const results = await identifyTask.at(e.lngLat, map)
        handleResults(results)
    }, 250)
})
```

## Integration with Services

```typescript
// Use with DynamicMapService
import { DynamicMapService, IdentifyFeatures } from 'esri-map-gl'

const service = new DynamicMapService('usa-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    layers: [0, 1, 2, 3]
})

// Create identify task for same service
const identifyTask = new IdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})
.layers([0, 1, 2, 3]) // Match service layers
.tolerance(5)

// Alternative: use service's built-in identify method
map.on('click', async (e) => {
    // Option 1: Task-based (more flexible)
    const taskResults = await identifyTask.at(e.lngLat, map)
    
    // Option 2: Service method (simpler)
    const serviceResults = await service.identify(e.lngLat, true)
})
```