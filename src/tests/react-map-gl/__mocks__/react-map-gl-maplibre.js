// Mock react-map-gl/maplibre - same interface as react-map-gl
/* global jest */
const mockUseMap = jest.fn(() => ({
  current: {
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
      toArray: () => [[-180, -85], [180, 85]]
    })),
    getMap: jest.fn(() => ({
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      addSource: jest.fn(),
      removeSource: jest.fn(),
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
        toArray: () => [[-180, -85], [180, 85]]
      })),
      project: jest.fn(() => ({ x: 100, y: 100 })),
      unproject: jest.fn(() => ({ lng: -95, lat: 37 })),
      queryRenderedFeatures: jest.fn(() => []),
      identify: jest.fn(),
      getZoom: jest.fn(() => 10),
      getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),
      getBearing: jest.fn(() => 0),
      getPitch: jest.fn(() => 0),
      triggerRepaint: jest.fn(),
      isStyleLoaded: jest.fn(() => true)
    }))
  }
}));

module.exports = {
  useMap: mockUseMap,
  Map: jest.fn(),
  Source: jest.fn(),
  Layer: jest.fn()
};