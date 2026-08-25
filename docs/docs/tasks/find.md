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
new Find(urlOrOptions: string | FindOptions | Service)
find(urlOrOptions: string | FindOptions) // convenience factory
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required.** MapServer URL |
| layers | `number \| number[] \| string` | `'all'` | Layers to search |
| searchText | `string` | `''` | Text to search for |
| searchFields | `string \| string[]` | | Fields to search in (all fields when omitted) |
| contains | `boolean` | `true` | Use substring matching |
| returnGeometry | `boolean` | `true` | Include feature geometry |
| layerDefs | `string` | | Layer definition expressions, e.g. `"0:POP > 100000"` |
| sr | `string \| number` | | Spatial reference for results |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| dynamicLayers | `Array<object>` | | Search a dynamic layer definition instead of published layers |
| returnZ / returnM | `boolean` | | Include Z / M values in returned geometry |
| gdbVersion | `string` | | Geodatabase version to search |
| token | `string` | | Authentication token |
| apiKey | `string` | | ArcGIS Location Platform API key |
| authentication | `IAuthenticationManager \| string` | | ArcGIS REST JS auth manager ([guide](../guides/authentication)) |

## Chainable Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.text(searchText)` | `string` | Set the text to search for |
| `.fields(fields)` | `string \| string[]` | Fields to search in |
| `.layers(layers)` | `number \| number[] \| string` | Layers to search |
| `.contains(useSubstring)` | `boolean` | Substring matching (`true`) or exact match (`false`) |
| `.returnGeometry(include)` | `boolean` | Include feature geometry in results |
| `.layerDefs(layerId, where)` | `number \| string, string` | Add a WHERE clause for one layer (call repeatedly to add more) |
| `.spatialReference(sr)` | `string \| number` | Set output spatial reference WKID (alias: `.sr()`) |
| `.maxAllowableOffset(offset)` | `number` | Generalize the returned geometry |
| `.precision(places)` | `number` | Decimal places for returned geometry |
| `.dynamicLayers(layers)` | `object[]` | Search a dynamic layer definition |
| `.returnZ(include)` / `.returnM(include)` | `boolean` | Include Z / M values |
| `.gdbVersion(version)` | `string` | Search a specific geodatabase version |
| `.token(authToken)` | `string` | Set authentication token |

## Execution Method

### `.run()` → `Promise<GeoJSON.FeatureCollection>`

Execute the find operation and return matching features as GeoJSON. Each feature's `properties`
carry the ArcGIS attributes plus `layerId`, `layerName`, `foundFieldName` and `value`; Esri point,
polyline and polygon geometries are converted, and any other geometry type comes back as `null`.

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
