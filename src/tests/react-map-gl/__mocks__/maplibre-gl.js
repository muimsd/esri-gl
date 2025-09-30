// Mock MapLibre GL JS
const mockMap = {
  addSource: () => {},
  removeSource: () => {},
  addLayer: () => {},
  removeLayer: () => {},
  getSource: () => ({
    setTiles: () => {},
    setUrl: () => {}
  }),
  getLayer: () => null,
  setLayoutProperty: () => {},
  setPaintProperty: () => {},
  on: () => {},
  off: () => {},
  getCanvas: jest.fn(() => document.createElement('canvas')),
  getBounds: jest.fn(() => ({
    toArray: () => [[-180, -85], [180, 85]]
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
  _update: jest.fn(),
  _render: jest.fn(),
  loaded: jest.fn(() => true),
  isStyleLoaded: jest.fn(() => true),
  areTilesLoaded: jest.fn(() => true),
  getStyle: jest.fn(),
  setStyle: jest.fn()
};

const mockMapLibreGL = {
  Map: jest.fn(() => mockMap),
  setWorkerUrl: jest.fn(),
  workerUrl: 'mock-worker-url',
  version: '3.0.0',
  supported: jest.fn(() => true),
  clearStorage: jest.fn(),
  prewarm: jest.fn(),
  LngLat: jest.fn((lng, lat) => ({ lng, lat })),
  LngLatBounds: jest.fn(() => ({
    extend: jest.fn(),
    getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),
    getNorth: jest.fn(() => 85),
    getSouth: jest.fn(() => -85),
    getEast: jest.fn(() => 180),
    getWest: jest.fn(() => -180),
    toArray: jest.fn(() => [[-180, -85], [180, 85]])
  })),
  Point: jest.fn((x, y) => ({ x, y })),
  MercatorCoordinate: jest.fn(),
  Popup: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    setHTML: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis()
  })),
  Marker: jest.fn(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    setPopup: jest.fn().mockReturnThis(),
    getElement: jest.fn(() => document.createElement('div'))
  })),
  NavigationControl: jest.fn(() => ({
    onAdd: jest.fn(),
    onRemove: jest.fn()
  })),
  GeolocateControl: jest.fn(() => ({
    onAdd: jest.fn(),
    onRemove: jest.fn()
  })),
  AttributionControl: jest.fn(() => ({
    onAdd: jest.fn(),
    onRemove: jest.fn()
  })),
  ScaleControl: jest.fn(() => ({
    onAdd: jest.fn(),
    onRemove: jest.fn()
  })),
  FullscreenControl: jest.fn(() => ({
    onAdd: jest.fn(),
    onRemove: jest.fn()
  }))
};

module.exports = mockMapLibreGL;