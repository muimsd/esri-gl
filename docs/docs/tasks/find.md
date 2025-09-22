# Find

Perform text-based searches across multiple fields in ArcGIS Feature Services. Perfect for implementing search functionality that looks for text matches across various attribute fields.

## Interactive Demo

<iframe 
  src="/examples/find-task.html" 
  style={{width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '4px'}}
  title="Find Task Demo"
></iframe>

_Search for text across multiple fields in the USA MapService. Try searching for state abbreviations like "CA", "TX", or "NY" in the STATE_ABBR field. Results are highlighted in green on the map. Experiment with different search types (starts with vs contains) and field combinations._

## Quick Start

```typescript
import { Find } from 'esri-gl';

// Create find task
const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

// Search for text across specified fields
const results = await findTask
  .text('California')
  .fields(['state_name', 'state_abbr'])
  .layers([0, 1, 2])
  .run();
```

## Constructor

```typescript
new Find(options: FindOptions)
```

### Options

| Option         | Type            | Default | Description                   |
| -------------- | --------------- | ------- | ----------------------------- |
| url            | `string`        |         | **Required** MapService URL   |
| layers         | `Array<number>` |         | Layers to search in           |
| searchText     | `string`        |         | Text to search for            |
| searchFields   | `string[]`      |         | Fields to search in           |
| contains       | `boolean`       | `true`  | Use substring matching        |
| returnGeometry | `boolean`       | `false` | Include feature geometry      |
| layerDefs      | `object`        |         | Layer definition expressions  |
| sr             | `number`        |         | Spatial reference for results |
| token          | `string`        |         | Authentication token          |

## Chainable Methods

### `.text(searchText)`

Set the text to search for.

- **searchText**: `string` - Text to find in feature attributes

### `.fields(fieldArray)`

Specify which fields to search in.

- **fieldArray**: `string[]` - Array of field names to search

### `.layers(layerIds)`

Set which layers to search.

- **layerIds**: `number[]` - Array of layer IDs to search

### `.contains(useSubstring)`

Control substring vs exact matching.

- **useSubstring**: `boolean` - If true, finds partial matches

### `.returnGeometry(include)`

Control geometry inclusion in results.

- **include**: `boolean` - Whether to return geometry

### `.layerDefinitions(definitions)`

Apply layer definition filters.

- **definitions**: `object` - Layer-specific WHERE clauses

### `.spatialReference(sr)`

Set output spatial reference.

- **sr**: `number` - WKID for result geometry

### `.run()`

Execute the find operation and return results.

## Usage Examples

### Basic Text Search

```javascript
const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

const results = await findTask
  .text('Texas')
  .fields(['state_name', 'state_abbr'])
  .layers([2]) // Search only states layer
  .run();
```

### Multi-Field Search

```javascript
const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

const results = await findTask
  .text('Los Angeles')
  .fields(['city_name', 'areaname', 'name'])
  .layers([0, 1]) // Search cities and highways layers
  .contains(true) // Allow partial matches
  .returnGeometry(true)
  .run();
```

### Search with Layer Definitions

```javascript
const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

const results = await findTask
  .text('Interstate')
  .fields(['route_name', 'route_number'])
  .layers([1])
  .layerDefinitions({
    1: "route_type = 'Interstate'", // Only search Interstate highways
  })
  .run();
```

### Exact Match Search

```javascript
const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

const results = await findTask
  .text('CA')
  .fields(['state_abbr'])
  .layers([2])
  .contains(false) // Exact match only
  .run();
```

### Search with Spatial Reference

```javascript
const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

const results = await findTask
  .text('New York')
  .fields(['city_name'])
  .layers([0])
  .returnGeometry(true)
  .spatialReference(3857) // Web Mercator
  .run();
```

### Multi-Layer Search

```javascript
const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

// Search for "San" across multiple layers and fields
const results = await findTask
  .text('San')
  .fields(['city_name', 'areaname', 'state_name'])
  .layers([0, 1, 2]) // Cities, highways, and states
  .contains(true)
  .returnGeometry(true)
  .run();

// Results will contain features from all matching layers
console.log(`Found ${results.length} features across layers`);
```

## Key Features

- **Text Search** - Find features containing specific text
- **Multi-Field Search** - Search across multiple attribute fields
- **Multi-Layer Search** - Search multiple layers simultaneously
- **Flexible Matching** - Exact match or substring (contains) search
- **Layer Filtering** - Apply additional WHERE clause filters
- **Geometry Support** - Optionally return feature geometry
- **Spatial Reference** - Control output coordinate system

## Search Tips

- Use `contains(true)` for broader search results
- Combine with `layerDefinitions()` to narrow search scope
- Search specific fields rather than all fields for better performance
- Use appropriate spatial reference for your mapping application

## API Reference

For detailed parameter specifications, see [Find API Reference](../api/find).
