# Tasks Overview

<iframe src="/examples/identify-features-task.html" width="100%" height="400" frameBorder="0" style={{border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px'}}></iframe>

Tasks provide chainable operations for querying and analyzing Esri services, modeled after Esri Leaflet's task pattern. They offer more flexibility and advanced options compared to direct service methods.

## Task Architecture

Tasks follow a consistent pattern:
1. **Create** - Instantiate with service URL and options
2. **Configure** - Chain methods to set parameters  
3. **Execute** - Call `.at()`, `.run()`, or `.request()` to execute

```typescript
const task = new IdentifyFeatures({ url: '...' })
  .layers([0, 1, 2])
  .tolerance(5)
  .returnGeometry(true)

const results = await task.at({ lng: -95, lat: 37 }, map)
```

## Available Tasks

### Identification Tasks
- **[IdentifyFeatures](./identify-features)** - Identify features at a point across multiple services
- **[IdentifyImage](#)** - Get pixel values from image services

### Query Tasks  
- **[Query](#)** - Advanced feature queries with spatial and attribute filters
- **[Find](#)** - Text-based search across feature services

### Analysis Tasks
- **[GeometryService](#)** - Spatial analysis operations
- **[GP](#)** - Geoprocessing service execution

## Task vs Service Methods

| Aspect | Task | Service Method |
|--------|------|---------------|
| **Flexibility** | ✅ Highly configurable | ❌ Basic options |
| **Chaining** | ✅ Fluent API | ❌ Single call |
| **Reusability** | ✅ Reusable instances | ❌ One-time use |
| **Performance** | ✅ Optimized requests | ✅ Direct calls |
| **Complexity** | ⚠️ More setup | ✅ Simple |

## Common Patterns

### Basic IdentifyFeatures Example

```typescript
import { IdentifyFeatures } from 'esri-gl'

// Create map click handler for feature identification
map.on('click', async (e) => {
  try {
    // Create identify task
    const identifyTask = new IdentifyFeatures({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      returnFieldName: true    // Include field names (constructor option)
    })
    .layers('all')           // Identify on all layers
    .tolerance(5)            // 5 pixel tolerance
    .returnGeometry(true)    // Include feature geometry

    // Execute identification at click point
    const results = await identifyTask.at(e.lngLat, map)
    
    if (results.length > 0) {
      // Show popup with first result
      const feature = results[0]
      const properties = feature.attributes
      
      let content = `<div><strong>${feature.layerName}</strong><br><br>`
      
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          content += `<strong>${key}:</strong> ${value}<br>`
        }
      })
      content += '</div>'
      
      new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(map)
    }
  } catch (error) {
    console.error('Identify failed:', error)
  }
})
```

### Task Chaining

```typescript
import { IdentifyFeatures } from 'esri-gl'

// Configure task with chained methods
const identifyTask = new IdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})
.layers('all')
.tolerance(5)
.returnGeometry(true)
.returnFieldName(true)

// Execute at different locations
const results1 = await identifyTask.at({ lng: -95, lat: 37 }, map)
const results2 = await identifyTask.at({ lng: -118, lat: 34 }, map)
```

### Task Reuse

```typescript
// Create once, use multiple times
const queryTask = new Query({
    url: 'https://services.arcgis.com/example/FeatureServer/0'
})
.outFields(['*'])
.returnGeometry(true)

// Different queries with same task
const allFeatures = await queryTask.where('1=1').run()
const filtered = await queryTask.where('POP > 100000').run()
```

### Async/Await vs Callbacks

```typescript
// Modern Promise-based approach
try {
    const results = await identifyTask.at(point, map)
    console.log(results)
} catch (error) {
    console.error(error)
}

// Callback approach (Esri Leaflet compatibility)
identifyTask.at(point, map, (error, results) => {
    if (error) {
        console.error(error)
    } else {
        console.log(results)
    }
})
```

## Error Handling

```typescript
import { EsriError } from 'esri-gl'

try {
    const results = await task.run()
} catch (error) {
    if (error instanceof EsriError) {
        console.error('Esri service error:', error.message)
        console.error('Error code:', error.code)
    } else {
        console.error('Network or other error:', error)
    }
}
```

## Performance Considerations

1. **Reuse tasks**: Create once, execute multiple times
2. **Batch requests**: Group related operations when possible
3. **Set appropriate tolerances**: Balance accuracy vs. performance
4. **Limit return fields**: Only request needed data
5. **Use spatial filters**: Reduce server processing

## Next Steps

- [IdentifyFeatures](./identify-features) - Point identification across services
- **Query** - Advanced attribute and spatial queries (coming soon)
- **Find** - Text search capabilities (coming soon)