# Advanced Examples

Complex use cases and integration patterns for esri-gl services.

## Authentication & Security

### Token-based Authentication

```typescript
import { DynamicMapService, FeatureService } from 'esri-gl'

// Service requiring authentication
const secureService = new DynamicMapService('secure-source', map, {
    url: 'https://myserver.com/arcgis/rest/services/Private/MapServer',
    token: 'your-auth-token',
    fetchOptions: {
        headers: {
            'Authorization': 'Bearer your-jwt-token',
            'X-API-Key': 'your-api-key'
        }
    }
})

map.addLayer({
    id: 'secure-layer',
    type: 'raster',
    source: 'secure-source'
})
```

### OAuth Integration

```typescript
// OAuth token management
class EsriAuthManager {
    private token: string | null = null
    private refreshToken: string | null = null
    
    async authenticate(clientId: string, redirectUri: string) {
        // Implement OAuth flow
        const authUrl = `https://www.arcgis.com/sharing/rest/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`
        
        // Handle OAuth callback and get token
        this.token = await this.exchangeCodeForToken(/* code */)
    }
    
    getAuthenticatedService(sourceId: string, map: any, options: any) {
        return new DynamicMapService(sourceId, map, {
            ...options,
            token: this.token,
            fetchOptions: {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            }
        })
    }
}
```

## Multi-Service Dashboards

### Synchronized Map Views

```typescript
import { DynamicMapService, FeatureService, ImageService } from 'esri-gl'

class MapDashboard {
    private services: Map<string, any> = new Map()
    
    constructor(private map: any) {}
    
    async addService(id: string, type: string, options: any) {
        let service
        
        switch (type) {
            case 'dynamic':
                service = new DynamicMapService(id, this.map, options)
                break
            case 'feature':
                service = new FeatureService(id, this.map, options)
                break
            case 'image':
                service = new ImageService(id, this.map, options)
                break
        }
        
        this.services.set(id, service)
        
        // Add corresponding layers
        await this.addLayersForService(id, type)
    }
    
    async addLayersForService(serviceId: string, type: string) {
        switch (type) {
            case 'dynamic':
            case 'image':
                this.map.addLayer({
                    id: `${serviceId}-layer`,
                    type: 'raster',
                    source: serviceId
                })
                break
                
            case 'feature':
                this.map.addLayer({
                    id: `${serviceId}-fill`,
                    type: 'fill',
                    source: serviceId,
                    paint: {
                        'fill-color': '#088',
                        'fill-opacity': 0.6
                    }
                })
                break
        }
    }
    
    toggleServiceVisibility(serviceId: string, visible: boolean) {
        const layers = this.map.getStyle().layers.filter(layer => 
            layer.source === serviceId
        )
        
        layers.forEach(layer => {
            this.map.setLayoutProperty(layer.id, 'visibility', 
                visible ? 'visible' : 'none'
            )
        })
    }
    
    async identifyAll(point: {lng: number, lat: number}) {
        const results = []
        
        for (const [id, service] of this.services) {
            try {
                if (service.identify) {
                    const result = await service.identify(point, true)
                    results.push({ serviceId: id, ...result })
                }
            } catch (error) {
                console.warn(`Identify failed for service ${id}:`, error)
            }
        }
        
        return results
    }
}

// Usage
const dashboard = new MapDashboard(map)

await dashboard.addService('usa-demographics', 'dynamic', {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer'
})

await dashboard.addService('world-cities', 'feature', {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Cities/FeatureServer/0'
})
```

## Time-Enabled Services

### Temporal Animation

```typescript
import { DynamicMapService } from 'esri-gl'

class TemporalMapService {
    private service: DynamicMapService
    private timeExtent: [Date, Date]
    private currentTime: Date
    private animationId: number | null = null
    
