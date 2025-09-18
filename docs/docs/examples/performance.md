# Performance Examples

Optimize esri-gl applications for large datasets, complex visualizations, and real-time updates. These examples demonstrate best practices for high-performance mapping applications.

## Large Dataset Optimization

### Efficient FeatureService with Bounding Box Filtering

```typescript
import { Map } from 'maplibre-gl';
import { FeatureService } from 'esri-gl';

class OptimizedFeatureViewer {
  private map: Map;
  private service: FeatureService;
  private currentZoom = 0;

  constructor(map: Map, serviceUrl: string) {
    this.map = map;
    this.initializeService(serviceUrl);
    this.setupZoomOptimization();
  }

  private initializeService(serviceUrl: string) {
    this.service = new FeatureService('optimized-source', this.map, {
      url: serviceUrl,
      useVectorTiles: true, // Smart vector tile detection
      useBoundingBox: true, // Viewport-based loading
      maxRecordCount: this.getRecordCountForZoom(this.map.getZoom()),
      outFields: this.getFieldsForZoom(this.map.getZoom()),
      where: '1=1'
    });

    this.addLayers();
  }

  private setupZoomOptimization() {
    this.map.on('zoomend', () => {
      const newZoom = this.map.getZoom();
      const zoomDiff = Math.abs(newZoom - this.currentZoom);

      // Only update if significant zoom change
      if (zoomDiff > 1.5) {
        this.optimizeForZoom(newZoom);
        this.currentZoom = newZoom;
      }
    });

    // Also optimize on initial load
    this.map.on('load', () => {
      this.currentZoom = this.map.getZoom();
    });
  }

  private optimizeForZoom(zoom: number) {
    const recordCount = this.getRecordCountForZoom(zoom);
    const fields = this.getFieldsForZoom(zoom);

    this.service.updateQuery({
      maxRecordCount: recordCount,
      outFields: fields
    });

    // Update layer visibility based on zoom
    this.updateLayerVisibility(zoom);
  }

  private getRecordCountForZoom(zoom: number): number {
    if (zoom < 10) return 500;   // Low zoom - fewer features
    if (zoom < 13) return 1500;  // Medium zoom
    if (zoom < 16) return 3000;  // High zoom
    return 5000;                 // Very high zoom - maximum detail
  }

  private getFieldsForZoom(zoom: number): string[] {
    if (zoom < 12) {
      // Low zoom - only essential fields
      return ['OBJECTID', 'NAME', 'TYPE'];
    } else if (zoom < 15) {
      // Medium zoom - more details
      return ['OBJECTID', 'NAME', 'TYPE', 'ADDRESS', 'STATUS'];
    } else {
      // High zoom - all fields
      return ['*'];
    }
  }

  private addLayers() {
    // Overview layer (low zoom)
    this.map.addLayer({
      id: 'features-overview',
      type: 'circle',
      source: 'optimized-source',
      maxzoom: 12,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3, 12, 6],
        'circle-color': '#007cbf',
        'circle-opacity': 0.7
      }
    });

    // Detailed layer (high zoom)
    this.map.addLayer({
      id: 'features-detailed',
      type: 'fill',
      source: 'optimized-source',
      minzoom: 12,
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'STATUS'], 'Active'], '#00ff00',
          ['==', ['get', 'STATUS'], 'Pending'], '#ffff00',
          '#ff0000'
        ],
        'fill-opacity': 0.6
      }
    });
  }

  private updateLayerVisibility(zoom: number) {
    // Show/hide layers based on zoom for better performance
    const overviewVisible = zoom < 12 ? 'visible' : 'none';
    const detailedVisible = zoom >= 12 ? 'visible' : 'none';

    this.map.setLayoutProperty('features-overview', 'visibility', overviewVisible);
    this.map.setLayoutProperty('features-detailed', 'visibility', detailedVisible);
  }
}

// Usage
const optimizedViewer = new OptimizedFeatureViewer(
  map,
  'https://services.arcgis.com/.../LargeDataset/FeatureServer/0'
);
```

### Memory-Efficient Clustering

