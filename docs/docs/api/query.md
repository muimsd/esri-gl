# Query

Task for querying features from ArcGIS Feature Services with advanced filtering, spatial queries, and aggregation capabilities.

## Constructor

```typescript
new Query(options: QueryOptions)
```

| Argument | Type | Description |
|----------|------|-------------|
| options | `QueryOptions` | Configuration options for the query operation |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** Feature Service or Map Service layer URL |
| where | `string` | `'1=1'` | SQL WHERE clause |
| outFields | `Array<string>` \| `string` | `'*'` | Fields to return |
| geometry | `object` | | Spatial filter geometry |
| geometryType | `string` | | Type of geometry filter |
| spatialRel | `string` | `'esriSpatialRelIntersects'` | Spatial relationship |
| returnGeometry | `boolean` | `true` | Include feature geometry |
| returnCountOnly | `boolean` | `false` | Return only feature count |
| returnIdsOnly | `boolean` | `false` | Return only object IDs |
| orderByFields | `Array<string>` | | Sort order for results |
| groupByFieldsForStatistics | `Array<string>` | | Fields for grouping statistics |
| outStatistics | `Array<object>` | | Statistical operations to perform |
| resultOffset | `number` | | Offset for pagination |
| resultRecordCount | `number` | | Maximum number of features |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
query.where("STATE_NAME = 'California'").outFields(['NAME', 'POP2000'])
```

| Method | Description |
|--------|-------------|
| `where(clause)` | Set SQL WHERE clause |
| `outFields(fields)` | Set output fields |
| `geometry(geom)` | Set spatial filter geometry |
| `spatialRel(relationship)` | Set spatial relationship |
| `returnGeometry(boolean)` | Include geometry in results |
| `orderBy(fields)` | Set sort order |
| `limit(count)` | Set maximum result count |
| `offset(number)` | Set result offset for pagination |
| `token(token)` | Set authentication token |

## Execution Methods

### `.run()`

Execute the query with current parameters.

**Returns:** `Promise<FeatureCollection>`

### `.count()`

Get the count of features matching the query.

**Returns:** `Promise<number>`

### `.ids()`

Get only the object IDs of matching features.

**Returns:** `Promise<Array<number>>`