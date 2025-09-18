# VectorBasemapStyle

For loading complete [Esri Vector Basemap Styles](https://developers.arcgis.com/rest/services-reference/enterprise/vector-basemap-style-service.htm) that provide ready-to-use basemap designs with consistent styling and global coverage.

## Constructor

| Argument | Type | Description |
|----------|------|-------------|
| id | `string` | An id to assign to the basemap style |
| map | `Map` | A MapLibre GL or Mapbox GL map instance |
| esriServiceOptions | `object` | Options for the Vector Basemap Style (see below) |

## Esri Service Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| style | `string` | | **Required** Basemap style identifier |
| apiKey | `string` | | Esri API key for authentication |
| token | `string` | | Authentication token |
| language | `string` | `'en'` | Language for labels and text |
| worldview | `string` | `'USA'` | Regional perspective for boundaries |
| fetchOptions | `object` | | Additional fetch request options |

## Available Basemap Styles

### Navigation & Streets

| Style ID | Description | Best For |
|----------|-------------|----------|
| `arcgis/navigation` | High contrast navigation style | Turn-by-turn navigation |
| `arcgis/navigation-night` | Dark navigation style | Night mode navigation |
| `arcgis/streets` | Balanced street map | General mapping applications |
| `arcgis/streets-night` | Dark street map | Night mode applications |
| `arcgis/streets-relief` | Streets with terrain relief | Elevation-aware applications |

### Imagery & Satellite

| Style ID | Description | Best For |
|----------|-------------|----------|
| `arcgis/imagery` | High-resolution satellite imagery | Aerial analysis |
| `arcgis/imagery/hybrid` | Imagery with labels and roads | Mixed aerial/road context |
| `arcgis/imagery/labels` | Imagery with comprehensive labels | Detailed aerial mapping |

### Topographic & Terrain

| Style ID | Description | Best For |
|----------|-------------|----------|
| `arcgis/topographic` | Detailed topographic map | Outdoor recreation |
| `arcgis/terrain` | Physical terrain representation | Geographic analysis |
| `arcgis/oceans` | Bathymetric ocean mapping | Marine applications |

### Specialty Styles

| Style ID | Description | Best For |
|----------|-------------|----------|
| `arcgis/light-gray` | Minimal light background | Data visualization |
| `arcgis/dark-gray` | Minimal dark background | Dark mode data viz |
| `arcgis/nova` | Modern, clean design | Contemporary applications |
| `arcgis/colorful` | Vibrant, high-contrast | Public-facing apps |

## Usage

### Basic Implementation

```typescript
import { Map } from 'maplibre-gl';
import { VectorBasemapStyle } from 'esri-gl';

const map = new Map({
  container: 'map',
  center: [-95, 37],
  zoom: 4
});

map.on('load', () => {
  // Load Esri Streets basemap
  const basemap = new VectorBasemapStyle('esri-streets', map, {
    style: 'arcgis/streets',
    apiKey: 'your-esri-api-key'
  });
});
```

### Dark Mode Navigation

```typescript
// Perfect for navigation applications
const navigationBasemap = new VectorBasemapStyle('nav-basemap', map, {
  style: 'arcgis/navigation-night',
  apiKey: 'your-api-key',
  language: 'en',
  worldview: 'USA'
});
```

### Imagery Hybrid for Analysis

```typescript
// Satellite imagery with road overlays
const imageryBasemap = new VectorBasemapStyle('imagery-basemap', map, {
  style: 'arcgis/imagery/hybrid',
  apiKey: 'your-api-key'
});

// Add your data layers on top
map.on('style.load', () => {
  // Add your custom data layers here
  map.addSource('my-data', { /* your data source */ });
  map.addLayer({
    id: 'my-layer',
    source: 'my-data',
    type: 'fill',
    paint: {
      'fill-color': '#ff0000',
      'fill-opacity': 0.5
    }
  });
});
```

### Data Visualization Background

```typescript
// Clean, minimal background for data visualization
const dataVizBasemap = new VectorBasemapStyle('viz-basemap', map, {
  style: 'arcgis/light-gray',
  apiKey: 'your-api-key'
});

// Customize further by hiding unnecessary layers
map.on('style.load', () => {
  // Hide POI labels for cleaner look
  const layers = map.getStyle().layers;
  layers.forEach(layer => {
    if (layer.id.includes('poi') && layer.type === 'symbol') {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
  });
});
```

## Advanced Configuration

### Dynamic Style Switching

```typescript
class BasemapManager {
  private map: Map;
  private currentBasemap: VectorBasemapStyle | null = null;
  private apiKey: string;

  constructor(map: Map, apiKey: string) {
    this.map = map;
    this.apiKey = apiKey;
  }

  switchBasemap(styleId: string) {
    // Remove current basemap
    if (this.currentBasemap) {
      this.currentBasemap.remove();
    }

    // Load new basemap
    this.currentBasemap = new VectorBasemapStyle('basemap', this.map, {
      style: styleId,
      apiKey: this.apiKey
    });

    // Preserve user data layers
    this.map.on('style.load', () => {
      this.restoreDataLayers();
    });
  }

  private restoreDataLayers() {
    // Re-add your custom data layers after style change
    // Store layer configs and restore them here
  }
}

// Usage
const basemapManager = new BasemapManager(map, 'your-api-key');

// Switch to different basemaps
document.getElementById('streets-btn').onclick = () => {
  basemapManager.switchBasemap('arcgis/streets');
};

document.getElementById('imagery-btn').onclick = () => {
  basemapManager.switchBasemap('arcgis/imagery/hybrid');
};

document.getElementById('topo-btn').onclick = () => {
  basemapManager.switchBasemap('arcgis/topographic');
};
```

### Localization Support

```typescript
// Different language and regional perspectives
const localizedBasemaps = {
  'en-US': new VectorBasemapStyle('us-basemap', map, {
    style: 'arcgis/streets',
    language: 'en',
    worldview: 'USA',
    apiKey: 'your-api-key'
  }),
  
  'es-ES': new VectorBasemapStyle('es-basemap', map, {
    style: 'arcgis/streets',
    language: 'es',
    worldview: 'EUR',
    apiKey: 'your-api-key'
  }),
  
  'zh-CN': new VectorBasemapStyle('cn-basemap', map, {
    style: 'arcgis/streets',
    language: 'zh-Hans',
    worldview: 'CHN',
    apiKey: 'your-api-key'
  })
};

// Switch based on user preference
const userLocale = navigator.language;
const basemap = localizedBasemaps[userLocale] || localizedBasemaps['en-US'];
```

### Custom Attribution

```typescript
const basemap = new VectorBasemapStyle('custom-basemap', map, {
  style: 'arcgis/streets',
  apiKey: 'your-api-key'
});

// Add custom attribution
map.on('style.load', () => {
  map.getSource('esri-basemap')?.setAttribution(
    '© Esri | Custom Application Name'
  );
});
```

## Integration Patterns

### With React

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import { VectorBasemapStyle } from 'esri-gl';

interface BasemapSelectorProps {
  apiKey: string;
}

const BasemapSelector: React.FC<BasemapSelectorProps> = ({ apiKey }) => {
  const mapRef = useRef<Map | null>(null);
  const [basemapStyle, setBasemapStyle] = useState('arcgis/streets');

  const basemapOptions = [
    { id: 'arcgis/streets', name: 'Streets' },
    { id: 'arcgis/imagery/hybrid', name: 'Imagery' },
    { id: 'arcgis/topographic', name: 'Topographic' },
    { id: 'arcgis/light-gray', name: 'Light Gray' }
  ];

  useEffect(() => {
    if (mapRef.current) {
      new VectorBasemapStyle('basemap', mapRef.current, {
        style: basemapStyle,
        apiKey
      });
    }
  }, [basemapStyle, apiKey]);

  return (
    <div className="basemap-container">
      <div className="basemap-selector">
        {basemapOptions.map(option => (
          <button
            key={option.id}
            onClick={() => setBasemapStyle(option.id)}
            className={basemapStyle === option.id ? 'active' : ''}
          >
            {option.name}
          </button>
        ))}
      </div>
      <div ref={mapRef} className="map-container" />
    </div>
  );
};
```

### With Vue

```vue
<template>
  <div class="basemap-container">
    <div class="basemap-controls">
      <select v-model="selectedStyle" @change="updateBasemap">
        <option value="arcgis/streets">Streets</option>
        <option value="arcgis/imagery/hybrid">Imagery</option>
        <option value="arcgis/topographic">Topographic</option>
        <option value="arcgis/light-gray">Light Gray</option>
      </select>
    </div>
    <div ref="mapContainer" class="map"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Map } from 'maplibre-gl';
