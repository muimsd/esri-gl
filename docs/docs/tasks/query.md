# Query Task

Perform advanced queries against ArcGIS Feature Services with spatial filters, attribute conditions, and statistical analysis. The Query task provides the most comprehensive feature querying capabilities.

## Interactive Query Demo

Here's a complete example based on our demo implementation, showing how to build an interactive query interface:

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { Map, LngLatBounds } from 'maplibre-gl';
import { DynamicMapService, Query } from 'esri-gl';

interface QueryResults {
  features?: Array<GeoJSON.Feature>;
  error?: string;
}

const QueryDemo = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResults | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // Query configuration state
  const [whereClause, setWhereClause] = useState('pop2000 > 1000000');
  const [outFields, setOutFields] = useState('state_name,pop2000,state_abbr');
  const [returnGeometry, setReturnGeometry] = useState(true);
  const [orderBy, setOrderBy] = useState('pop2000 DESC');
  const [maxResults, setMaxResults] = useState(50);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre GL map
    map.current = new Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-98, 39.5],
      zoom: 4,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add sample dynamic map service for context
      new DynamicMapService('usa-service', map.current, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      });

      map.current.addLayer({
        id: 'usa-layer',
        type: 'raster',
        source: 'usa-service',
      });

      setIsLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  const executeQuery = async () => {
    if (!map.current) return;

    setIsQuerying(true);
    setQueryResults(null);

    try {
      // Create query task
      const queryTask = new Query({
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2',
        where: whereClause || '1=1', // Default to all features if empty
        outFields: outFields || '*',
        returnGeometry,
        orderByFields: orderBy,
        resultRecordCount: maxResults
      });

      console.log('Executing query:', {
        where: whereClause,
        outFields,
        returnGeometry,
        orderBy,
        maxResults
      });

      // Execute query
      const results = await queryTask.run() as GeoJSON.FeatureCollection;
      console.log('Query results:', results);

      const queryResults: QueryResults = {
        features: results.features || [],
      };

      setQueryResults(queryResults);

      // Visualize results on map
      if (queryResults.features && queryResults.features.length > 0) {
        // Clear previous results
        if (map.current.getLayer('query-results')) {
          map.current.removeLayer('query-results');
          map.current.removeSource('query-results');
        }

        // Add results to map if geometry is available
        if (returnGeometry) {
          map.current.addSource('query-results', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: queryResults.features,
            },
          });

          // Style based on population (assuming pop2000 field exists)
          map.current.addLayer({
            id: 'query-results',
            type: 'fill',
            source: 'query-results',
            paint: {
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'pop2000'],
                0, '#ffffcc',
                500000, '#41b6c4',
                2000000, '#2c7fb8',
                10000000, '#253494'
              ],
              'fill-opacity': 0.7,
              'fill-outline-color': '#ffffff'
            }
          });

          // Add labels for state names
          map.current.addLayer({
            id: 'query-labels',
            type: 'symbol',
            source: 'query-results',
            layout: {
              'text-field': ['get', 'state_abbr'],
              'text-font': ['Open Sans Bold'],
              'text-size': 12,
              'text-anchor': 'center'
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 1
            }
          });

          // Fit map to results
          const allCoords: [number, number][] = [];
          queryResults.features.forEach((feature: GeoJSON.Feature) => {
            if (feature.geometry?.type === 'Polygon') {
              const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
              coords.forEach((coord: number[]) => {
                if (coord.length >= 2) {
                  allCoords.push([coord[0], coord[1]]);
                }
              });
            }
          });

          if (allCoords.length > 0) {
            const bounds = allCoords.reduce((bounds, coord) => {
              return bounds.extend(coord);
            }, new LngLatBounds());
            map.current.fitBounds(bounds, { padding: 50 });
          }
        }
      }
    } catch (error) {
      console.error('Query failed:', error);
      setQueryResults({ 
        error: error instanceof Error ? error.message : 'Query execution failed',
        features: []
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const clearResults = () => {
    setQueryResults(null);
    if (map.current) {
      ['query-results', 'query-labels'].forEach(layerId => {
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
          if (layerId === 'query-results') {
            map.current.removeSource('query-results');
          }
        }
      });
    }
  };

  const presetQueries = [
    {
      name: 'High Population States',
      where: 'pop2000 > 5000000',
      fields: 'state_name,pop2000,state_abbr',
      orderBy: 'pop2000 DESC'
    },
    {
      name: 'Western States',
      where: "sub_region = 'Pacific' OR sub_region = 'Mountain'",
      fields: 'state_name,sub_region,state_abbr',
      orderBy: 'state_name ASC'
    },
    {
      name: 'Small States by Area',
      where: 'shape_area < 100000000000',
      fields: 'state_name,shape_area,state_abbr',
      orderBy: 'shape_area ASC'
    }
  ];

  const applyPreset = (preset: any) => {
    setWhereClause(preset.where);
    setOutFields(preset.fields);
    setOrderBy(preset.orderBy);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Query Controls */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Interactive Query Task Demo</h3>
        
        {/* Preset Queries */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Quick Presets:
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {presetQueries.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyPreset(preset)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
          {/* WHERE Clause */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              WHERE Clause:
            </label>
            <input
              type="text"
              value={whereClause}
              onChange={e => setWhereClause(e.target.value)}
              placeholder="pop2000 > 1000000"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ced4da'
              }}
            />
            <small style={{ color: '#6c757d' }}>
              SQL WHERE condition (e.g., pop2000 > 1000000)
            </small>
          </div>

          {/* Output Fields */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Output Fields:
            </label>
            <input
              type="text"
              value={outFields}
              onChange={e => setOutFields(e.target.value)}
              placeholder="state_name,pop2000,state_abbr"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ced4da'
              }}
            />
            <small style={{ color: '#6c757d' }}>
              Comma-separated field names (* for all)
            </small>
          </div>

          {/* Order By */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Order By:
            </label>
            <input
              type="text"
              value={orderBy}
              onChange={e => setOrderBy(e.target.value)}
              placeholder="pop2000 DESC"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ced4da'
              }}
            />
            <small style={{ color: '#6c757d' }}>
              Sort field with ASC/DESC
            </small>
          </div>

          {/* Max Results */}
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Max Results: {maxResults}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={maxResults}
              onChange={e => setMaxResults(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#6c757d' }}>
              Limit number of returned features
            </small>
          </div>
        </div>

        {/* Geometry Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            <input
              type="checkbox"
              checked={returnGeometry}
              onChange={e => setReturnGeometry(e.target.checked)}
            />
            Return Geometry (enable map visualization)
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={executeQuery}
            disabled={!isLoaded || isQuerying}
            style={{
              padding: '10px 20px',
              backgroundColor: isQuerying ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isQuerying ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isQuerying ? 'Querying...' : 'Execute Query'}
          </button>

          <button
            onClick={clearResults}
            disabled={!queryResults}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: queryResults ? 'pointer' : 'not-allowed',
            }}
          >
            Clear Results
          </button>
        </div>

        {/* Results Display */}
        {queryResults && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'white',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {queryResults.error ? (
              <div style={{ color: '#dc3545' }}>
                <strong>Error:</strong> {queryResults.error}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '15px', fontWeight: 'bold', fontSize: '16px' }}>
                  📊 Results: {queryResults.features?.length || 0} features found
                </div>
                {queryResults.features?.slice(0, 5).map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: '10px',
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '4px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <strong style={{ color: '#495057' }}>Feature {index + 1}:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {Object.entries(feature.properties || {}).map(([key, value]) => (
                        <div key={key} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                          fontSize: '14px'
                        }}>
                          <span style={{ fontWeight: '500', color: '#6c757d' }}>{key}:</span>
                          <span style={{ color: '#212529', marginLeft: '10px' }}>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {(queryResults.features?.length || 0) > 5 && (
                  <div style={{ 
                    fontStyle: 'italic', 
                    color: '#6c757d',
                    textAlign: 'center',
                    padding: '10px'
                  }}>
                    ... and {(queryResults.features?.length || 0) - 5} more features
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapContainer} style={{ flex: 1 }} />
    </div>
  );
};

export default QueryDemo;
```

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