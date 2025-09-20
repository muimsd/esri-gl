# VectorBasemapStyle

The `VectorBasemapStyle` class provides easy access to Esri's professionally designed vector basemap styles through the ArcGIS Basemaps API. These basemaps offer high-quality cartographic styling with global coverage and are ideal for creating polished mapping applications.

## Key Features

- **Professional design** - Cartographically optimized styles from Esri
- **Global coverage** - Consistent styling worldwide with localized labels
- **High performance** - Optimized vector tiles with efficient rendering
- **Multiple themes** - Streets, topographic, imagery, navigation, and specialty styles
- **Customizable** - Language and worldview options for localization
- **Always updated** - Styles maintained and updated by Esri

## Constructor

```typescript
new VectorBasemapStyle(styleName?: string, apikey?: string)
```

### Parameters

- **`styleName`** (`string`, optional) - Esri basemap style identifier (default: 'ArcGIS:Streets')
- **`apikey`** (`string`, required) - Esri API key for authentication

### Available Styles

| Style ID | Description | Use Cases |
|----------|-------------|-----------|
| `ArcGIS:Streets` | Standard street map | General purpose, navigation |
| `ArcGIS:Topographic` | Topographic map with terrain | Outdoor recreation, analysis |
| `ArcGIS:Navigation` | High-contrast navigation style | Turn-by-turn navigation |
| `ArcGIS:Streets:Relief` | Streets with hillshade relief | Context with terrain awareness |
| `ArcGIS:Imagery` | Satellite imagery basemap | Imagery analysis, context |
| `ArcGIS:Oceans` | Bathymetric ocean mapping | Marine applications |
| `ArcGIS:LightGray` | Light gray reference map | Data visualization overlay |
| `ArcGIS:DarkGray` | Dark gray reference map | Dark theme applications |
| `ArcGIS:Human:Geography` | Human geography emphasis | Demographics, social analysis |
| `ArcGIS:Human:Geography:Dark` | Dark human geography | Dark theme social maps |

## Basic Usage

```typescript
import { VectorBasemapStyle } from 'esri-gl';
import maplibregl from 'maplibre-gl';

// Create basemap style instance
const basemapStyle = new VectorBasemapStyle('ArcGIS:Streets', 'YOUR_API_KEY');

// Load and apply the style
const loadBasemap = async () => {
  try {
    const response = await fetch(basemapStyle.styleUrl);
    const style = await response.json();
    
    const map = new maplibregl.Map({
      container: 'map',
      style: style,
      center: [-118.2437, 34.0522],
      zoom: 10
    });
  } catch (error) {
    console.error('Failed to load basemap:', error);
  }
};

loadBasemap();
```

## Advanced Usage

### Dynamic Style Switching

```typescript
class BasemapSwitcher {
  private map: maplibregl.Map;
  private apikey: string;
  private currentStyle: string = 'ArcGIS:Streets';

  constructor(map: maplibregl.Map, apikey: string) {
    this.map = map;
    this.apikey = apikey;
  }

  async switchStyle(styleName: string): Promise<void> {
    if (this.currentStyle === styleName) return;

    try {
      const basemap = new VectorBasemapStyle(styleName, this.apikey);
      const response = await fetch(basemap.styleUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const style = await response.json();
      
      // Preserve current view state
      const center = this.map.getCenter();
      const zoom = this.map.getZoom();
      const bearing = this.map.getBearing();
      const pitch = this.map.getPitch();

      // Apply new style
      this.map.setStyle(style);
      
      // Restore view state after style loads
      this.map.once('styledata', () => {
        this.map.setCenter(center);
        this.map.setZoom(zoom);
        this.map.setBearing(bearing);
        this.map.setPitch(pitch);
      });

      this.currentStyle = styleName;
    } catch (error) {
      console.error(`Failed to switch to ${styleName}:`, error);
      throw error;
    }
  }

  getCurrentStyle(): string {
    return this.currentStyle;
  }
}

// Usage
const switcher = new BasemapSwitcher(map, 'YOUR_API_KEY');

// Switch styles
await switcher.switchStyle('ArcGIS:Navigation');
await switcher.switchStyle('ArcGIS:Imagery');
```

### Style with Localization