```typescript
class ClusteredFeatureService {
  private map: Map;
  private service: FeatureService;
  private dataCache = new Map<string, any>();

  constructor(map: Map, serviceUrl: string) {
    this.map = map;
    this.initializeClusteredService(serviceUrl);
  }

  private initializeClusteredService(serviceUrl: string) {
    this.service = new FeatureService('clustered-source', this.map, {
      url: serviceUrl,
      useVectorTiles: false, // Use GeoJSON for clustering
      useBoundingBox: true,
      maxRecordCount: 10000
    }, {
      // Enable clustering in GeoJSON source
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points
      clusterRadius: 50   // Cluster radius in pixels
    });

    this.addClusterLayers();
    this.setupClusterInteraction();
  }

  private addClusterLayers() {
    // Clusters
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'clustered-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',  // < 100 points
          100, '#f1f075',  // 100-750 points  
          750, '#f28cb1'   // > 750 points
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,   // < 100 points
          100, 30,   // 100-750 points
          750, 40    // > 750 points
        ]
      }
    });

    // Cluster count labels
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'clustered-source',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    });

    // Individual points (unclustered)
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'clustered-source',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });
  }

  private setupClusterInteraction() {
    // Click on cluster to zoom in
    this.map.on('click', 'clusters', (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });

      const clusterId = features[0].properties.cluster_id;
      const source = this.map.getSource('clustered-source') as any;

      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;

        this.map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom
        });
      });
    });

    // Change cursor on cluster hover
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });

    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }
}
```

## Real-Time Data Updates

### Live Data Streaming

```typescript
class LiveDataManager {
  private map: Map;
  private services = new Map<string, FeatureService>();
  private updateIntervals = new Map<string, NodeJS.Timeout>();

  constructor(map: Map) {
    this.map = map;
  }

  addLiveService(
    sourceId: string,
    serviceUrl: string,
    updateInterval: number = 30000, // 30 seconds
    options: any = {}
  ) {
    // Create service with optimizations for live data
    const service = new FeatureService(sourceId, this.map, {
      url: serviceUrl,
      useVectorTiles: false, // GeoJSON better for frequent updates
      useBoundingBox: true,
      maxRecordCount: 1000,
      ...options
    });

    this.services.set(sourceId, service);

    // Set up periodic updates
    const interval = setInterval(() => {
      this.updateService(sourceId);
    }, updateInterval);

    this.updateIntervals.set(sourceId, interval);

    // Add live indicator layer
    this.addLiveIndicators(sourceId);

    return service;
  }

  private async updateService(sourceId: string) {
    const service = this.services.get(sourceId);
    if (!service) return;

    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      service.updateQuery({
        where: `LAST_UPDATE >= ${timestamp - 300000}` // Last 5 minutes
      });

      console.log(`Updated live service ${sourceId} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`Failed to update live service ${sourceId}:`, error);
    }
  }

  private addLiveIndicators(sourceId: string) {
    // Add pulsing animation for live data
    this.map.addLayer({
      id: `${sourceId}-live`,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 8,
          16, 20
        ],
        'circle-color': '#ff4444',
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'age_minutes'],
          0, 0.8,    // Very recent - bright
          10, 0.4,   // 10 minutes old - dimmer
          30, 0.1    // 30+ minutes old - very dim
        ]
      }
    });

    // Add pulse animation
    this.animatePulse(`${sourceId}-live`);
  }

  private animatePulse(layerId: string) {
    let pulseRadius = 10;
    let growing = true;

    const pulse = () => {
      if (growing) {
        pulseRadius += 0.5;
        if (pulseRadius >= 15) growing = false;
      } else {
        pulseRadius -= 0.5;
        if (pulseRadius <= 10) growing = true;
      }

      if (this.map.getLayer(layerId)) {
        this.map.setPaintProperty(layerId, 'circle-radius', pulseRadius);
        requestAnimationFrame(pulse);
      }
    };

    pulse();
  }

  stopLiveUpdates(sourceId: string) {
    const interval = this.updateIntervals.get(sourceId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(sourceId);
    }
  }

  cleanup() {
    // Stop all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();

    // Remove all services
    this.services.forEach(service => service.remove());
    this.services.clear();
  }
}

// Usage for vehicle tracking
const liveManager = new LiveDataManager(map);