import { VectorBasemapStyle } from 'esri-gl';

const mapContainer = ref(null);
const selectedStyle = ref('arcgis/streets');
let map = null;
let basemap = null;

const props = defineProps({
  apiKey: String
});

onMounted(() => {
  map = new Map({
    container: mapContainer.value,
    center: [-95, 37],
    zoom: 4
  });

  updateBasemap();
});

const updateBasemap = () => {
  if (basemap) {
    basemap.remove();
  }
  
  if (map) {
    basemap = new VectorBasemapStyle('basemap', map, {
      style: selectedStyle.value,
      apiKey: props.apiKey
    });
  }
};

watch(selectedStyle, updateBasemap);
</script>
```

## Methods

### `remove()`

Removes the basemap style and cleans up resources.

```typescript
const basemap = new VectorBasemapStyle('temp-basemap', map, {
  style: 'arcgis/streets',
  apiKey: 'your-key'
});

// Later, remove the basemap
basemap.remove();
```

### `update(options)`

Updates the basemap configuration.

```typescript
basemap.update({
  style: 'arcgis/imagery/hybrid',
  language: 'es'
});
```

## Performance Optimization

### Preloading Styles

```typescript
// Preload multiple styles for faster switching
const styleCache = new Map();

const preloadStyles = async (styles: string[], apiKey: string) => {
  const promises = styles.map(async style => {
    const response = await fetch(
      `https://basemaps-api.arcgis.com/arcgis/rest/services/styles/${style}?type=style&token=${apiKey}`
    );
    const styleJson = await response.json();
    styleCache.set(style, styleJson);
  });

  await Promise.all(promises);
};

