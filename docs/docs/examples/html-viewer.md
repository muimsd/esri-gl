# HTML Viewer Examples

Interactive HTML examples demonstrating esri-gl with different mapping libraries and service types. Click the links below to view live examples in your browser.

## Live Examples

### 🚀 [Basic MapLibre GL Viewer](pathname:///examples/basic-viewer.html)
A complete interactive viewer with:
- Service type selector (Dynamic, Feature, Tiled, Vector)
- Custom URL input with working examples
- Click-to-identify functionality
- Service loading/clearing controls
- Professional styling with control panels

### ⚡ [Minimal Example](pathname:///examples/minimal-example.html)
A bare-bones setup showing:
- Simple esri-gl integration
- Just 30 lines of code
- Perfect for getting started quickly

### 📊 [Dashboard Example](pathname:///examples/dashboard-example.html)
An advanced dashboard-style interface featuring:
- Professional sidebar with service buttons
- Multiple predefined ArcGIS services
- Service management and layer controls
- Loading states and info panels
- Interactive identify functionality

## Code Examples

Below are the complete source code examples you can copy and modify for your own projects.

:::tip Try the Live Examples First
Check out the [live examples](#live-examples) above to see esri-gl in action before diving into the code!
:::

## Basic MapLibre GL Setup

A complete HTML page using esri-gl with MapLibre GL JS:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>esri-gl with MapLibre GL</title>
    
    <!-- MapLibre GL CSS -->
    <link href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" rel="stylesheet">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        
        #map {
            width: 100vw;
            height: 100vh;
        }
        
        .controls {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            z-index: 1000;
        }
        
        .control-group {
            margin-bottom: 10px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        input, select, button {
            width: 100%;
            padding: 5px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }
        
        button {
            background: #007cbf;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: bold;
        }
        
        button:hover {
            background: #005a87;
        }
        
        .info-popup {
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            max-width: 300px;
        }
        
        .info-popup h3 {
            margin: 0 0 10px 0;
            color: #007cbf;
        }
        
        .info-popup p {
            margin: 5px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <div class="controls">
        <div class="control-group">
            <label>Service Type:</label>
            <select id="serviceType">
                <option value="dynamic">Dynamic Map Service</option>
                <option value="feature">Feature Service</option>
                <option value="tiled">Tiled Map Service</option>
                <option value="vector">Vector Tile Service</option>
            </select>
        </div>
        
        <div class="control-group">
            <label>Service URL:</label>
            <input type="text" id="serviceUrl" 
                   value="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer"
                   placeholder="Enter ArcGIS service URL">
        </div>
        
        <div class="control-group">
            <button onclick="loadService()">Load Service</button>
            <button onclick="clearMap()">Clear Map</button>
        </div>
        
        <div class="control-group">
            <label>
                <input type="checkbox" id="enableIdentify" onchange="toggleIdentify()"> 
                Enable Click to Identify
            </label>
        </div>
    </div>

    <!-- MapLibre GL JavaScript -->
    <script src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"></script>
    
    <!-- esri-gl Library -->
    <script src="https://unpkg.com/esri-gl@latest/dist/esri-gl.js"></script>

    <script>
        // Initialize MapLibre GL map
        const map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {
                    'raster-tiles': {
                        type: 'raster',
                        tiles: [
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors'
                    }
                },
                layers: [
                    {
                        id: 'background',
                        type: 'raster',
                        source: 'raster-tiles'
                    }
                ]
            },
            center: [-95, 40],
            zoom: 4
        });

        // Global variables
        let currentService = null;
        let identifyEnabled = false;
        let currentPopup = null;

        // Wait for map to load
        map.on('load', () => {
            console.log('Map loaded successfully');
        });

        // Load service based on type
        function loadService() {
            const serviceType = document.getElementById('serviceType').value;
            const serviceUrl = document.getElementById('serviceUrl').value.trim();
            
            if (!serviceUrl) {
                alert('Please enter a service URL');
                return;
            }

            // Clear existing service
            clearMap();

            try {
                const sourceId = 'esri-service-source';
                
                switch (serviceType) {
                    case 'dynamic':
                        currentService = new esrigl.DynamicMapService(sourceId, map, {
                            url: serviceUrl
                        });
                        
                        // Add raster layer
                        map.addLayer({
                            id: 'dynamic-layer',
                            type: 'raster',
                            source: sourceId
                        });
                        
                        console.log('Dynamic Map Service loaded');
                        break;

                    case 'feature':
                        currentService = new esrigl.FeatureService(sourceId, map, {
                            url: serviceUrl,
                            useVectorTiles: true,
                            useBoundingBox: true
                        });
                        
                        // Add vector layers after service is ready
                        setTimeout(() => {
                            addFeatureServiceLayers(sourceId);
                        }, 1000);
                        
                        console.log('Feature Service loaded');
                        break;

                    case 'tiled':
                        currentService = new esrigl.TiledMapService(sourceId, map, {
                            url: serviceUrl
                        });
                        
                        // Add raster layer
                        map.addLayer({
                            id: 'tiled-layer',
                            type: 'raster',
                            source: sourceId
                        });
                        
                        console.log('Tiled Map Service loaded');
                        break;

                    case 'vector':
                        currentService = new esrigl.VectorTileService(sourceId, map, {
                            url: serviceUrl
                        });
                        
                        console.log('Vector Tile Service loaded');
                        break;

                    default:
                        alert('Unknown service type');
                        return;
                }

                // Update URL examples based on service type
                updateUrlExample(serviceType);

            } catch (error) {
                console.error('Error loading service:', error);
                alert('Error loading service. Please check the URL and try again.');
            }
        }

        // Add layers for Feature Service
        function addFeatureServiceLayers(sourceId) {
            try {
                // Get the source to check if it's loaded
                const source = map.getSource(sourceId);
                if (!source) {
                    console.warn('Source not ready yet');
                    return;
                }

                // Add fill layer for polygons
                if (!map.getLayer('features-fill')) {
                    map.addLayer({
                        id: 'features-fill',
                        type: 'fill',
                        source: sourceId,
                        paint: {
                            'fill-color': '#088',
                            'fill-opacity': 0.6
                        },
                        filter: ['==', '$type', 'Polygon']
                    });
                }

                // Add line layer
                if (!map.getLayer('features-line')) {
                    map.addLayer({
                        id: 'features-line',
                        type: 'line',
                        source: sourceId,
                        paint: {
                            'line-color': '#000',
                            'line-width': 2
                        },
                        filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']]
                    });
                }

                // Add circle layer for points
                if (!map.getLayer('features-circle')) {
                    map.addLayer({
                        id: 'features-circle',
                        type: 'circle',
                        source: sourceId,
                        paint: {
                            'circle-color': '#ff0000',
                            'circle-radius': 6,
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#ffffff'
                        },
                        filter: ['==', '$type', 'Point']
                    });
                }

            } catch (error) {
                console.error('Error adding feature layers:', error);
            }
        }

        // Clear map
        function clearMap() {
            if (currentService && typeof currentService.remove === 'function') {
                currentService.remove();
            }
            
            // Remove layers
            const layersToRemove = ['dynamic-layer', 'tiled-layer', 'features-fill', 'features-line', 'features-circle'];
            layersToRemove.forEach(layerId => {
                if (map.getLayer(layerId)) {
                    map.removeLayer(layerId);
                }
            });

            // Remove sources
            const sourcesToRemove = ['esri-service-source'];
            sourcesToRemove.forEach(sourceId => {
                if (map.getSource(sourceId)) {
                    map.removeSource(sourceId);
                }
            });

            currentService = null;
            
            // Close popup
            if (currentPopup) {
                currentPopup.remove();
                currentPopup = null;
            }

            console.log('Map cleared');
        }

        // Toggle identify functionality
        function toggleIdentify() {
            identifyEnabled = document.getElementById('enableIdentify').checked;
            
            if (identifyEnabled) {
                map.on('click', handleMapClick);
                map.getCanvas().style.cursor = 'crosshair';
            } else {
                map.off('click', handleMapClick);
                map.getCanvas().style.cursor = '';
                if (currentPopup) {
                    currentPopup.remove();
                    currentPopup = null;
                }
            }
        }

        // Handle map click for identify
        async function handleMapClick(e) {
            if (!identifyEnabled || !currentService) return;

            try {
                const serviceType = document.getElementById('serviceType').value;
                
                if (serviceType === 'dynamic' && currentService.identify) {
                    // Use service identify method
                    const results = await currentService.identify(e.lngLat);
                    showIdentifyResults(e.lngLat, results);
                    
                } else if (serviceType === 'feature') {
                    // Query features at click point
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: ['features-fill', 'features-line', 'features-circle']
                    });
                    
                    if (features.length > 0) {
                        showFeatureInfo(e.lngLat, features[0]);
                    } else {
                        showNoResults(e.lngLat);
                    }
                    
                } else {
                    showMessage(e.lngLat, 'Identify not supported for this service type');
                }

            } catch (error) {
                console.error('Identify error:', error);
                showMessage(e.lngLat, 'Error identifying features');
            }
        }

        // Show identify results
        function showIdentifyResults(lngLat, results) {
            if (currentPopup) {
                currentPopup.remove();
            }

            if (!results || !results.features || results.features.length === 0) {
                showNoResults(lngLat);
                return;
            }

            const feature = results.features[0];
            const props = feature.properties || {};
            
            let content = '<div class="info-popup"><h3>Feature Information</h3>';
            
            Object.keys(props).slice(0, 5).forEach(key => {
                if (props[key] !== null && props[key] !== undefined) {
                    content += `<p><strong>${key}:</strong> ${props[key]}</p>`;
                }
            });
            
            content += '</div>';

            currentPopup = new maplibregl.Popup()
                .setLngLat(lngLat)
                .setHTML(content)
                .addTo(map);
        }

        // Show feature information
        function showFeatureInfo(lngLat, feature) {
            if (currentPopup) {
                currentPopup.remove();
            }

            const props = feature.properties || {};
            
            let content = '<div class="info-popup"><h3>Feature Properties</h3>';
            
            Object.keys(props).slice(0, 8).forEach(key => {
                if (props[key] !== null && props[key] !== undefined) {
                    content += `<p><strong>${key}:</strong> ${props[key]}</p>`;
                }
            });
            
            content += '</div>';

            currentPopup = new maplibregl.Popup()
                .setLngLat(lngLat)
                .setHTML(content)
                .addTo(map);
        }

        // Show no results message
        function showNoResults(lngLat) {
            showMessage(lngLat, 'No features found at this location');
        }

        // Show message popup
        function showMessage(lngLat, message) {
            if (currentPopup) {
                currentPopup.remove();
            }

            currentPopup = new maplibregl.Popup()
                .setLngLat(lngLat)
                .setHTML(`<div class="info-popup"><p>${message}</p></div>`)
                .addTo(map);
        }

        // Update URL example based on service type
        function updateUrlExample(serviceType) {
            const urlInput = document.getElementById('serviceUrl');
            
            const examples = {
                dynamic: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
                feature: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0',
                tiled: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer',
                vector: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer'
            };

            if (examples[serviceType] && urlInput.value.includes('sampleserver6')) {
                urlInput.value = examples[serviceType];
            }
        }

        // Initialize service type change handler
        document.getElementById('serviceType').addEventListener('change', (e) => {
            updateUrlExample(e.target.value);
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' && e.ctrlKey) {
                clearMap();
                e.preventDefault();
            }
            if (e.key === 'l' && e.ctrlKey) {
                loadService();
                e.preventDefault();
            }
        });

        console.log('esri-gl HTML viewer loaded successfully');
        console.log('Available services:', Object.keys(esrigl));
    </script>
