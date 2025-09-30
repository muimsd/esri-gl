# Esri GL React Integration Examples

This directory contains comprehensive examples demonstrating different ways to integrate esri-gl with React applications. These examples showcase various integration patterns, from React hooks to direct MapLibre integration.

## 🚀 Examples Overview

### 1. **React Hooks** (`hooks`)
Demonstrates the React hooks provided by esri-gl for managing service lifecycle:
- `useDynamicMapService` - Dynamic Map Service management
- `useIdentifyFeatures` - Feature identification
- `useTiledMapService` - Tiled Map Service integration
- Automatic cleanup and state management

### 2. **React Map GL** (`mapgl`) 
Shows seamless integration with react-map-gl using esri-gl components:
- `EsriDynamicLayer` - Dynamic layer components
- `EsriFeatureLayer` - Feature layer with data-driven styling
- `EsriTiledLayer` - Cached tile layer integration
- `EsriImageLayer` - Image service integration
- Advanced layer controls and configuration
- Mapbox GL JS compatibility

### 3. **Identify Features** (`identify`)
Interactive feature identification with advanced functionality:
- Click-to-identify workflow
- Multiple layer querying
- Attribute display and formatting
- Error handling and loading states

### 4. **MapLibre Direct** (`maplibre`)
Direct MapLibre GL JS integration without wrapper components:
- Pure MapLibre GL JS implementation
- Manual service lifecycle management
- Interactive identify functionality
- No external map service tokens required
- OpenStreetMap base layer integration

### 5. **Advanced Configuration** (`advanced`)
Advanced service configuration and real-time parameter adjustment:
- Dynamic layer sublayer control
- SQL-based layer definitions (WHERE clauses)
- Image format and DPI configuration
- Transparency controls
- Real-time parameter updates

## 🏗️ Architecture Patterns

### Service-Hook Pattern
```typescript
const { service, loading, error } = useDynamicMapService({
  sourceId: 'my-source',
  map: mapInstance,
  options: {
    url: 'https://example.com/MapServer',
    layers: [0, 1, 2]
  }
});
```

### Component Pattern (React Map GL)
```tsx
<Map>
  <EsriDynamicLayer
    id="usa-layer"
    url="https://example.com/MapServer"
    layers={[0, 1, 2]}
    layerDefs={{ "0": "POPULATION > 1000000" }}
  />
</Map>
```

### Direct Integration Pattern
```typescript
const service = new DynamicMapService(
  sourceId,
  mapInstance,
  { url: '...', layers: [0, 1] }
);
```

## 🛠️ Features Demonstrated

### Service Management
- ✅ Automatic source lifecycle
- ✅ React state integration
- ✅ Error handling and loading states
- ✅ Configuration hot-reloading
- ✅ Memory leak prevention

### Layer Configuration
- ✅ Dynamic sublayer control
- ✅ SQL-based filtering (layerDefs)
- ✅ Format optimization (PNG24, PNG32, JPEG)
- ✅ DPI scaling for high-resolution displays
- ✅ Transparency controls

### Interactive Features
- ✅ Click-to-identify functionality
- ✅ Tolerance-based queries
- ✅ Multi-layer identification
- ✅ Attribute formatting and display
- ✅ Geometry return options

### Integration Compatibility
- ✅ Mapbox GL JS (via react-map-gl)
- ✅ MapLibre GL JS (direct integration)
- ✅ TypeScript support throughout
- ✅ React 18+ compatibility
- ✅ Modern ES modules

## 📦 Dependencies

### Required
- `react` ^19.1.1
- `react-dom` ^19.1.1
- `esri-gl` (latest)

### Map Libraries (choose one or both)
- `mapbox-gl` ^3.15.0 + `react-map-gl` ^7.1.7
- `maplibre-gl` ^4.7.1

### Development
- `@vitejs/plugin-react` ^5.0.3
- `typescript` ^5.9.2
- `vite` ^7.1.5

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for optional configuration:

```env
# Optional: Mapbox access token for React Map GL examples
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Vite Configuration
The project uses Vite with React plugin and TypeScript support. Path aliases are configured for clean imports:

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, '../../src'),
    'esri-gl': path.resolve(__dirname, '../../src/main.ts'),
    'esri-gl/react': path.resolve(__dirname, '../../src/react.ts'),
    'esri-gl/react-map-gl': path.resolve(__dirname, '../../src/react-map-gl.ts')
  }
}
```

## 🎯 Use Cases

### Enterprise Applications
- **React Hooks**: Perfect for applications needing declarative service management
- **React Map GL**: Ideal for applications already using Mapbox ecosystem
- **Advanced Config**: Great for admin interfaces requiring fine-grained control

### Prototype Development
- **MapLibre Direct**: Quick start without external dependencies
- **Identify Features**: Rapid data exploration and analysis

### Production Deployment
- **All examples**: Production-ready patterns with proper error handling
- **TypeScript**: Full type safety and IntelliSense support
- **Modern bundling**: Optimized builds with tree-shaking

## 📚 Further Reading

- [esri-gl Documentation](../../docs/)
- [React Map GL Documentation](https://visgl.github.io/react-map-gl/)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js-docs/)
- [ArcGIS REST API Reference](https://developers.arcgis.com/rest/)

## 🤝 Contributing

These examples serve as both documentation and testing ground for esri-gl React integration. Contributions improving clarity, adding new patterns, or fixing issues are welcome!