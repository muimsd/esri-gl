
// Simple mock function implementation (replaces mockFn)
function mockFn(returnValue) {
  const fn = function(...args) {
    fn.mock.calls.push(args);
    return typeof returnValue === 'function' ? returnValue(...args) : returnValue;
  };
  fn.mock = { calls: [] };
  fn.mockReturnThis = () => fn;
  fn.mockReturnValue = (val) => function(...args) { fn.mock.calls.push(args); return val; };
  return fn;
}

// Mock Mapbox GL JS (similar to MapLibre)
const mockMap = {
  addSource: mockFn(),
  removeSource: mockFn(),
  addLayer: mockFn(),
  removeLayer: mockFn(),
  getSource: mockFn(() => ({
    setTiles: mockFn(),
    setUrl: mockFn()
  })),
  getLayer: mockFn(),
  setLayoutProperty: mockFn(),
  setPaintProperty: mockFn(),
  on: mockFn(),
  off: mockFn(),
  getCanvas: mockFn(() => document.createElement('canvas')),
  getBounds: mockFn(() => ({
    toArray: () => [[-180, -85], [180, 85]]
  })),
  getZoom: mockFn(() => 10),
  getCenter: mockFn(() => ({ lng: 0, lat: 0 })),
  queryRenderedFeatures: mockFn(() => []),
  project: mockFn(() => ({ x: 100, y: 100 })),
  unproject: mockFn(() => ({ lng: 0, lat: 0 })),
  getBearing: mockFn(() => 0),
  getPitch: mockFn(() => 0),
  remove: mockFn(),
  Map: mockFn(() => mockMap),
  setRTLTextPlugin: mockFn(),
  version: '2.15.0',
  supported: mockFn(() => true),
  clearStorage: mockFn(),
  prewarm: mockFn(),
  LngLat: mockFn((lng, lat) => ({ lng, lat })),
  LngLatBounds: mockFn(() => ({
    extend: mockFn(),
    getCenter: mockFn(() => ({ lng: 0, lat: 0 })),
    getNorth: mockFn(() => 85),
    getSouth: mockFn(() => -85),
    getEast: mockFn(() => 180),
    getWest: mockFn(() => -180),
    toArray: mockFn(() => [[-180, -85], [180, 85]])
  })),
  Point: mockFn((x, y) => ({ x, y })),
  MercatorCoordinate: mockFn(),
  Popup: mockFn(() => ({
    setLngLat: mockFn().mockReturnThis(),
    setHTML: mockFn().mockReturnThis(),
    addTo: mockFn().mockReturnThis(),
    remove: mockFn().mockReturnThis(),
    on: mockFn().mockReturnThis(),
    off: mockFn().mockReturnThis()
  })),
  Marker: mockFn(() => ({
    setLngLat: mockFn().mockReturnThis(),
    addTo: mockFn().mockReturnThis(),
    remove: mockFn().mockReturnThis(),
    setPopup: mockFn().mockReturnThis(),
    getElement: mockFn(() => document.createElement('div'))
  })),
  NavigationControl: mockFn(() => ({
    onAdd: mockFn(),
    onRemove: mockFn()
  })),
  GeolocateControl: mockFn(() => ({
    onAdd: mockFn(),
    onRemove: mockFn()
  })),
  AttributionControl: mockFn(() => ({
    onAdd: mockFn(),
    onRemove: mockFn()
  })),
  ScaleControl: mockFn(() => ({
    onAdd: mockFn(),
    onRemove: mockFn()
  })),
  FullscreenControl: mockFn(() => ({
    onAdd: mockFn(),
    onRemove: mockFn()
  })),
};

module.exports = mockMap;