```typescript
// Create style URL with language and worldview parameters
const createLocalizedStyle = (styleName: string, apikey: string, options?: {
  language?: string;
  worldview?: string;
}) => {
  let url = `https://basemaps-api.arcgis.com/arcgis/rest/services/styles/${styleName}?type=style&apiKey=${apikey}`;
  
  if (options?.language) {
    url += `&language=${options.language}`;
  }
  
  if (options?.worldview) {
    url += `&worldview=${options.worldview}`;
  }
  
  return url;
};

// Load localized basemap
const loadLocalizedBasemap = async () => {
  const styleUrl = createLocalizedStyle('ArcGIS:Streets', 'YOUR_API_KEY', {
    language: 'es',  // Spanish labels
    worldview: 'ARG' // Argentina worldview
  });
  
  const response = await fetch(styleUrl);
  const style = await response.json();
  
  map.setStyle(style);
};
```

### Basemap Gallery Component

```typescript
interface BasemapOption {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
}

class BasemapGallery {
  private map: maplibregl.Map;
  private apikey: string;
  private options: BasemapOption[];

  constructor(map: maplibregl.Map, apikey: string) {
    this.map = map;
    this.apikey = apikey;
    this.options = [
      {
        id: 'ArcGIS:Streets',
        name: 'Streets',
        description: 'Comprehensive street map with places and landmarks'
      },
      {
        id: 'ArcGIS:Imagery',
        name: 'Imagery',
        description: 'High-resolution satellite imagery'
      },
      {
        id: 'ArcGIS:Topographic', 
        name: 'Topographic',
        description: 'Detailed topographic map with terrain features'
      },
      {
        id: 'ArcGIS:Oceans',
        name: 'Oceans',
        description: 'Bathymetric map optimized for marine applications'
      }
    ];
  }

  async setBasemap(styleId: string): Promise<void> {
    const basemap = new VectorBasemapStyle(styleId, this.apikey);
    
    try {
      const response = await fetch(basemap.styleUrl);
      const style = await response.json();
      this.map.setStyle(style);
    } catch (error) {
      console.error(`Failed to load basemap ${styleId}:`, error);
      throw error;
    }
  }

  getOptions(): BasemapOption[] {
    return this.options;
  }

  createGalleryElement(): HTMLElement {
    const gallery = document.createElement('div');
    gallery.className = 'basemap-gallery';
    
    this.options.forEach(option => {
      const item = document.createElement('button');
      item.className = 'basemap-item';
      item.innerHTML = `
        <div class="basemap-name">${option.name}</div>
        <div class="basemap-description">${option.description}</div>
      `;
      
      item.addEventListener('click', () => {
        this.setBasemap(option.id).catch(console.error);
      });
      
      gallery.appendChild(item);
    });

    return gallery;
  }
}
```

## Methods

### styleUrl (getter)

Returns the complete URL for the basemap style endpoint.

```typescript
const basemap = new VectorBasemapStyle('ArcGIS:Navigation', 'YOUR_API_KEY');
console.log(basemap.styleUrl);
// https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:Navigation?type=style&apiKey=YOUR_API_KEY

// Use the URL to fetch the style
const response = await fetch(basemap.styleUrl);
const style = await response.json();
map.setStyle(style);
```

### setStyle(styleName)

Changes the basemap style identifier.

```typescript
const basemap = new VectorBasemapStyle('ArcGIS:Streets', 'YOUR_API_KEY');

// Change to topographic style
basemap.setStyle('ArcGIS:Topographic');

// Apply the new style
const response = await fetch(basemap.styleUrl);
const style = await response.json();
map.setStyle(style);
```

### update()

Updates the basemap (primarily for API consistency).

```typescript
basemap.update(); // Style updates handled through URL changes
```

### remove()

Removes the basemap (no explicit removal needed for styles).

```typescript
basemap.remove(); // No operation needed for styles
```

## Interactive Demo

```jsx
import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { VectorBasemapStyle } from 'esri-gl';

