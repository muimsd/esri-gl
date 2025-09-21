# Find

Task for finding features by searching text values across multiple fields and layers in ArcGIS Map Services.

## Constructor

```typescript
new Find(options: FindOptions)
```

| Argument | Type | Description |
|----------|------|-------------|
| options | `FindOptions` | Configuration options for the find operation |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** MapService URL |
| searchText | `string` | | **Required** Text to search for |
| searchFields | `Array<string>` | | Fields to search in |
| layers | `Array<number>` | | Layers to search |
| contains | `boolean` | `true` | Whether to find partial matches |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| dynamicLayers | `Array<object>` | | Dynamic layer definitions |
| returnFieldName | `boolean` | `false` | Return field names with values |
| returnUnformattedValues | `boolean` | `false` | Return raw field values |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
find.text('California').in(['STATE_NAME']).layers([0, 1])
```

| Method | Description |
|--------|-------------|
| `text(searchText)` | Set text to search for |
| `in(fields)` | Set fields to search in |
| `layers(layerIds)` | Set layers to search |
| `contains(boolean)` | Enable/disable partial matching |
| `returnGeometry(boolean)` | Include geometry in results |
| `returnFieldName(boolean)` | Include field names |
| `token(token)` | Set authentication token |

## Execution Methods

### `.run()`

Execute the find operation with current parameters.

**Returns:** `Promise<FeatureCollection>`

## Basic Example

```typescript
import { Find } from 'esri-gl'

// Find features by text search
const find = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})

const results = await find
  .text('California')
  .in(['STATE_NAME'])
  .layers([2])
  .returnGeometry(true)
  .run()
```

## Advanced Usage

```typescript
// Search across multiple fields and layers
const advancedFind = new Find({
  url: 'https://services.arcgis.com/my-service/MapServer',
  contains: false // Exact match only
})

const features = await advancedFind
  .text('Los Angeles')
  .in(['CITY_NAME', 'COUNTY_NAME', 'ALIAS'])
  .layers([0, 1, 3])
  .returnGeometry(true)
  .returnFieldName(true)
  .run()
```

## Search Options

```typescript
// Case-sensitive exact match
const exactFind = new Find({
  url: 'https://services.arcgis.com/my-service/MapServer'
})

const exact = await exactFind
  .text('New York')
  .contains(false) // Exact match
  .in(['OFFICIAL_NAME'])
  .run()

// Partial match search
const partialFind = new Find({
  url: 'https://services.arcgis.com/my-service/MapServer'
})

const partial = await partialFind
  .text('San')
  .contains(true) // Will find "San Francisco", "San Diego", etc.
  .in(['CITY_NAME'])
  .run()
```

## Multi-layer Search

```typescript
// Search across multiple layers
const multiLayerFind = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
})

const results = await multiLayerFind
  .text('Interstate')
  .in(['NAME', 'ROUTE_TYPE'])
  .layers([0, 1, 2]) // Search cities, highways, and states
  .returnGeometry(false)
  .run()
```

## Response Format

The find operation returns a GeoJSON FeatureCollection:

```typescript
interface FindResponse {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry?: Geometry
    properties: Record<string, any>
    layerId?: number
    layerName?: string
    foundFieldName?: string
    value?: string
  }>
}
```

## Common Use Cases

### City/Address Search
```typescript
const citySearch = new Find({
  url: 'https://services.arcgis.com/census/MapServer'
})

const cities = await citySearch
  .text('Springfield')
  .in(['CITY_NAME', 'PLACE_NAME'])
  .contains(false)
  .run()
```

### Wildcard-style Search
```typescript
const wildcardFind = new Find({
  url: 'https://services.arcgis.com/transportation/MapServer'
})

const highways = await wildcardFind
  .text('I-')
  .in(['ROUTE_NAME'])
  .contains(true) // Will find "I-95", "I-10", etc.
  .layers([1])
  .run()
```