    constructor(sourceId: string, map: any, options: any, timeExtent: [Date, Date]) {
        this.timeExtent = timeExtent
        this.currentTime = timeExtent[0]
        
        this.service = new DynamicMapService(sourceId, map, {
            ...options,
            from: this.currentTime,
            to: this.currentTime
        })
    }
    
    setTime(date: Date) {
        this.currentTime = date
        this.updateService()
    }
    
    private updateService() {
        // Update service time parameters
        this.service.setTimeExtent(this.currentTime, this.currentTime)
    }
    
    animate(duration: number = 5000) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
        }
        
        const startTime = this.timeExtent[0].getTime()
        const endTime = this.timeExtent[1].getTime()
        const totalTime = endTime - startTime
        
        const animate = (timestamp: number) => {
            const progress = (timestamp % duration) / duration
            const currentTimeMs = startTime + (progress * totalTime)
            
            this.setTime(new Date(currentTimeMs))
            this.animationId = requestAnimationFrame(animate)
        }
        
        this.animationId = requestAnimationFrame(animate)
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }
    }
}

// Usage
const timeService = new TemporalMapService('hurricane-source', map, {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Hurricanes/MapServer'
}, [new Date('2020-01-01'), new Date('2020-12-31')])

// Animate through the year
timeService.animate(10000) // 10 second loop
```

## Dynamic Layer Styling

### Data-Driven Styling

```typescript
import { FeatureService } from 'esri-gl'

class StyledFeatureService {
    private service: FeatureService
    private layerId: string
    
    constructor(sourceId: string, layerId: string, map: any, options: any) {
        this.service = new FeatureService(sourceId, map, options)
        this.layerId = layerId
    }
    
    async applyClassBreaksStyle(field: string, breaks: number[], colors: string[]) {
        // Get field statistics to determine breaks
        const features = await this.service.query({
            where: '1=1',
            returnStatistics: true,
            statisticFields: [{
                statisticType: 'min',
                onStatisticField: field,
                outStatisticFieldName: 'min_val'
            }, {
                statisticType: 'max', 
                onStatisticField: field,
                outStatisticFieldName: 'max_val'
            }]
        })
        
        // Create MapLibre GL expression for class breaks
        const expression = [
            'case',
            ...breaks.flatMap((breakValue, index) => [
                ['<', ['get', field], breakValue],
                colors[index]
            ]),
            colors[colors.length - 1] // Default color
        ]
        
        // Update layer style
        map.setPaintProperty(this.layerId, 'fill-color', expression)
    }
    
    async applyUniqueValueStyle(field: string, valueMap: Record<string, string>) {
        const expression = [
            'match',
            ['get', field],
            ...Object.entries(valueMap).flat(),
            '#cccccc' // Default color
        ]
        
        map.setPaintProperty(this.layerId, 'fill-color', expression)
    }
}

// Usage
const styledService = new StyledFeatureService('states-source', 'states-fill', map, {
    url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0'
})

// Apply population-based styling
await styledService.applyClassBreaksStyle('POP2000', 
    [1000000, 5000000, 10000000], 
    ['#ffffcc', '#a1dab4', '#41b6c4', '#225ea8']
)
```

## Spatial Analysis

### Buffer and Intersect Operations

```typescript
import { FeatureService, IdentifyFeatures } from 'esri-gl'
import * as turf from '@turf/turf'

class SpatialAnalysis {
    constructor(private map: any) {}
    
    async findFeaturesWithinBuffer(
        centerPoint: [number, number], 
        radiusKm: number,
        serviceUrl: string
    ) {
        // Create buffer using Turf.js
        const point = turf.point(centerPoint)
        const buffer = turf.buffer(point, radiusKm, { units: 'kilometers' })
        
        // Query features that intersect the buffer
        const featureService = new FeatureService('temp-source', this.map, {
            url: serviceUrl,
            geometry: buffer.geometry,
            geometryType: 'esriGeometryPolygon',
            spatialRel: 'esriSpatialRelIntersects'
        })
        
        const results = await featureService.query()
        
        // Clean up temporary source
        this.map.removeSource('temp-source')
        
        return results
    }
    
