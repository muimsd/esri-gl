// Mock implementation of react-map-gl

const mockUseMap = jest.fn(() => ({
  current: {
    getMap: () => ({
      addSource: jest.fn(),
      removeSource: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      getSource: jest.fn(() => ({
        setTiles: jest.fn(),
        setUrl: jest.fn()
      })),
      getLayer: jest.fn(),
      setLayoutProperty: jest.fn(),
      setPaintProperty: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      getCanvas: jest.fn(() => document.createElement('canvas')),
      getBounds: jest.fn(() => ({
        toArray: () => [[-180, -85], [180, 85]],
        getNorth: () => 85,
        getSouth: () => -85,
        getEast: () => 180,
        getWest: () => -180
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
      getContainer: jest.fn(() => document.createElement('div'))
    })
  }
}));

module.exports = {
  useMap: mockUseMap,
  Map: jest.fn(({ children }) => children),
  Source: jest.fn(({ children }) => children),
  Layer: jest.fn(() => null),
  Marker: jest.fn(() => null),
  Popup: jest.fn(() => null),
  NavigationControl: jest.fn(() => null),
  GeolocateControl: jest.fn(() => null),
  AttributionControl: jest.fn(() => null),
  ScaleControl: jest.fn(() => null),
  FullscreenControl: jest.fn(() => null)
};
