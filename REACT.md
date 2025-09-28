# React Integration for esri-gl

This document demonstrates how to use the React hooks and components provided by esri-gl.

## Installation

```bash
npm install esri-gl maplibre-gl react react-dom
# or for Mapbox GL JS
npm install esri-gl mapbox-gl react react-dom

# For react-map-gl integration
npm install esri-gl react-map-gl
```

## React Hooks

### Basic Service Hooks

```tsx
import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { useDynamicMapService } from 'esri-gl/react';

function MapComponent() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-95.7129, 37.0902],
      zoom: 4
    });

    setMap(mapInstance);
    return () => mapInstance.remove();
  }, []);

  const { service, loading, error } = useDynamicMapService({
    sourceId: 'usa-service',
    map,
    options: {
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
      layers: [0, 1, 2]
    }
  });

  useEffect(() => {
    if (!map || !service) return;

    map.addLayer({
      id: 'usa-layer',
      type: 'raster',
      source: 'usa-service'
    });
  }, [map, service]);

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />;
}
```

### Task Hooks

```tsx
import { useIdentifyFeatures } from 'esri-gl/react';

function IdentifyExample() {
  const { identify, loading, error } = useIdentifyFeatures({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    tolerance: 3,
    returnGeometry: true
  });

  const handleMapClick = async (event: any) => {
    try {
      const results = await identify({ lng: event.lngLat.lng, lat: event.lngLat.lat });
      console.log('Identify results:', results);
    } catch (err) {
      console.error('Identify failed:', err);
    }
  };

  return (
    <div>
      {loading && <p>Identifying features...</p>}
      {error && <p>Error: {error.message}</p>}
      {/* Your map component with onClick handler */}
    </div>
  );
}
```

## React Components

### Service Provider

```tsx
import { EsriServiceProvider, EsriLayer } from 'esri-gl/react';

function App() {
  const [map, setMap] = useState<Map | null>(null);

  return (
    <EsriServiceProvider map={map}>
      <MapComponent onMapLoad={setMap} />
      {map && (
        <EsriLayer
          sourceId="usa-service"
          layerId="usa-layer"
          type="raster"
        />
      )}
    </EsriServiceProvider>
  );
}
```

## React Map GL Integration

### Dynamic Layer Component

```tsx
import React from 'react';
import { Map } from 'react-map-gl';
import { EsriDynamicLayer } from 'esri-gl/react-map-gl';

function MapWithEsriLayer() {
  return (
    <Map
      mapboxAccessToken="your-token"
      initialViewState={{
        longitude: -95.7129,
        latitude: 37.0902,
        zoom: 4
      }}
      style={{ width: '100%', height: '400px' }}
      mapStyle="mapbox://styles/mapbox/light-v10"
    >
      <EsriDynamicLayer
        id="usa-layer"
        url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
        layers={[0, 1, 2]}
        visible={true}
      />
    </Map>
  );
}
```

### Feature Layer Component

```tsx
import { EsriFeatureLayer } from 'esri-gl/react-map-gl';

<EsriFeatureLayer
  id="census-layer"
  url="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Census_States/FeatureServer/0"
  paint={{
    'fill-color': '#627BC1',
    'fill-opacity': 0.5
  }}
  layout={{
    'visibility': 'visible'
  }}
/>
```

## Available Hooks

### Service Hooks
- `useDynamicMapService` - ArcGIS Dynamic Map Services
- `useTiledMapService` - ArcGIS Tiled Map Services  
- `useImageService` - ArcGIS Image Services
- `useVectorTileService` - ArcGIS Vector Tile Services
- `useVectorBasemapStyle` - Esri Vector Basemap Styles
- `useFeatureService` - ArcGIS Feature Services

### Task Hooks
- `useIdentifyFeatures` - Identify features at a point
- `useQuery` - Query features from a service
- `useFind` - Find features by text

## Available Components

### React Components
- `EsriServiceProvider` - Context provider for sharing map instance
- `EsriLayer` - Generic layer component

### React Map GL Components
- `EsriDynamicLayer` - Dynamic Map Service layer
- `EsriTiledLayer` - Tiled Map Service layer
- `EsriImageLayer` - Image Service layer
- `EsriVectorTileLayer` - Vector Tile Service layer
- `EsriVectorBasemapLayer` - Vector Basemap Style layer
- `EsriFeatureLayer` - Feature Service layer

## TypeScript Support

All hooks and components are fully typed with TypeScript. Import types as needed:

```tsx
import type { 
  UseDynamicMapServiceOptions, 
  EsriDynamicLayerProps 
} from 'esri-gl/react';

import type { 
  ReactMapGLEsriDynamicLayerProps 
} from 'esri-gl/react-map-gl';
```