    async identifyNearestFeatures(
        point: [number, number],
        serviceUrls: string[],
        maxDistance: number = 1000 // meters
    ) {
        const identifyPromises = serviceUrls.map(url => {
            const task = new IdentifyFeatures({ url })
                .tolerance(10)
                .returnGeometry(true)
            
            return task.at({ lng: point[0], lat: point[1] }, this.map)
        })
        
        const results = await Promise.all(identifyPromises)
        
        // Calculate distances and filter
        const nearbyFeatures = []
        
        results.forEach(result => {
            result.results.forEach(feature => {
                if (feature.geometry) {
                    const featurePoint = turf.centroid(feature.geometry)
                    const distance = turf.distance(
                        turf.point(point),
                        featurePoint,
                        { units: 'meters' }
                    )
                    
                    if (distance <= maxDistance) {
                        nearbyFeatures.push({
                            ...feature,
                            distance
                        })
                    }
                }
            })
        })
        
        // Sort by distance
        return nearbyFeatures.sort((a, b) => a.distance - b.distance)
    }
}
```

## Error Handling & Resilience

### Retry Logic and Fallbacks

```typescript
class ResilientService {
    private maxRetries = 3
    private retryDelay = 1000
    
    async createServiceWithRetry<T>(
        ServiceClass: new (...args: any[]) => T,
        ...args: any[]
    ): Promise<T> {
        let lastError: Error
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const service = new ServiceClass(...args)
                
                // Test the service by making a simple request
                await this.testService(service)
                
                return service
            } catch (error) {
                lastError = error as Error
                
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt)
                }
            }
        }
        
        throw new Error(`Failed to create service after ${this.maxRetries} attempts: ${lastError.message}`)
    }
    
    private async testService(service: any): Promise<void> {
        if (service.getMetadata) {
            await service.getMetadata()
        }
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

// Usage with fallback services
async function createServiceWithFallback(map: any) {
    const primaryUrl = 'https://services1.arcgis.com/primary/FeatureServer/0'
    const fallbackUrl = 'https://services2.arcgis.com/fallback/FeatureServer/0'
    
    const resilientService = new ResilientService()
    
    try {
        return await resilientService.createServiceWithRetry(
            FeatureService, 'primary-source', map, { url: primaryUrl }
        )
    } catch (error) {
        console.warn('Primary service failed, using fallback:', error.message)
        
        return await resilientService.createServiceWithRetry(
            FeatureService, 'fallback-source', map, { url: fallbackUrl }
        )
    }
}
```

## Performance Optimization

### Service Pooling and Caching

```typescript
class ServicePool {
    private services = new Map<string, any>()
    private cache = new Map<string, any>()
    private cacheExpiry = 5 * 60 * 1000 // 5 minutes
    
    getService(url: string, ServiceClass: any, map: any, options: any) {
        const key = `${ServiceClass.name}:${url}`
        
        if (!this.services.has(key)) {
            const sourceId = `pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const service = new ServiceClass(sourceId, map, { ...options, url })
            this.services.set(key, service)
        }
        
        return this.services.get(key)
    }
    
    async cachedQuery(service: any, queryKey: string, queryFn: () => Promise<any>) {
        const cacheKey = `${service.constructor.name}:${queryKey}`
        const cached = this.cache.get(cacheKey)
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data
        }
        
        const data = await queryFn()
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        })
        
        return data
    }
    
    clearCache() {
        this.cache.clear()
    }
}

// Usage
const servicePool = new ServicePool()

const service = servicePool.getService(
    'https://services.arcgis.com/example/FeatureServer/0',
    FeatureService,
    map,
    { where: '1=1' }
)

const results = await servicePool.cachedQuery(
    service,
    'all-features',
    () => service.query({ where: '1=1' })
)
```

These advanced examples demonstrate real-world usage patterns and best practices for building robust mapping applications with esri-gl.