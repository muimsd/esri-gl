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
  .fields(['state_name', 'pop2000'])
  .returnGeometry(true)
  .run();
```

`run()` resolves to a GeoJSON `FeatureCollection`.

## Constructor

```typescript
new Query(urlOrOptions: string | QueryOptions | Service)
query(urlOrOptions: string | QueryOptions) // convenience factory
```

A bare URL string, an options object, or a `Service` instance (whose `url` and authentication the
task then shares) are all accepted.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required.** Feature Service layer URL (or a MapServer URL used with `.layer(id)`) |
| where | `string` | `'1=1'` | SQL WHERE clause |
| outFields | `string \| string[]` | `'*'` | Fields to return |
| returnGeometry | `boolean` | `true` | Include feature geometry |
| spatialRel | `string` | | Spatial relationship (set for you by the spatial methods) |
| geometry | `object` | | Spatial filter geometry |
| geometryType | `string` | | Type of spatial filter geometry |
| inSR | `string \| number` | | Input spatial reference |
| outSR | `string \| number` | `4326` | Output spatial reference |
| orderByFields | `string` | | Result ordering, e.g. `'pop2000 DESC'` |
| groupByFieldsForStatistics | `string` | | Fields to group statistics by |
| outStatistics | `object[]` | | Statistical calculations |
| resultOffset | `number` | | Starting record index |
| resultRecordCount | `number` | | Maximum records to return |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| gdbVersion | `string` | | Geodatabase version to query |
| historicMoment | `number` | | Historic moment timestamp |
| returnZ / returnM / returnTrueCurves | `boolean` | | Geometry options |
| token | `string` | | Authentication token |
| apiKey | `string` | | ArcGIS Location Platform API key |
| authentication | `IAuthenticationManager \| string` | | ArcGIS REST JS auth manager ([guide](../guides/authentication)) |

## Chainable Methods

| Method | Parameter | Description |
|--------|-----------|-------------|
| `.where(condition)` | `string` | SQL WHERE clause (e.g. `'pop2000 > 1000000'`) |
| `.fields(fields)` | `string \| string[]` | Fields to return (`'*'` or `['*']` for all) |
| `.returnGeometry(include)` | `boolean` | Include geometry in results |
| `.returnM(include)` | `boolean` | Include M values in returned geometry |
| `.orderBy(field, order?)` | `string, 'ASC' \| 'DESC'` | Append a sort field (default `'ASC'`); call repeatedly to sort by more |
| `.offset(n)` | `number` | Starting record index (`resultOffset`) |
| `.limit(n)` | `number` | Page size (`resultRecordCount`) |
| `.precision(places)` | `number` | Decimal places for returned geometry |
| `.featureIds(ids)` | `Array<number \| string> \| string` | Restrict the query to specific object ids |
| `.distinct()` | | Return distinct values only (also turns geometry off) |
| `.layer(layerId)` | `number` | Target a sublayer, for MapServer URLs |
| `.between(start, end)` | `Date \| number` | Set a time range for temporal queries |
| `.simplify(map, factor)` | `Map, number` | Set `maxAllowableOffset` from the map resolution |
| `.pixelSize(point)` | `{x, y}` | Pixel size, for image service queries |
| `.transform(datumTransformation)` | `number \| object` | Datum transformation for the query geometry |
| `.token(authToken)` | `string` | Set authentication token |

### Spatial Filters

Each of these sets the query geometry and its `spatialRel` in one call:

| Method | `spatialRel` |
|--------|--------------|
| `.intersects(geometry)` | `esriSpatialRelIntersects` |
| `.within(geometry)` | `esriSpatialRelContains` |
| `.contains(geometry)` | `esriSpatialRelWithin` |
| `.crosses(geometry)` | `esriSpatialRelCrosses` |
| `.touches(geometry)` | `esriSpatialRelTouches` |
| `.overlaps(geometry)` | `esriSpatialRelOverlaps` |
| `.bboxIntersects(geometry)` | `esriSpatialRelEnvelopeIntersects` |
| `.nearby(latlng, radiusMeters)` | `esriSpatialRelIntersects` with a distance (ArcGIS Server 10.3+) |

`within` and `contains` map to the `spatialRel` that looks like their opposite, and that is
correct: ArcGIS expresses `spatialRel` relative to the **search** geometry, so "return features
within my search geometry" is `esriSpatialRelContains`. This matches Esri Leaflet.

Geometry may be an Esri geometry object, a `{ lat, lng }` point, or a Leaflet-style
`{ _southWest, _northEast }` bounds — the task converts it and sets `geometryType` for you.

Statistics have no chainable setter; pass `outStatistics` (with `groupByFieldsForStatistics`) as
constructor options.

## Execution Methods

### `.run()` → `Promise<GeoJSON.FeatureCollection>`

Execute the query and return matching features. Requests `f=geojson` and falls back to `f=json`
(converting the response) if the service rejects it.

### `.count()` → `Promise<number>`

Return the count of matching features without fetching them.

### `.ids()` → `Promise<Array<number | string>>`

Return only the object IDs of matching features.

### `.bounds()` → `Promise<{ _southWest, _northEast }>`

Return the extent of the matching features (ArcGIS Server 10.3+).

### `.runAll(options?)` → `Promise<GeoJSON.FeatureCollection>`

Automatically paginate through all matching results, following `exceededTransferLimit`. Accepts an
optional `{ maxPages: number }` (default `100`) to limit the number of pages fetched.

## Examples

### Attribute Query

```javascript
const results = await new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
})
  .where("state_name = 'California'")
  .fields(['state_name', 'pop2000', 'state_abbr'])
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
  .intersects(bbox)
  .fields(['city_name', 'pop1990', 'pop2000'])
  .orderBy('pop2000', 'DESC')
  .run();
```

### Statistical Query

Statistics are configured through the constructor's `outStatistics` option:

```javascript
const stats = await new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2',
  outStatistics: [
    { statisticType: 'sum', onStatisticField: 'pop2000', outStatisticFieldName: 'total_population' },
    { statisticType: 'avg', onStatisticField: 'pop2000', outStatisticFieldName: 'avg_population' }
  ],
  returnGeometry: false
})
  .where('pop2000 > 0')
  .run();

// Statistic values arrive as the properties of a single feature
console.log(stats.features[0].properties);
```

### Pagination

```javascript
const queryTask = new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1'
})
  .where('pop1990 > 100000')
  .fields(['city_name', 'pop1990'])
  .orderBy('city_name');

const page1 = await queryTask.offset(0).limit(10).run();
const page2 = await queryTask.offset(10).limit(10).run();

// Or fetch all pages automatically — runAll() starts from the current offset,
// so reset it first when reusing a task that has already been paged.
const allResults = await queryTask.offset(0).runAll({ maxPages: 10 });
```
