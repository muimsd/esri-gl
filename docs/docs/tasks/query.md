# Query Task

Perform advanced queries against ArcGIS Feature Services with spatial filters, attribute conditions, and statistical analysis. The Query task provides the most comprehensive feature querying capabilities.

## Constructor

```typescript
new Query(options)
query(options) // Convenience function
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** URL of the Feature Service layer |
| token | `string` | | Authentication token |
| fetchOptions | `object` | | Additional fetch request options |

## Chainable Methods

### Attribute Filters

#### `.where(condition)`
Set SQL WHERE clause for attribute filtering.

```typescript
query({ url: '...' })
  .where("STATE_NAME = 'California'")
  .where("POPULATION > 1000000")
  .where("DATE_FIELD >= date '2023-01-01'")
```

#### `.objectIds(ids)`
Query specific features by Object IDs.

```typescript
query({ url: '...' }).objectIds([1, 2, 3, 100, 250])
```

### Spatial Filters

#### `.intersects(geometry)`
Find features that intersect with geometry.

```typescript
// Point intersection
query({ url: '...' }).intersects({
  type: 'Point',
  coordinates: [-118, 34]
})

// Polygon intersection
query({ url: '...' }).intersects({
  type: 'Polygon',
  coordinates: [[
    [-118.5, 34.2],
    [-118.2, 34.2], 
    [-118.2, 33.9],
    [-118.5, 33.9],
    [-118.5, 34.2]
  ]]
})
```

#### `.contains(geometry)`
Find features that contain the geometry.

```typescript
query({ url: '...' }).contains({
  type: 'Point',
  coordinates: [-118.2437, 34.0522]
})
```

#### `.within(geometry)`  
Find features within the geometry.

```typescript
query({ url: '...' }).within({
  type: 'Polygon',
  coordinates: [/* polygon coordinates */]
})
```

#### `.nearby(point, distance)`
Find features within distance of a point.

```typescript
query({ url: '...' }).nearby(
  { lng: -118.2437, lat: 34.0522 },
  1000 // meters
)
```

### Output Options

#### `.fields(fieldArray)`
Specify which fields to return.

```typescript
query({ url: '...' })
  .fields(['OBJECTID', 'STATE_NAME', 'POPULATION', 'AREA'])
  .fields('*') // All fields
```

#### `.limit(count)`
Limit number of returned features.

```typescript
query({ url: '...' }).limit(100)
```

#### `.offset(number)`
Set starting record for pagination.

```typescript
query({ url: '...' }).offset(1000).limit(100) // Records 1000-1100
```

#### `.orderBy(field, direction?)`
Sort results by field.

```typescript
query({ url: '...' })
  .orderBy('POPULATION', 'DESC')
  .orderBy('STATE_NAME', 'ASC')
```

#### `.precision(digits)`
Set coordinate precision for geometry.

```typescript
query({ url: '...' }).precision(6) // 6 decimal places
```

## Statistical Queries

#### `.count()`
Return only feature count.

```typescript
const count = await query({ url: '...' })
  .where("POPULATION > 1000000")
  .count()

console.log(`${count} cities with population > 1M`)
```

#### `.bounds()`
Return bounding box of results.

```typescript
const bbox = await query({ url: '...' })
  .where("STATE_NAME = 'California'")
  .bounds()

console.log('California bounds:', bbox)
```

## Usage Examples

### Basic Attribute Query

```typescript
import { query } from 'esri-gl';

// Find large cities
const largeCities = await query({
  url: 'https://services.arcgis.com/.../Cities/FeatureServer/0'
})
.where("POPULATION > 500000")
.fields(['NAME', 'POPULATION', 'STATE'])
.orderBy('POPULATION', 'DESC')
.limit(50);

console.log('Large cities:', largeCities.features);
```

### Spatial Query with Buffer

```typescript
// Find features within 5km of a point
const nearbyFeatures = await query({
  url: 'https://services.arcgis.com/.../Facilities/FeatureServer/0'  
})
.nearby({ lng: -122.4194, lat: 37.7749 }, 5000)
.fields(['NAME', 'TYPE', 'ADDRESS'])
.orderBy('DISTANCE_FROM_POINT');

console.log(`Found ${nearbyFeatures.features.length} nearby facilities`);
```

### Complex Multi-Criteria Query

```typescript
// Complex business location analysis
const businessQuery = await query({
  url: 'https://services.arcgis.com/.../Businesses/FeatureServer/0'
})
.where(`
  BUSINESS_TYPE IN ('Restaurant', 'Retail', 'Office') AND 
  EMPLOYEES > 10 AND 
  REVENUE > 1000000 AND
  OPENED_DATE >= date '2020-01-01'
`)
.intersects({
  type: 'Polygon',
  coordinates: [/* downtown boundary */]
})
.fields(['NAME', 'BUSINESS_TYPE', 'EMPLOYEES', 'REVENUE'])
.orderBy('REVENUE', 'DESC')
.limit(100);

