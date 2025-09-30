// Mock implementation of react-map-gl// Mock implementation of react-map-gl// Mock implementation of react-map-gl// Mock react-map-gl

module.exports = {

  useMap: () => ({module.exports = {

    current: {

      getMap: () => ({  useMap: () => ({module.exports = {const jest = require('jest-mock');

        addSource: () => {},

        removeSource: () => {},    current: {

        addLayer: () => {},

        removeLayer: () => {},      getMap: () => ({  useMap: () => ({const mockUseMap = jest.fn(() => ({

        getSource: () => ({

          setTiles: () => {},        addSource: () => {},

          setUrl: () => {}

        }),        removeSource: () => {},    current: {  current: {

        getLayer: () => null,

        setLayoutProperty: () => {},        addLayer: () => {},

        setPaintProperty: () => {},

        on: () => {},        removeLayer: () => {},      getMap: () => ({    addSource: jest.fn(),

        off: () => {},

        getCanvas: () => document.createElement('canvas'),        getSource: () => ({

        getBounds: () => ({

          toArray: () => [[-180, -85], [180, 85]],          setTiles: () => {},        addSource: () => {},    removeSource: jest.fn(),

          getNorth: () => 85,

          getSouth: () => -85,          setUrl: () => {}

          getEast: () => 180,

          getWest: () => -180        }),        removeSource: () => {},    addLayer: jest.fn(),

        }),

        getZoom: () => 10,        getLayer: () => null,

        getCenter: () => ({ lng: 0, lat: 0 }),

        queryRenderedFeatures: () => [],        setLayoutProperty: () => {},        addLayer: () => {},    removeLayer: jest.fn(),

        project: () => ({ x: 100, y: 100 }),

        unproject: () => ({ lng: 0, lat: 0 }),        setPaintProperty: () => {},

        getBearing: () => 0,

        getPitch: () => 0,        on: () => {},        removeLayer: () => {},    getSource: jest.fn(() => ({

        remove: () => {},

        resize: () => {},        off: () => {},

        redraw: () => {},

        triggerRepaint: () => {},        getCanvas: () => document.createElement('canvas'),        getSource: () => ({      setTiles: jest.fn(),

        getContainer: () => document.createElement('div')

      })        getBounds: () => ({

    }

  }),          toArray: () => [[-180, -85], [180, 85]],          setTiles: () => {},      setUrl: jest.fn()

  Map: function MockMap() {

    return null;          getNorth: () => 85,

  }

};          getSouth: () => -85,          setUrl: () => {}    })),

          getEast: () => 180,

          getWest: () => -180        }),    getLayer: jest.fn(),

        }),

        getZoom: () => 10,        getLayer: () => null,    setLayoutProperty: jest.fn(),

        getCenter: () => ({ lng: 0, lat: 0 }),

        queryRenderedFeatures: () => [],        setLayoutProperty: () => {},    setPaintProperty: jest.fn(),

        project: () => ({ x: 100, y: 100 }),

        unproject: () => ({ lng: 0, lat: 0 }),        setPaintProperty: () => {},    on: jest.fn(),

        getBearing: () => 0,

        getPitch: () => 0,        on: () => {},    off: jest.fn(),

        remove: () => {},

        resize: () => {},        off: () => {},    getCanvas: jest.fn(() => document.createElement('canvas')),

        redraw: () => {},

        triggerRepaint: () => {},        getCanvas: () => document.createElement('canvas'),    getBounds: jest.fn(() => ({

        getContainer: () => document.createElement('div')

      })        getBounds: () => ({      toArray: () => [[-180, -85], [180, 85]]

    }

  }),          toArray: () => [[-180, -85], [180, 85]],    })),

  Map: function MockMap(props) {

    return null;          getNorth: () => 85,    getZoom: jest.fn(() => 10),

  }

};          getSouth: () => -85,    getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),

          getEast: () => 180,    queryRenderedFeatures: jest.fn(() => []),

          getWest: () => -180    project: jest.fn(() => ({ x: 100, y: 100 })),

        }),    unproject: jest.fn(() => ({ lng: 0, lat: 0 })),

        getZoom: () => 10,    getBearing: jest.fn(() => 0),

        getCenter: () => ({ lng: 0, lat: 0 }),    getPitch: jest.fn(() => 0),

        queryRenderedFeatures: () => [],    remove: jest.fn(),

        project: () => ({ x: 100, y: 100 }),    resize: jest.fn(),

        unproject: () => ({ lng: 0, lat: 0 }),    redraw: jest.fn(),

        getBearing: () => 0,    triggerRepaint: jest.fn(),

        getPitch: () => 0,    _update: jest.fn(),

        remove: () => {},    _render: jest.fn(),

        resize: () => {},    loaded: jest.fn(() => true),

        redraw: () => {},    isStyleLoaded: jest.fn(() => true),

        triggerRepaint: () => {},    areTilesLoaded: jest.fn(() => true),

        getContainer: () => document.createElement('div')    getStyle: jest.fn(),

      })    setStyle: jest.fn()

    }  }

  }),}));

  Map: function MockMap(props) {

    return null;module.exports = {

  }  useMap: mockUseMap,

};  Map: jest.fn(({ children }) => children),
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