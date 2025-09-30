# esri-gl Examples

This directory contains example applications demonstrating how to use the `esri-gl` library with different mapping frameworks and build tools.

## Available Examples

### MapLibre + React + TypeScript
📁 **[maplibre-react-dynamic](./maplibre-react-dynamic/)**
- Framework: React 18 with TypeScript
- Mapping Library: MapLibre GL JS
- Build Tool: Vite
- Features: Dynamic layers, server-side labeling, styling, filtering, and feature identification

### React Integration Examples
📁 **[react-integration](./react-integration/)**
- Framework: React 18 with TypeScript
- Mapping Library: MapLibre GL JS and Mapbox GL JS
- Build Tool: Vite
- Features: React hooks, components, and integration patterns for esri-gl

## Running Examples

Each example is a standalone project with its own dependencies:

```bash
# Navigate to an example
cd examples/maplibre-react-dynamic

# Install dependencies
npm install

# Start development server
npm run dev
```

## Local Development with esri-gl

If you're developing esri-gl locally and want to test with these examples:

### Option 1: npm link (Recommended)

1. In the main esri-gl directory:
   ```bash
   npm run build
   npm link
   ```

2. In the example directory:
   ```bash
   npm link esri-gl
   npm run dev
   ```

### Option 2: File Path Dependency

Modify the example's `package.json`:

```json
{
  "dependencies": {
    "esri-gl": "file:../../",
    // ... other dependencies
  }
}
```

Then run `npm install` in the example directory.

## Contributing Examples

We welcome additional examples! When contributing:

1. Create a new directory under `examples/`
2. Use a descriptive name format: `{mapping-library}-{framework}-{feature}`
3. Include a comprehensive README.md
4. Ensure the example runs with `npm install && npm run dev`
5. Use the latest stable versions of dependencies
6. Add TypeScript support when possible
7. Include proper error handling and loading states

## Example Ideas

Some ideas for additional examples:

- `mapbox-vanilla-js` - Pure JavaScript with Mapbox GL JS
- `maplibre-vue-composition` - Vue 3 with Composition API
- `mapbox-angular-standalone` - Angular with standalone components
- `maplibre-svelte-kit` - SvelteKit application
- `mapbox-nextjs-app-router` - Next.js with App Router
- `maplibre-electron-desktop` - Electron desktop application

## License

All examples are provided under the MIT License, same as the main esri-gl library.