// Usage
await preloadStyles([
  'arcgis/streets',
  'arcgis/imagery/hybrid',
  'arcgis/topographic'
], 'your-api-key');
```

### Memory Management

```typescript
class OptimizedBasemapManager {
  private map: Map;
  private basemaps = new Map<string, VectorBasemapStyle>();
  private currentBasemap: string | null = null;

  constructor(map: Map) {
    this.map = map;
  }

  async switchBasemap(styleId: string, options: any) {
    // Hide current basemap instead of removing
    if (this.currentBasemap && this.basemaps.has(this.currentBasemap)) {
      this.basemaps.get(this.currentBasemap)?.hide();
    }

    // Create or show new basemap
    if (!this.basemaps.has(styleId)) {
      this.basemaps.set(styleId, new VectorBasemapStyle(
        `basemap-${styleId}`, this.map, options
      ));
    } else {
      this.basemaps.get(styleId)?.show();
    }

    this.currentBasemap = styleId;
  }

  cleanup() {
    this.basemaps.forEach(basemap => basemap.remove());
    this.basemaps.clear();
  }
}
```

## Error Handling

```typescript
const createBasemap = async (styleId: string, apiKey: string) => {
  try {
    const basemap = new VectorBasemapStyle('basemap', map, {
      style: styleId,
      apiKey
    });

    // Listen for style load events
    map.on('style.load', () => {
      console.log(`Basemap ${styleId} loaded successfully`);
    });

    return basemap;
  } catch (error) {
    console.error(`Failed to load basemap ${styleId}:`, error);
    
    // Fallback to a simple basemap
    return new VectorBasemapStyle('fallback-basemap', map, {
      style: 'arcgis/light-gray',
      apiKey
    });
  }
};

// Handle network errors
map.on('sourcedataloading', (e) => {
  if (e.sourceId.includes('basemap')) {
    console.log('Loading basemap tiles...');
  }
});

map.on('error', (e) => {
  console.error('Basemap error:', e);
  // Show user-friendly error message
});
```

## Best Practices

1. **API Key Management**: Store API keys securely and rotate them regularly
2. **Style Consistency**: Choose basemaps that complement your data visualization
3. **Performance**: Use appropriate basemaps for your use case (light-gray for data viz, imagery for analysis)
4. **Accessibility**: Consider color contrast and readability for all users
5. **Localization**: Use appropriate language and worldview settings for your audience

## Troubleshooting

### Common Issues

**Problem**: Basemap not loading  
**Solution**: Verify your API key is valid and has appropriate permissions

**Problem**: Attribution not showing  
**Solution**: Ensure attribution is enabled in your map configuration

**Problem**: Style switching is slow  
**Solution**: Implement style preloading or caching strategies

**Problem**: Labels in wrong language  
**Solution**: Set the correct `language` and `worldview` parameters

### Debugging

```typescript
// Check available styles
fetch('https://basemaps-api.arcgis.com/arcgis/rest/services/styles?f=json')
  .then(r => r.json())
  .then(styles => console.log('Available styles:', styles));

// Monitor style loading
map.on('styledata', (e) => {
  console.log('Style event:', e.dataType);
});

// Check current style
console.log('Current style:', map.getStyle());
```