// Mock implementation of maplibre-gl

const mockMap = {
  addSource: jest.fn(),
  removeSource: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getSource: jest.fn(() => ({
    setTiles: jest.fn(),
    setUrl: jest.fn(),
  })),
  getLayer: jest.fn(),
  setLayoutProperty: jest.fn(),
  setPaintProperty: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getCanvas: jest.fn(() => document.createElement('canvas')),
  getBounds: jest.fn(() => ({
    toArray: () => [
      [-180, -85],
      [180, 85],
    ],
    getNorth: () => 85,
    getSouth: () => -85,
    getEast: () => 180,
    getWest: () => -180,
  })),
  getZoom: jest.fn(() => 10),
  getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),
  queryRenderedFeatures: jest.fn(() => []),
  project: jest.fn(() => ({ x: 100, y: 100 })),
  unproject: jest.fn(() => ({ lng: 0, lat: 0 })),
  getBearing: jest.fn(() => 0),
  getPitch: jest.fn(() => 0),
  remove: jest.fn(),
  resize: jest.fn(),
  redraw: jest.fn(),
  triggerRepaint: jest.fn(),
  getContainer: jest.fn(() => document.createElement('div')),
};

module.exports = {
  Map: jest.fn().mockImplementation(() => mockMap),
  NavigationControl: jest.fn(),
  GeolocateControl: jest.fn(),
  AttributionControl: jest.fn(),
  ScaleControl: jest.fn(),
  FullscreenControl: jest.fn(),
  Marker: jest.fn(),
  Popup: jest.fn(),
};
