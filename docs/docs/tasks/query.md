# Query

Perform advanced queries against ArcGIS Feature Services with attribute filters, spatial filters, and statistical analysis.

## Interactive Demo

<iframe
  src="/examples/query-task.html"
  style={{width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '4px'}}
  title="Query Task Demo"
></iframe>

_Execute SQL-like queries against the USA states layer. Modify the WHERE clause to filter by population, state name, or other attributes. Toggle "Return Geometry" to show results on the map. Example queries: `pop2000 > 5000000`, `state_name LIKE '%A%'`, `state_abbr IN ('CA','TX','NY')`._

## Quick Start

```typescript
import { Query } from 'esri-gl';

const queryTask = new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
});

const results = await queryTask
  .where('pop2000 > 1000000')
  .outFields(['state_name', 'pop2000'])
  .returnGeometry(true)
  .run();
```

## Constructor

```typescript
new Query(options: QueryOptions)
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required.** Feature Service Layer URL |
| where | `string` | `'1=1'` | SQL WHERE clause |
| outFields | `string[]` | `['*']` | Fields to return |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| spatialRel | `string` | `'esriSpatialRelIntersects'` | Spatial relationship |
| geometry | `object` | | Spatial filter geometry |
| geometryType | `string` | | Type of spatial filter geometry |
| inSR | `number` | | Input spatial reference |
| outSR | `number` | | Output spatial reference |
| orderByFields | `string[]` | | Result ordering |
| groupByFieldsForStatistics | `string[]` | | Fields to group statistics by |
| outStatistics | `object[]` | | Statistical calculations |
| resultOffset | `number` | `0` | Starting record index |
| resultRecordCount | `number` | | Maximum records to return |
| token | `string` | | Authentication token |

## Chainable Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.where(condition)` | `string` | SQL WHERE clause (e.g. `'pop2000 > 1000000'`) |
| `.outFields(fields)` | `string[]` | Fields to return (`['*']` for all) |
| `.returnGeometry(include)` | `boolean` | Include geometry in results |
| `.orderBy(fields)` | `string \| string[]` | Sort fields with optional `ASC`/`DESC` |
| `.spatialFilter(geometry, relation)` | `object, string` | Apply spatial filter |
| `.statistics(stats)` | `object[]` | Define statistical calculations |
| `.paginate(offset, count)` | `number, number` | Set pagination offset and page size |

## Execution Methods

### `.run()` → `Promise<QueryResponse>`

Execute the query and return matching features.

### `.count()` → `Promise<number>`

Return the count of matching features without fetching them.

### `.ids()` → `Promise<number[]>`

Return only the object IDs of matching features.

### `.runAll(options?)` → `Promise<QueryResponse>`

Automatically paginate through all matching results. Accepts an optional `{ maxPages: number }` to limit the number of pages fetched.

## Examples

### Attribute Query

```javascript
const results = await new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
})
  .where("state_name = 'California'")
  .outFields(['state_name', 'pop2000', 'state_abbr'])
  .returnGeometry(true)
  .run();
```

### Spatial Query

```javascript
const bbox = {
  xmin: -125, ymin: 30, xmax: -115, ymax: 40,
  spatialReference: { wkid: 4326 }
};

const results = await new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1'
})
  .spatialFilter(bbox, 'esriSpatialRelIntersects')
  .outFields(['city_name', 'pop1990', 'pop2000'])
  .orderBy(['pop2000 DESC'])
  .run();
```

### Statistical Query

```javascript
const stats = await new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
})
  .where('pop2000 > 0')
  .statistics([
    { statisticType: 'sum', onStatisticField: 'pop2000', outStatisticFieldName: 'total_population' },
    { statisticType: 'avg', onStatisticField: 'pop2000', outStatisticFieldName: 'avg_population' }
  ])
  .run();
```

### Pagination

```javascript
const queryTask = new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1'
})
  .where('pop1990 > 100000')
  .outFields(['city_name', 'pop1990'])
  .orderBy(['city_name ASC']);

const page1 = await queryTask.paginate(0, 10).run();
const page2 = await queryTask.paginate(10, 10).run();

// Or fetch all pages automatically
const allResults = await queryTask.runAll({ maxPages: 10 });
```
