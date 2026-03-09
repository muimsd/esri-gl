# Find

Perform text-based searches across multiple fields and layers in an ArcGIS MapServer.

## Interactive Demo

<iframe
  src="/examples/find-task.html"
  style={{width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '4px'}}
  title="Find Task Demo"
></iframe>

_Search for text across multiple fields in the USA MapService. Try searching for state abbreviations like "CA", "TX", or "NY". Results are highlighted in green on the map._

## Quick Start

```typescript
import { Find } from 'esri-gl';

const findTask = new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
});

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required.** MapServer URL |
| layers | `Array<number>` | | Layers to search |
| searchText | `string` | | Text to search for |
| searchFields | `string[]` | | Fields to search in |
| contains | `boolean` | `true` | Use substring matching |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| layerDefs | `object` | | Layer definition expressions |
| sr | `number` | | Spatial reference for results |
| token | `string` | | Authentication token |

## Chainable Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.text(searchText)` | `string` | Set the text to search for |
| `.fields(fieldArray)` | `string[]` | Fields to search in |
| `.layers(layerIds)` | `number[]` | Layers to search |
| `.contains(useSubstring)` | `boolean` | Substring matching (`true`) or exact match (`false`) |
| `.returnGeometry(include)` | `boolean` | Include feature geometry in results |
| `.layerDefinitions(defs)` | `object` | Apply layer-specific WHERE clauses |
| `.spatialReference(sr)` | `number` | Set output spatial reference WKID |

## Execution Method

### `.run()` → `Promise<FindResponse>`

Execute the find operation and return matching features.

## Examples

### Basic Search

```javascript
const results = await new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
})
  .text('Texas')
  .fields(['state_name', 'state_abbr'])
  .layers([2])
  .run();
```

### Multi-Field Search

```javascript
const results = await new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
})
  .text('Los Angeles')
  .fields(['city_name', 'areaname', 'name'])
  .layers([0, 1])
  .contains(true)
  .returnGeometry(true)
  .run();
```

### Exact Match

```javascript
const results = await new Find({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
})
  .text('CA')
  .fields(['state_abbr'])
  .layers([2])
  .contains(false)
  .run();
```