</body>
</html>
```

## Mapbox GL JS Version

A complete HTML page using esri-gl with Mapbox GL JS:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>esri-gl with Mapbox GL JS</title>
    
    <!-- Mapbox GL CSS -->
    <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        
        #map {
            width: 100vw;
            height: 100vh;
        }
        
        .attribution {
            position: absolute;
            bottom: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.8);
            padding: 2px 5px;
            font-size: 12px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="attribution">
        Powered by <a href="https://github.com/muimsd/esri-gl" target="_blank">esri-gl</a>
    </div>

    <!-- Mapbox GL JavaScript -->
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
    
    <!-- esri-gl Library -->
    <script src="https://unpkg.com/esri-gl@latest/dist/esri-gl.js"></script>

    <script>
        // Set your Mapbox access token (required for Mapbox GL JS)
        mapboxgl.accessToken = 'your-mapbox-access-token';

        // Initialize Mapbox GL map
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v11',
            center: [-95, 40],
            zoom: 4
        });

        // Add navigation control
        map.addControl(new mapboxgl.NavigationControl());

        map.on('load', () => {
            // Add Dynamic Map Service
            const dynamicService = new esrigl.DynamicMapService('usa-service', map, {
                url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
            });

            // Add the layer to map
            map.addLayer({
                id: 'usa-layer',
                type: 'raster',
                source: 'usa-service'
            });

            // Add Feature Service
            const featureService = new esrigl.FeatureService('cities-service', map, {
                url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0',
                useVectorTiles: false
            });

            // Add feature layers
            setTimeout(() => {
                map.addLayer({
                    id: 'cities-points',
                    type: 'circle',
                    source: 'cities-service',
                    paint: {
                        'circle-radius': 8,
                        'circle-color': '#ff6b35',
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#ffffff'
                    }
                });
            }, 2000);

            console.log('Mapbox GL map with esri-gl services loaded');
        });
    </script>
</body>
</html>
```