const BasemapDemo = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [currentStyle, setCurrentStyle] = useState('ArcGIS:Streets');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  const styleOptions = [
    { id: 'ArcGIS:Streets', name: 'Streets' },
    { id: 'ArcGIS:Topographic', name: 'Topographic' },
    { id: 'ArcGIS:Navigation', name: 'Navigation' },
    { id: 'ArcGIS:Imagery', name: 'Imagery' },
    { id: 'ArcGIS:LightGray', name: 'Light Gray' },
    { id: 'ArcGIS:DarkGray', name: 'Dark Gray' },
    { id: 'ArcGIS:Oceans', name: 'Oceans' }
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize with basic style
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [-118.2437, 34.0522],
      zoom: 10
    });

    return () => map.current?.remove();
  }, []);

  const switchBasemap = async (styleId) => {
    if (!apiKey || loading) return;

    setLoading(true);
    try {
      const basemap = new VectorBasemapStyle(styleId, apiKey);
      const response = await fetch(basemap.styleUrl);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const style = await response.json();
      map.current.setStyle(style);
      setCurrentStyle(styleId);
    } catch (error) {
      console.error('Failed to load basemap:', error);
      alert('Failed to load basemap. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h3>Esri Vector Basemap Demo</h3>
        <p>Enter your Esri API Key to try different basemap styles</p>
        <input
          type="password"
          placeholder="Esri API Key"
          onChange={e => setApiKey(e.target.value)}
          style={{ padding: 10, width: 300, marginRight: 10 }}
        />
        <p>
          <a href="https://developers.arcgis.com/" target="_blank">
            Get a free API key from ArcGIS Developers
          </a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '400px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <div style={{ background: 'white', padding: 10, borderRadius: 5 }}>
          <h4>Basemap Styles</h4>
          {styleOptions.map(option => (
            <button
              key={option.id}
              onClick={() => switchBasemap(option.id)}
              disabled={loading}
              style={{
                display: 'block',
                margin: '5px 0',
                padding: '5px 10px',
                backgroundColor: currentStyle === option.id ? '#0078d4' : '#f0f0f0',
                color: currentStyle === option.id ? 'white' : 'black',
                border: 'none',
                borderRadius: 3,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading && currentStyle === option.id ? 'Loading...' : option.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Common Patterns

### Theme Switching

```typescript
class ThemeManager {
  private map: maplibregl.Map;
  private apikey: string;
  private isDarkTheme: boolean = false;

  constructor(map: maplibregl.Map, apikey: string) {
    this.map = map;
    this.apikey = apikey;
  }

  async toggleTheme(): Promise<void> {
    const newStyle = this.isDarkTheme ? 'ArcGIS:Streets' : 'ArcGIS:DarkGray';
    
    const basemap = new VectorBasemapStyle(newStyle, this.apikey);
    const response = await fetch(basemap.styleUrl);
    const style = await response.json();
    
    this.map.setStyle(style);
    this.isDarkTheme = !this.isDarkTheme;

    // Update UI theme
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.isDarkTheme ? 'dark' : 'light';
  }
}
```

### Application-Specific Basemaps

```typescript
class AppBasemaps {
  private map: maplibregl.Map;
  private apikey: string;

  // Define basemaps for different application contexts
  private contexts = {
    navigation: 'ArcGIS:Navigation',
    outdoor: 'ArcGIS:Topographic', 
    marine: 'ArcGIS:Oceans',
    analysis: 'ArcGIS:LightGray',
    satellite: 'ArcGIS:Imagery'
  };

  constructor(map: maplibregl.Map, apikey: string) {
    this.map = map;
    this.apikey = apikey;
  }

  async setContextBasemap(context: keyof typeof this.contexts): Promise<void> {
    const styleId = this.contexts[context];
    if (!styleId) throw new Error(`Unknown context: ${context}`);

    const basemap = new VectorBasemapStyle(styleId, this.apikey);
    const response = await fetch(basemap.styleUrl);
    const style = await response.json();
    
    this.map.setStyle(style);
  }

  getAvailableContexts(): string[] {
    return Object.keys(this.contexts);
  }
}

// Usage
const appBasemaps = new AppBasemaps(map, 'YOUR_API_KEY');

// Switch based on application mode
await appBasemaps.setContextBasemap('navigation'); // For turn-by-turn
await appBasemaps.setContextBasemap('analysis');   // For data visualization
```

### Basemap Preloading

```typescript
class BasemapCache {
  private apikey: string;
  private cache: Map<string, any> = new Map();

  constructor(apikey: string) {
    this.apikey = apikey;
  }

  async preloadStyles(styleIds: string[]): Promise<void> {
    const loadPromises = styleIds.map(async (styleId) => {
      if (this.cache.has(styleId)) return;

      try {
        const basemap = new VectorBasemapStyle(styleId, this.apikey);
        const response = await fetch(basemap.styleUrl);
        const style = await response.json();
        
        this.cache.set(styleId, style);
        console.log(`Preloaded basemap: ${styleId}`);
      } catch (error) {
        console.warn(`Failed to preload ${styleId}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  getStyle(styleId: string): any | null {
    return this.cache.get(styleId) || null;
  }

  async applyStyle(map: maplibregl.Map, styleId: string): Promise<void> {
    let style = this.getStyle(styleId);
    
    if (!style) {
      // Load on demand if not cached
      const basemap = new VectorBasemapStyle(styleId, this.apikey);
      const response = await fetch(basemap.styleUrl);
      style = await response.json();
      this.cache.set(styleId, style);
    }
    
    map.setStyle(style);
  }
}

// Usage
const cache = new BasemapCache('YOUR_API_KEY');

// Preload commonly used styles
await cache.preloadStyles([
  'ArcGIS:Streets',
  'ArcGIS:Topographic', 
  'ArcGIS:LightGray'
]);

// Instant switching for cached styles
await cache.applyStyle(map, 'ArcGIS:Topographic');
```

## Error Handling

```typescript
class RobustBasemapLoader {
  private apikey: string;
  private fallbackStyle: string = 'ArcGIS:Streets';

  constructor(apikey: string) {
    this.apikey = apikey;
  }

  async loadBasemap(
    map: maplibregl.Map, 
    styleId: string, 
    retries: number = 3
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const basemap = new VectorBasemapStyle(styleId, this.apikey);
        const response = await fetch(basemap.styleUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const style = await response.json();
        
        if (!style || !style.layers) {
          throw new Error('Invalid style response');
        }
        
        map.setStyle(style);
        return; // Success
        
      } catch (error) {
        console.warn(`Attempt ${attempt} failed for ${styleId}:`, error.message);
        
        if (attempt === retries) {
          // Final attempt - try fallback
          if (styleId !== this.fallbackStyle) {
            console.log(`Falling back to ${this.fallbackStyle}`);
            await this.loadBasemap(map, this.fallbackStyle, 1);
          } else {
            throw new Error(`Failed to load basemap after ${retries} attempts`);
          }
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  validateApiKey(apikey: string): boolean {
    // Basic validation - real implementation would test with API
    return apikey && apikey.length > 10 && !apikey.includes(' ');
  }
}

// Usage with error handling
const loader = new RobustBasemapLoader('YOUR_API_KEY');

try {
  await loader.loadBasemap(map, 'ArcGIS:Navigation');
} catch (error) {
  console.error('All basemap loading attempts failed:', error);
  // Show user-friendly error message
  alert('Unable to load basemap. Please check your connection and try again.');
}
```

## API Key Management

### Development vs Production

```typescript
class ApiKeyManager {
  private static instance: ApiKeyManager;
  private apikey: string = '';
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  setApiKey(apikey: string): void {
    this.apikey = apikey;
  }

  getApiKey(): string {
    if (!this.apikey) {
      if (this.isProduction) {
        throw new Error('Esri API key not configured for production');
      } else {
        console.warn('Esri API key not set - using development fallback');
        return 'YOUR_DEV_API_KEY';
      }
    }
    return this.apikey;
  }

  createBasemapStyle(styleName?: string): VectorBasemapStyle {
    return new VectorBasemapStyle(styleName, this.getApiKey());
  }
}

// Usage
const keyManager = ApiKeyManager.getInstance();
keyManager.setApiKey(process.env.REACT_APP_ESRI_API_KEY || '');

const basemap = keyManager.createBasemapStyle('ArcGIS:Streets');
```

## Performance Tips

1. **Preload styles** - Cache frequently used basemaps for instant switching
2. **API key security** - Use environment variables, never commit keys to code
3. **Error handling** - Implement fallback styles and retry logic
4. **Memory management** - Clear unused cached styles in long-running applications
5. **Network optimization** - Consider loading styles on demand vs preloading all

## Best Practices

- Use VectorBasemapStyle for **professional cartographic basemaps**
- Use VectorTileService for **custom organizational data**
- Use TiledMapService for **cached reference layers**
- Always implement proper API key management and security
- Provide fallback basemaps for error conditions
- Consider user preferences for light/dark themes
- Test basemap switching performance on target devices
- Monitor API usage to stay within service limits

---

*For more examples, see the [VectorBasemapStyle demo component](https://github.com/muimsd/esri-map-gl/blob/master/src/demo/components/VectorBasemapStyleDemo.tsx) in the repository.*

*To get started with Esri basemaps, visit [ArcGIS Developers](https://developers.arcgis.com/) for a free API key.*