console.log('Qualifying businesses:', businessQuery.features);
```

### Pagination Pattern

```typescript
class PaginatedQuery {
  private queryBase: any;
  private pageSize: number;
  private currentPage: number;

  constructor(baseQuery: any, pageSize = 100) {
    this.queryBase = baseQuery;
    this.pageSize = pageSize;
    this.currentPage = 0;
  }

  async getPage(page: number = 0) {
    const offset = page * this.pageSize;
    
    const result = await this.queryBase
      .offset(offset)
      .limit(this.pageSize);
      
    this.currentPage = page;
    return result;
  }

  async nextPage() {
    return await this.getPage(this.currentPage + 1);
  }

  async previousPage() {
    return await this.getPage(Math.max(0, this.currentPage - 1));
  }

  async getAllPages(maxPages = 100) {
    const allFeatures = [];
    let page = 0;
    
    while (page < maxPages) {
      const result = await this.getPage(page);
      
      if (result.features.length === 0) break;
      
      allFeatures.push(...result.features);
      
      if (result.features.length < this.pageSize) break; // Last page
      
      page++;
    }
    
    return {
      type: 'FeatureCollection',
      features: allFeatures
    };
  }
}

// Usage
const paginatedQuery = new PaginatedQuery(
  query({
    url: 'https://services.arcgis.com/.../LargeDataset/FeatureServer/0'
  })
  .where("STATUS = 'Active'")
  .fields(['OBJECTID', 'NAME', 'VALUE'])
  .orderBy('NAME'),
  500 // 500 features per page
);

const firstPage = await paginatedQuery.getPage(0);
const nextPage = await paginatedQuery.nextPage();
```

### Statistical Analysis

```typescript
class QueryAnalytics {
  private serviceUrl: string;

  constructor(serviceUrl: string) {
    this.serviceUrl = serviceUrl;
  }

  async getFeatureCount(whereClause = '1=1') {
    return await query({ url: this.serviceUrl })
      .where(whereClause)
      .count();
  }

  async getBounds(whereClause = '1=1') {
    return await query({ url: this.serviceUrl })
      .where(whereClause)
      .bounds();
  }

