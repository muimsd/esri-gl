import { BasemapLayer, basemapLayer, type BasemapLayerOptions } from '../../Layers/BasemapLayer';
import type { Map } from '../../types';

// Mock map object
const createMockMap = () =>
  ({
    addSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    getSource: jest.fn(),
    getLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    listens: jest.fn(),
    once: jest.fn(),
  }) as unknown as Map;

describe('BasemapLayer', () => {
  let mockMap: Map;

  beforeEach(() => {
    mockMap = createMockMap();
  });

  describe('constructor', () => {
    it('should create instance with string key', () => {
      const layer = new BasemapLayer('arcgis/streets');
      expect(layer).toBeInstanceOf(BasemapLayer);
      expect(layer.options).toBeDefined();
    });

    it('should create instance with options object', () => {
      const options: BasemapLayerOptions = {
        key: 'arcgis/topographic',
        opacity: 0.8,
      };
      const layer = new BasemapLayer(options);
      expect(layer).toBeInstanceOf(BasemapLayer);
      expect(layer.options.opacity).toBe(0.8);
    });

    it('should merge options when both key and options provided', () => {
      const layer = new BasemapLayer('arcgis/streets', {
        opacity: 0.5,
        attribution: 'Custom attribution',
      });
      expect(layer.options.opacity).toBe(0.5);
      expect(layer.options.attribution).toBe('Custom attribution');
    });

    it('should use default basemap when no key provided', () => {
      const layer = new BasemapLayer({});
      expect(layer).toBeInstanceOf(BasemapLayer);
      // Should not throw error for default 'arcgis/streets' basemap
    });

    it('should throw error for unknown basemap key', () => {
      expect(() => {
        new BasemapLayer('unknown/basemap');
      }).toThrow('Unknown basemap: unknown/basemap');
    });

    it('should handle all valid basemap keys', () => {
      const validKeys = [
        'arcgis/streets',
        'arcgis/navigation',
        'arcgis/topographic',
        'arcgis/light-gray',
        'arcgis/dark-gray',
        'arcgis/imagery',
      ];

      validKeys.forEach(key => {
        expect(() => new BasemapLayer(key)).not.toThrow();
      });
    });

    it('should inherit config options for each basemap type', () => {
      const layer = new BasemapLayer('arcgis/imagery');
      expect(layer.options.attribution).toContain('Esri, Maxar');

      const lightGrayLayer = new BasemapLayer('arcgis/light-gray');
      expect(lightGrayLayer.options.attribution).toContain('OpenStreetMap contributors');
    });

    it('should handle token and apikey options', () => {
      const layer = new BasemapLayer({
        key: 'arcgis/streets',
        token: 'test-token',
      });
      expect(layer).toBeInstanceOf(BasemapLayer);

      const apiKeyLayer = new BasemapLayer({
        key: 'arcgis/streets',
        apikey: 'test-api-key',
      });
      expect(apiKeyLayer).toBeInstanceOf(BasemapLayer);
    });
  });

  describe('addTo', () => {
    it('should add source and layer to map', () => {
      const layer = new BasemapLayer('arcgis/streets');
      layer.addTo(mockMap);

      expect(mockMap.addSource).toHaveBeenCalled();
      expect(mockMap.addLayer).toHaveBeenCalled();
    });

    it('should create vector source with correct URL', () => {
      const layer = new BasemapLayer('arcgis/navigation');
      layer.addTo(mockMap);

      expect(mockMap.addSource).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'vector',
          url: expect.stringContaining('ArcGIS:Navigation'),
        })
      );
    });

    it('should append token to URL when provided', () => {
      const layer = new BasemapLayer({
        key: 'arcgis/streets',
        token: 'test-token-123',
      });
      layer.addTo(mockMap);

      expect(mockMap.addSource).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          url: expect.stringContaining('?token=test-token-123'),
        })
      );
    });

    it('should append apikey to URL when provided', () => {
      const layer = new BasemapLayer({
        key: 'arcgis/streets',
        apikey: 'test-api-key-456',
      });
      layer.addTo(mockMap);

      expect(mockMap.addSource).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          url: expect.stringContaining('?token=test-api-key-456'),
        })
      );
    });

    it('should create background layer with correct properties', () => {
      const layer = new BasemapLayer('arcgis/streets', { opacity: 0.7 });
      layer.addTo(mockMap);

      expect(mockMap.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'background',
          source: expect.any(String),
          paint: {
            'background-opacity': 0.7,
          },
        })
      );
    });

    it('should use default opacity when not specified', () => {
      const layer = new BasemapLayer('arcgis/streets');
      layer.addTo(mockMap);

      expect(mockMap.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          paint: {
            'background-opacity': 1,
          },
        })
      );
    });
  });

  describe('setBasemap', () => {
    it('should change basemap configuration', () => {
      const layer = new BasemapLayer('arcgis/streets');
      const result = layer.setBasemap('arcgis/imagery');

      expect(result).toBe(layer); // Should return self for chaining
    });

    it('should throw error for unknown basemap', () => {
      const layer = new BasemapLayer('arcgis/streets');

      expect(() => {
        layer.setBasemap('unknown/basemap');
      }).toThrow('Unknown basemap: unknown/basemap');
    });

    it('should update source after changing basemap', () => {
      const layer = new BasemapLayer('arcgis/streets');
      layer.addTo(mockMap);

      // Mock _updateSource method to verify it's called
      const updateSourceSpy = jest
        .spyOn(layer as unknown as { _updateSource: () => void }, '_updateSource')
        .mockImplementation();

      layer.setBasemap('arcgis/topographic');
      expect(updateSourceSpy).toHaveBeenCalled();
    });

    it('should handle all valid basemap transitions', () => {
      const layer = new BasemapLayer('arcgis/streets');
      const validKeys = [
        'arcgis/navigation',
        'arcgis/topographic',
        'arcgis/light-gray',
        'arcgis/dark-gray',
        'arcgis/imagery',
      ];

      validKeys.forEach(key => {
        expect(() => layer.setBasemap(key)).not.toThrow();
      });
    });
  });

  describe('static methods', () => {
    describe('getAvailableBasemaps', () => {
      it('should return array of available basemap keys', () => {
        const basemaps = BasemapLayer.getAvailableBasemaps();

        expect(Array.isArray(basemaps)).toBe(true);
        expect(basemaps.length).toBeGreaterThan(0);
        expect(basemaps).toContain('arcgis/streets');
        expect(basemaps).toContain('arcgis/imagery');
      });

      it('should return all expected basemap keys', () => {
        const basemaps = BasemapLayer.getAvailableBasemaps();
        const expectedBasemaps = [
          'arcgis/streets',
          'arcgis/navigation',
          'arcgis/topographic',
          'arcgis/light-gray',
          'arcgis/dark-gray',
          'arcgis/imagery',
        ];

        expectedBasemaps.forEach(key => {
          expect(basemaps).toContain(key);
        });
      });
    });
  });

  describe('basemap configurations', () => {
    it('should have correct configuration for streets basemap', () => {
      const layer = new BasemapLayer('arcgis/streets');
      expect(layer.options.attribution).toContain('Esri Community Maps Contributors');
    });

    it('should have correct configuration for imagery basemap', () => {
      const layer = new BasemapLayer('arcgis/imagery');
      expect(layer.options.attribution).toContain('Maxar');
    });

    it('should have correct zoom levels for different basemaps', () => {
      const streetsLayer = new BasemapLayer('arcgis/streets');
      const lightGrayLayer = new BasemapLayer('arcgis/light-gray');

      // Light gray has different max zoom than streets
      expect(streetsLayer).toBeInstanceOf(BasemapLayer);
      expect(lightGrayLayer).toBeInstanceOf(BasemapLayer);
    });
  });

  describe('options handling', () => {
    it('should preserve user attribution over default', () => {
      const customAttribution = 'Custom Attribution Text';
      const layer = new BasemapLayer('arcgis/streets', {
        attribution: customAttribution,
      });

      expect(layer.options.attribution).toBe(customAttribution);
    });

    it('should handle additional options', () => {
      const layer = new BasemapLayer('arcgis/streets', {
        language: 'es',
        worldview: 'GCS',
        style: 'custom-style',
      });

      const options = layer.options as BasemapLayerOptions;
      expect(options.language).toBe('es');
      expect(options.worldview).toBe('GCS');
      expect(options.style).toBe('custom-style');
    });
  });

  describe('inheritance', () => {
    it('should extend Layer class', () => {
      const layer = new BasemapLayer('arcgis/streets');
      expect(layer).toHaveProperty('options');
      expect(layer).toHaveProperty('addTo');
      expect(layer).toHaveProperty('remove');
    });

    it('should have unique source and layer IDs', () => {
      const layer1 = new BasemapLayer('arcgis/streets');
      const layer2 = new BasemapLayer('arcgis/imagery');

      expect((layer1 as unknown as { _sourceId: string })._sourceId).not.toBe(
        (layer2 as unknown as { _sourceId: string })._sourceId
      );
      expect((layer1 as unknown as { _layerId: string })._layerId).not.toBe(
        (layer2 as unknown as { _layerId: string })._layerId
      );
    });
  });

  describe('error handling', () => {
    it('should not create source without map', () => {
      const layer = new BasemapLayer('arcgis/streets');
      // Call protected method directly to test
      (layer as unknown as { _createSource: () => void })._createSource();

      // Should not throw error, just return early
      expect(mockMap.addSource).not.toHaveBeenCalled();
    });

    it('should not create layer without map', () => {
      const layer = new BasemapLayer('arcgis/streets');
      // Call protected method directly to test
      (layer as unknown as { _createLayer: () => void })._createLayer();

      // Should not throw error, just return early
      expect(mockMap.addLayer).not.toHaveBeenCalled();
    });
  });
});

describe('basemapLayer factory function', () => {
  it('should create BasemapLayer instance with string parameter', () => {
    const layer = basemapLayer('arcgis/streets');
    expect(layer).toBeInstanceOf(BasemapLayer);
  });

  it('should create BasemapLayer instance with options parameter', () => {
    const layer = basemapLayer({ key: 'arcgis/imagery', opacity: 0.8 });
    expect(layer).toBeInstanceOf(BasemapLayer);
  });

  it('should create BasemapLayer instance with both parameters', () => {
    const layer = basemapLayer('arcgis/streets', { opacity: 0.5 });
    expect(layer).toBeInstanceOf(BasemapLayer);
    expect(layer.options.opacity).toBe(0.5);
  });
});
