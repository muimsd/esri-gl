# Query

Perform advanced queries against ArcGIS Feature Services with spatial filters, attribute conditions, and statistical analysis.

## Interactive Demo

*Note: Demo would show query functionality with filters and attribute conditions - implementation pending*

## Quick Start

```typescript
import { Query } from 'esri-gl';

// Create query task
const queryTask = new Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
});

// Execute query with WHERE clause
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
| url | `string` | | **Required** Feature Service Layer URL |
| where | `string` | `'1=1'` | SQL WHERE clause for filtering |
| outFields | `string[]` | `['*']` | Fields to return in results |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| spatialRel | `string` | `'esriSpatialRelIntersects'` | Spatial relationship |
| geometry | `object` | | Spatial filter geometry |
| geometryType | `string` | | Type of spatial filter geometry |
| inSR | `number` | | Input spatial reference |
| outSR | `number` | | Output spatial reference |
| orderByFields | `string[]` | | Result ordering specification |
| groupByFieldsForStatistics | `string[]` | | Fields to group statistics by |
| outStatistics | `object[]` | | Statistical calculations |
| resultOffset | `number` | `0` | Starting record index |
| resultRecordCount | `number` | | Maximum records to return |
| token | `string` | | Authentication token |

## Chainable Methods

### `.where(condition)`
Set SQL WHERE clause for attribute filtering.
- **condition**: `string` - SQL condition (e.g., 'pop2000 > 1000000')

### `.outFields(fields)`
Specify which fields to return.
- **fields**: `string[]` - Array of field names or ['*'] for all

### `.returnGeometry(include)`
Control geometry inclusion in results.
- **include**: `boolean` - Whether to return geometry

### `.orderBy(fields)`
Set result ordering.
- **fields**: `string` or `string[]` - Field names with optional ASC/DESC

### `.spatialFilter(geometry, relation)`
Apply spatial filtering.
- **geometry**: `object` - Filter geometry
- **relation**: `string` - Spatial relationship type

### `.statistics(stats)`
Define statistical calculations.
- **stats**: `object[]` - Statistics definition array

### `.paginate(offset, count)`
Set result pagination.
- **offset**: `number` - Starting record index
- **count**: `number` - Maximum records to return

### `.run()`
Execute the query and return results.

## Usage Examples

### Basic Attribute Query
```javascript
const queryTask = new EsriGL.Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
});

const results = await queryTask
  .where('state_name = \'California\'')
  .outFields(['state_name', 'pop2000', 'state_abbr'])
  .returnGeometry(true)
  .run();
```

### Spatial Query
```javascript
const queryTask = new EsriGL.Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1'
});

// Query cities within a bounding box
const bbox = {
  xmin: -125, ymin: 30, xmax: -115, ymax: 40,
  spatialReference: { wkid: 4326 }
};

const results = await queryTask
  .spatialFilter(bbox, 'esriSpatialRelIntersects')
  .outFields(['city_name', 'pop1990', 'pop2000'])
  .orderBy(['pop2000 DESC'])
  .run();
```

### Statistical Query
```javascript
const queryTask = new EsriGL.Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
});

const stats = await queryTask
  .where('pop2000 > 0')
  .statistics([
    {
      statisticType: 'sum',
      onStatisticField: 'pop2000',
      outStatisticFieldName: 'total_population'
    },
    {
      statisticType: 'avg',
      onStatisticField: 'pop2000', 
      outStatisticFieldName: 'avg_population'
    }
  ])
  .run();
```

### Paginated Query
```javascript
const queryTask = new EsriGL.Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/1'
});

// Get first 10 results
const page1 = await queryTask
  .where('pop1990 > 100000')
  .outFields(['city_name', 'pop1990'])
  .orderBy(['city_name ASC'])
  .paginate(0, 10)
  .run();

// Get next 10 results
const page2 = await queryTask
  .paginate(10, 10)
  .run();
```

### Complex Query with Multiple Filters
```javascript
const queryTask = new EsriGL.Query({
  url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2'
});

const results = await queryTask
  .where('pop2000 > 5000000 AND state_name LIKE \'%A%\'')
  .outFields(['state_name', 'pop2000', 'sub_region'])
  .returnGeometry(true)
  .orderBy(['pop2000 DESC', 'state_name ASC'])
  .run();
```

## Key Features

- **Advanced Filtering** - SQL WHERE clauses with complex conditions
- **Spatial Queries** - Filter by geometry intersection, proximity, etc.
- **Statistical Analysis** - Sum, count, average, min/max calculations
- **Result Ordering** - Sort by multiple fields ascending/descending
- **Pagination** - Handle large result sets efficiently
- **Field Selection** - Return only needed attributes
- **Geometry Control** - Include/exclude spatial data as needed

## API Reference

For detailed parameter specifications, see [Query API Reference](../api/query).