  async getFieldSummary(field: string, whereClause = '1=1') {
    const features = await query({ url: this.serviceUrl })
      .where(whereClause)
      .fields([field]);

    const values = features.features
      .map(f => f.properties[field])
      .filter(v => v != null && !isNaN(v));

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      sum: values.reduce((a, b) => a + b, 0)
    };
  }

  async getCategoryCounts(field: string, whereClause = '1=1') {
    const features = await query({ url: this.serviceUrl })
      .where(whereClause)
      .fields([field]);

    const counts = {};
    features.features.forEach(f => {
      const value = f.properties[field];
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getTopFeatures(field: string, limit = 10, whereClause = '1=1') {
    return await query({ url: this.serviceUrl })
      .where(whereClause)
      .orderBy(field, 'DESC')
      .limit(limit);
  }
}

// Usage
const analytics = new QueryAnalytics(
  'https://services.arcgis.com/.../CityData/FeatureServer/0'
);

// Get statistics
const totalCities = await analytics.getFeatureCount();
const populationStats = await analytics.getFieldSummary('POPULATION');
const stateBreakdown = await analytics.getCategoryCounts('STATE');
const largestCities = await analytics.getTopFeatures('POPULATION', 20);

console.log('Analytics:', {
  totalCities,
  populationStats,
  stateBreakdown,
  largestCities: largestCities.features.length
});
```

### Dynamic Dashboard Queries

```typescript
class DashboardQuery {
  private baseUrl: string;
  private filters: { [key: string]: any } = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setFilter(key: string, value: any) {
    this.filters[key] = value;
    return this; // Chainable
  }

  clearFilter(key: string) {
    delete this.filters[key];
    return this;
  }

  private buildWhereClause(): string {
    const conditions = [];
    
    if (this.filters.state) {
      conditions.push(`STATE = '${this.filters.state}'`);
    }
    if (this.filters.minPopulation) {
      conditions.push(`POPULATION >= ${this.filters.minPopulation}`);
    }
    if (this.filters.dateRange) {
      conditions.push(
        `DATE_FIELD >= date '${this.filters.dateRange.start}' AND ` +
        `DATE_FIELD <= date '${this.filters.dateRange.end}'`
      );
    }
    if (this.filters.categories && this.filters.categories.length > 0) {
      const categoryList = this.filters.categories.map(c => `'${c}'`).join(',');
      conditions.push(`CATEGORY IN (${categoryList})`);
    }

    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }

  async getData() {
    const whereClause = this.buildWhereClause();
    
    return await query({ url: this.baseUrl })
      .where(whereClause)
      .fields(['*'])
      .orderBy('NAME');
  }

  async getCount() {
    const whereClause = this.buildWhereClause();
    
    return await query({ url: this.baseUrl })
      .where(whereClause)
      .count();
  }

  async getSummary() {
    const whereClause = this.buildWhereClause();
    
    const [data, count, bounds] = await Promise.all([
      query({ url: this.baseUrl }).where(whereClause).limit(100),
      query({ url: this.baseUrl }).where(whereClause).count(),
      query({ url: this.baseUrl }).where(whereClause).bounds()
    ]);

    return { data, count, bounds };
  }
}

// Usage in dashboard
const dashboard = new DashboardQuery(
  'https://services.arcgis.com/.../Features/FeatureServer/0'
);

// Apply filters from UI
dashboard
  .setFilter('state', 'California')
  .setFilter('minPopulation', 100000)
  .setFilter('dateRange', { start: '2023-01-01', end: '2023-12-31' });

const summary = await dashboard.getSummary();
console.log('Dashboard data:', summary);
```

## Integration Patterns

### With Map Layers

```typescript
import { Map } from 'maplibre-gl';
import { query } from 'esri-gl';

class QueryLayerManager {
  private map: Map;
  private layerId: string;
  private sourceId: string;

  constructor(map: Map, layerId: string) {
    this.map = map;
    this.layerId = layerId;
    this.sourceId = `${layerId}-source`;
  }

  async updateLayer(queryParams: any) {
    // Execute query
    const results = await query(queryParams);
    
    // Update map source
    const source = this.map.getSource(this.sourceId);
    if (source && source.type === 'geojson') {
      source.setData(results);
    } else {
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: results
      });
    }

    // Add/update layer
    if (!this.map.getLayer(this.layerId)) {
      this.map.addLayer({
        id: this.layerId,
        type: 'fill',
        source: this.sourceId,
        paint: {
          'fill-color': '#007cbf',
          'fill-opacity': 0.5
        }
      });
    }
  }
}

// Usage
const layerManager = new QueryLayerManager(map, 'filtered-features');

// Update based on user selection
await layerManager.updateLayer({
  url: 'https://services.arcgis.com/.../FeatureServer/0',
  where: "CATEGORY = 'Commercial'",
  fields: ['NAME', 'CATEGORY', 'VALUE']
});
```

## Response Format

Query results follow GeoJSON FeatureCollection format:

```typescript
interface QueryResult {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: GeoJSON.Geometry;
    properties: { [key: string]: any };
  }>;
}

// Count queries return a number
interface CountResult {
  count: number;
}

// Bounds queries return extent
interface BoundsResult {
  xmin: number;
  ymin: number;
  xmax: number;  
  ymax: number;
  spatialReference: { wkid: number };
}
```

## Error Handling

```typescript
const robustQuery = async (queryParams: any) => {
  try {
    // Add timeout and retry logic
    const result = await Promise.race([
      query(queryParams),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 30000)
      )
    ]);

    // Validate result
    if (!result || !result.features) {
      throw new Error('Invalid query result');
    }

    return result;
  } catch (error) {
    console.error('Query failed:', error);
    
    // Implement fallback strategies
    if (error.message.includes('timeout')) {
      // Retry with smaller limit
      return await query({ ...queryParams, limit: 100 });
    } else if (error.message.includes('invalid where clause')) {
      // Fallback to basic query
      return await query({ ...queryParams, where: '1=1' });
    }
    
    throw error; // Re-throw if no fallback
  }
};
```

## Performance Tips

1. **Use Appropriate Limits**: Don't query more features than needed
2. **Specify Fields**: Only request necessary fields with `.fields()`
3. **Server-side Filtering**: Use `.where()` to filter at the server
4. **Spatial Indexing**: Spatial queries are typically faster than attribute queries
5. **Pagination**: Use `.offset()` and `.limit()` for large datasets
6. **Caching**: Cache results for repeated identical queries

## Best Practices

1. **Always Handle Errors**: Implement timeout and error recovery
2. **Validate Input**: Check geometry and where clause syntax
3. **Limit Result Size**: Use pagination for large datasets
4. **Monitor Performance**: Log query execution times
5. **Use Spatial Queries**: Leverage spatial indexes when possible
6. **Cache Results**: Store results for repeated queries