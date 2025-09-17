# esri-gl
A small library to make it easier to use various Esri ArcGIS services in MapLibre GL JS or Mapbox GL JS.

**Note** This library is compatible with both mapbox-gl and maplibre-gl.

Currently supports
- Esri Map Services
  - Dynamic
  - Tiled
- Esri Vector Tile Services
- Esri Vector Basemap Styles

## Installation & Use

### Stable Release
```bash
npm install esri-gl
```

### Alpha/Beta Releases
```bash
# Latest alpha release (current: v0.1.0-alpha.0)
npm install esri-gl@alpha

# Specific alpha version
npm install esri-gl@0.1.0-alpha.0

# Latest beta release  
npm install esri-gl@beta
```

### GitHub Packages (Alternative Registry)
```bash
# Configure npm to use GitHub Packages for @muimsd scope
npm config set @muimsd:registry https://npm.pkg.github.com/

# Install from GitHub Packages
npm install @muimsd/esri-gl

# Or use the setup script
./scripts/github-packages.sh configure
./scripts/github-packages.sh install
```

## Usage
Check out the [docs](https://frontiersi.github.io/esri-gl/)

## Acknowledgements
- Esri-Leaflet was one of the first open-source projects I used and contributed to. It's still a fantastic piece of work that I refered to for inspiration (and stealing some words for documentation).
- Mapbox-gl is an incredible front-end mapping library.# Test automation publishing