const vehicleService = liveManager.addLiveService(
  'live-vehicles',
  'https://services.arcgis.com/.../VehicleTracking/FeatureServer/0',
  10000, // Update every 10 seconds
  {
    where: "STATUS = 'Active'",
    outFields: ['VEHICLE_ID', 'SPEED', 'HEADING', 'LAST_UPDATE'],
    orderByFields: 'LAST_UPDATE DESC'
  }
);
```

## Multi-Service Data Fusion

### Combining Multiple Services

```typescript
class MultiServiceManager {
  private map: Map;
  private services: Array<{
    id: string;
    service: FeatureService;
    config: any;
  }> = [];

  constructor(map: Map) {
    this.map = map;
  }

  async loadServiceStack(configs: Array<{
    id: string;
    url: string;
    style: any;
    options?: any;
  }>) {
    // Load all services in parallel
    const loadPromises = configs.map(async (config) => {
      try {
        const service = new FeatureService(config.id, this.map, {
          url: config.url,
          useVectorTiles: true,
          useBoundingBox: true,
          ...config.options
        });

        // Wait for service to load
        await this.waitForService(config.id);

        // Add styled layer
        this.map.addLayer({
          id: `${config.id}-layer`,
          source: config.id,
          ...config.style
        });

        return { id: config.id, service, config };
      } catch (error) {
        console.error(`Failed to load service ${config.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(loadPromises);
    this.services = results.filter(Boolean);

    console.log(`Loaded ${this.services.length}/${configs.length} services`);
    return this.services;
  }

  private waitForService(sourceId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        const source = this.map.getSource(sourceId);
        if (source) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    });
  }

  async queryAcrossServices(
    point: [number, number],
    tolerance: number = 10
  ) {
    const buffer = this.createBuffer(point, tolerance);
    const results = [];

    // Query all services simultaneously
    const queryPromises = this.services.map(async ({ id, service }) => {
      try {
        const features = await service.query({
          geometry: buffer,
          geometryType: 'esriGeometryPolygon',
          spatialRel: 'esriSpatialRelIntersects',
          returnGeometry: true,
          outFields: '*'
        });

        return {
          serviceId: id,
          features: features.features,
          count: features.features.length
        };
      } catch (error) {
        console.error(`Query failed for service ${id}:`, error);
        return {
          serviceId: id,
          features: [],
          count: 0,
          error: error.message
        };
      }
    });

    return await Promise.all(queryPromises);
  }

  private createBuffer(center: [number, number], radiusMeters: number) {
    // Simple circular buffer approximation
    const earthRadius = 6378137; // Earth radius in meters
    const lat = center[1] * Math.PI / 180;
    const lng = center[0] * Math.PI / 180;
    
    const deltaLat = radiusMeters / earthRadius;
    const deltaLng = radiusMeters / (earthRadius * Math.cos(lat));
    
    const points = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * 2 * Math.PI;
      const bufferLat = lat + deltaLat * Math.sin(angle);
      const bufferLng = lng + deltaLng * Math.cos(angle);
      points.push([bufferLng * 180 / Math.PI, bufferLat * 180 / Math.PI]);
    }
    points.push(points[0]); // Close polygon

    return {
      type: 'Polygon',
      coordinates: [points]
    };
  }

  toggleServiceVisibility(serviceId: string, visible: boolean) {
    const layerId = `${serviceId}-layer`;
    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(
        layerId,
        'visibility',
        visible ? 'visible' : 'none'
      );
    }
  }

  updateServiceStyle(serviceId: string, paintProperties: any) {
    const layerId = `${serviceId}-layer`;
    if (this.map.getLayer(layerId)) {
      Object.entries(paintProperties).forEach(([property, value]) => {
        this.map.setPaintProperty(layerId, property, value);
      });
    }
  }
}

// Usage - Urban Planning Dashboard
const multiService = new MultiServiceManager(map);

await multiService.loadServiceStack([
  {
    id: 'parcels',
    url: 'https://services.arcgis.com/.../Parcels/FeatureServer/0',
    style: {
      type: 'fill',
      paint: {
        'fill-color': ['get', 'ZONING_COLOR'],
        'fill-opacity': 0.6
      }
    }
  },
  {
    id: 'buildings',
    url: 'https://services.arcgis.com/.../Buildings/FeatureServer/0',
    style: {
      type: 'fill-extrusion',
      paint: {
        'fill-extrusion-color': '#666666',
        'fill-extrusion-height': ['get', 'HEIGHT']
      }
    }
  },
  {
    id: 'infrastructure',
    url: 'https://services.arcgis.com/.../Infrastructure/FeatureServer/0',
    style: {
      type: 'line',
      paint: {
        'line-color': '#ff4444',
        'line-width': 2
      }
    }
  }
]);
```

## Advanced Caching Strategy

### Intelligent Data Caching

```typescript
class SmartCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    bbox: any;
    zoom: number;
  }>();
  
  private maxCacheSize = 100;
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  generateCacheKey(
    url: string,
    bbox: any,
    zoom: number,
    options: any
  ): string {
    const optionsHash = this.hashObject(options);
    return `${url}:${bbox.join(',')}:${Math.floor(zoom)}:${optionsHash}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, bbox: any, zoom: number) {
    // Implement LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      bbox,
      zoom
    });
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values())
      .filter(entry => now - entry.timestamp <= this.cacheTTL);

    return {
      total: this.cache.size,
      valid: validEntries.length,
      expired: this.cache.size - validEntries.length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private hashObject(obj: any): string {
    return btoa(JSON.stringify(obj)).replace(/[^a-zA-Z0-9]/g, '');
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    this.cache.forEach(entry => {
      size += JSON.stringify(entry).length;
    });
    return size;
  }
}

// Cached FeatureService
class CachedFeatureService extends FeatureService {
  private static cache = new SmartCache();

  async query(options: any = {}) {
    const map = this._map;
    const bbox = map.getBounds().toArray().flat();
    const zoom = map.getZoom();
    
    const cacheKey = CachedFeatureService.cache.generateCacheKey(
      this.esriServiceOptions.url,
      bbox,
      zoom,
      options
    );

    // Try cache first
    const cachedData = CachedFeatureService.cache.get(cacheKey);
    if (cachedData) {
      console.log('Cache hit for', cacheKey);
      return cachedData;
    }

    // Fetch from service
    console.log('Cache miss, fetching from service');
    const data = await super.query(options);
    
    // Cache the result
    CachedFeatureService.cache.set(cacheKey, data, bbox, zoom);
    
    return data;
  }

  static getCacheStats() {
    return CachedFeatureService.cache.getStats();
  }

  static clearCache() {
    CachedFeatureService.cache.clear();
  }
}
```

## Performance Monitoring

### Performance Metrics Collection

```typescript
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    // Monitor fetch requests
    if (typeof PerformanceObserver !== 'undefined') {
      const fetchObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('arcgis.com')) {
            this.recordMetric('api_request_duration', entry.duration);
          }
        });
      });
      fetchObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(fetchObserver);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  getAllStats() {
    const stats: any = {};
    this.metrics.forEach((values, name) => {
      stats[name] = this.getMetricStats(name);
    });
    return stats;
  }

  startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
    };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Usage with services
const monitor = new PerformanceMonitor();

class MonitoredFeatureService extends FeatureService {
  async query(options: any = {}) {
    const endTimer = monitor.startTimer('feature_service_query');
    
    try {
      const result = await super.query(options);
      monitor.recordMetric('features_loaded', result.features.length);
      return result;
    } finally {
      endTimer();
    }
  }
}

// Performance dashboard
setInterval(() => {
  const stats = monitor.getAllStats();
  console.log('Performance Stats:', stats);
  
  // Alert on slow performance
  if (stats.api_request_duration?.avg > 5000) {
    console.warn('API requests are slow:', stats.api_request_duration.avg + 'ms');
  }
}, 30000); // Every 30 seconds
```

These performance examples demonstrate:

1. **Zoom-based optimization** - Adjusting data quality based on zoom level
2. **Efficient clustering** - Handling large point datasets
3. **Real-time updates** - Managing live data streams
4. **Multi-service coordination** - Combining multiple data sources
5. **Smart caching** - Reducing redundant requests
6. **Performance monitoring** - Tracking application performance

Each example provides production-ready patterns for building high-performance mapping applications with esri-gl.