## Minimal Example

A minimal HTML example for quick testing:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minimal esri-gl Example</title>
    <link href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <script src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"></script>
    <script src="https://unpkg.com/esri-gl@latest/dist/esri-gl.js"></script>
    
    <script>
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://demotiles.maplibre.org/style.json',
            center: [-95, 40],
            zoom: 4
        });

        map.on('load', () => {
            // Add ArcGIS Dynamic Map Service
            new esrigl.DynamicMapService('esri-service', map, {
                url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'
            });

            // Add the layer
            map.addLayer({
                id: 'esri-layer',
                type: 'raster',
                source: 'esri-service'
            });
        });
    </script>
</body>
</html>
```

## Interactive Dashboard Example

A more advanced dashboard-style HTML example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>esri-gl Dashboard</title>
    <link href="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.css" rel="stylesheet">
    
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 300px;
            background: #2c3e50;
            color: white;
            padding: 20px;
            overflow-y: auto;
        }
        
        .sidebar h2 {
            margin-top: 0;
            color: #3498db;
        }
        
        .service-group {
            margin-bottom: 25px;
            padding: 15px;
            background: rgba(52, 152, 219, 0.1);
            border-radius: 5px;
        }
        
        .service-group h3 {
            margin: 0 0 15px 0;
            color: #ecf0f1;
        }
        
        .service-item {
            margin-bottom: 10px;
        }
        
        .service-item button {
            width: 100%;
            padding: 8px 12px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .service-item button:hover {
            background: #2980b9;
        }
        
        .service-item button.active {
            background: #e74c3c;
        }
        
        #map {
            flex: 1;
            position: relative;
        }
        
        .map-info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1000;
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 5px;
            z-index: 2000;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <h2>esri-gl Dashboard</h2>
            
            <div class="service-group">
                <h3>Map Services</h3>
                <div class="service-item">
                    <button onclick="loadService('dynamic', 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer', 'USA Map')">USA Dynamic Service</button>
                </div>
                <div class="service-item">
                    <button onclick="loadService('tiled', 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer', 'World Time Zones')">World Time Zones</button>
                </div>
                <div class="service-item">
                    <button onclick="loadService('dynamic', 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer', 'Census Data')">Census Data</button>
                </div>
            </div>
            
            <div class="service-group">
                <h3>Feature Services</h3>
                <div class="service-item">
                    <button onclick="loadService('feature', 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0', 'USA Cities')">USA Cities</button>
                </div>
                <div class="service-item">
                    <button onclick="loadService('feature', 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2', 'USA States')">USA States</button>
                </div>
            </div>
            
            <div class="service-group">
                <h3>Vector Services</h3>
                <div class="service-item">
                    <button onclick="loadService('vector', 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer', 'World Basemap')">World Basemap</button>
                </div>
            </div>
            
            <div class="service-group">
                <h3>Actions</h3>
                <div class="service-item">
                    <button onclick="clearAllServices()">Clear All</button>
                </div>
                <div class="service-item">
                    <button onclick="toggleIdentify()">Toggle Identify</button>
                </div>
            </div>
        </div>
        
        <div id="map">
            <div class="loading" id="loading">Loading service...</div>
            <div class="map-info" id="mapInfo">Click a service to load</div>
        </div>
    </div>

    <script src="https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js"></script>
    <script src="https://unpkg.com/esri-gl@latest/dist/esri-gl.js"></script>
    
    <script>
        const map = new maplibregl.Map({
            container: 'map',
            style: 'https://demotiles.maplibre.org/style.json',
            center: [-95, 40],
            zoom: 4
        });

        // Add controls
        map.addControl(new maplibregl.NavigationControl());
        map.addControl(new maplibregl.ScaleControl());

        let services = new Map();
        let layerCounter = 0;
        let identifyEnabled = false;

        function showLoading() {
            document.getElementById('loading').style.display = 'block';
        }

        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
        }

        function updateMapInfo(text) {
            document.getElementById('mapInfo').textContent = text;
        }

        async function loadService(type, url, name) {
            showLoading();
            updateMapInfo(`Loading ${name}...`);

            try {
                const serviceId = `service-${layerCounter++}`;
                const layerId = `layer-${layerCounter}`;

                let service;
                switch (type) {
                    case 'dynamic':
                        service = new esrigl.DynamicMapService(serviceId, map, { url });
                        map.addLayer({
                            id: layerId,
                            type: 'raster',
                            source: serviceId
                        });
                        break;

                    case 'tiled':
                        service = new esrigl.TiledMapService(serviceId, map, { url });
                        map.addLayer({
                            id: layerId,
                            type: 'raster',
                            source: serviceId
                        });
                        break;

                    case 'feature':
                        service = new esrigl.FeatureService(serviceId, map, {
                            url,
                            useVectorTiles: true
                        });
                        
                        setTimeout(() => {
                            // Add feature layers based on geometry
                            const source = map.getSource(serviceId);
                            if (source) {
                                map.addLayer({
                                    id: `${layerId}-fill`,
                                    type: 'fill',
                                    source: serviceId,
                                    paint: {
                                        'fill-color': '#3498db',
                                        'fill-opacity': 0.6
                                    },
                                    filter: ['==', '$type', 'Polygon']
                                });

                                map.addLayer({
                                    id: `${layerId}-line`,
                                    type: 'line',
                                    source: serviceId,
                                    paint: {
                                        'line-color': '#2c3e50',
                                        'line-width': 2
                                    }
                                });

                                map.addLayer({
                                    id: `${layerId}-circle`,
                                    type: 'circle',
                                    source: serviceId,
                                    paint: {
                                        'circle-radius': 6,
                                        'circle-color': '#e74c3c',
                                        'circle-stroke-width': 2,
                                        'circle-stroke-color': '#ffffff'
                                    },
                                    filter: ['==', '$type', 'Point']
                                });
                            }
                        }, 1000);
                        break;

                    case 'vector':
                        service = new esrigl.VectorTileService(serviceId, map, { url });
                        break;
                }

                services.set(serviceId, { service, name, type, layerId });
                updateMapInfo(`Loaded: ${name} (${services.size} services active)`);

            } catch (error) {
                console.error('Error loading service:', error);
                updateMapInfo(`Error loading ${name}`);
            }

            hideLoading();
        }

        function clearAllServices() {
            services.forEach((serviceInfo, serviceId) => {
                if (serviceInfo.service && typeof serviceInfo.service.remove === 'function') {
                    serviceInfo.service.remove();
                }

                // Remove layers
                const layersToRemove = [
                    serviceInfo.layerId,
                    `${serviceInfo.layerId}-fill`,
                    `${serviceInfo.layerId}-line`,
                    `${serviceInfo.layerId}-circle`
                ];

                layersToRemove.forEach(layerId => {
                    if (map.getLayer(layerId)) {
                        map.removeLayer(layerId);
                    }
                });

                // Remove source
                if (map.getSource(serviceId)) {
                    map.removeSource(serviceId);
                }
            });

            services.clear();
            updateMapInfo('All services cleared');
        }

        function toggleIdentify() {
            identifyEnabled = !identifyEnabled;
            
            if (identifyEnabled) {
                map.on('click', handleMapClick);
                map.getCanvas().style.cursor = 'crosshair';
                updateMapInfo('Identify mode enabled - click on features');
            } else {
                map.off('click', handleMapClick);
                map.getCanvas().style.cursor = '';
                updateMapInfo(`${services.size} services active`);
            }
        }

        function handleMapClick(e) {
            if (!identifyEnabled) return;

            // Query all rendered features at click point
            const features = map.queryRenderedFeatures(e.point);
            
            if (features.length > 0) {
                const feature = features[0];
                const props = feature.properties || {};
                
                let content = '<h3>Feature Properties</h3>';
                Object.keys(props).slice(0, 5).forEach(key => {
                    if (props[key] !== null && props[key] !== undefined) {
                        content += `<p><strong>${key}:</strong> ${props[key]}</p>`;
                    }
                });

                new maplibregl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(content)
                    .addTo(map);
            }
        }

        map.on('load', () => {
            updateMapInfo('Map ready - click a service to load');
        });
    </script>
</body>
</html>
```

## Usage Instructions

### CDN Links
All examples use CDN links for easy setup:
- **MapLibre GL**: `https://unpkg.com/maplibre-gl@latest/dist/maplibre-gl.js`
- **Mapbox GL**: `https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js`
- **esri-gl**: `https://unpkg.com/esri-gl@latest/dist/esri-gl.js`

### Local Development
For local development, you can:
1. Download the files and reference local paths
2. Use npm/yarn to install packages and bundle
3. Build esri-gl locally and reference the dist files

### Key Features Demonstrated
- **Multiple Service Types**: Dynamic Map, Feature, Tiled Map, and Vector Tile services
- **Interactive Controls**: Service switching, layer management, identify functionality
- **Responsive Design**: Mobile-friendly layouts
- **Error Handling**: Graceful handling of service loading errors
- **Performance**: Efficient layer management and cleanup

Save any of these HTML files and open them in a web browser to see esri-gl in action!