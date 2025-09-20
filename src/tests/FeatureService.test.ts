import { FeatureService } from '@/Services/FeatureService';
import type { Map, FeatureServiceOptions } from '@/types';

// Mock MapLibre/Mapbox GL Map with minimal interface
const createMockMap = (): Partial<Map> => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn().mockReturnValue({
    setTiles: jest.fn(),
    setUrl: jest.fn(),
    setData: jest.fn(),
    tiles: ['https://example.com/{z}/{x}/{y}.png'],
    _options: {},
  }),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getLayer: jest.fn(),
  setPaintProperty: jest.fn(),
  moveLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  fire: jest.fn(),
  getCanvas: jest.fn().mockReturnValue({ width: 800, height: 600 }),
  getBounds: jest.fn().mockReturnValue({
    toArray: () => [
      [-180, -90],
      [180, 90],
    ],
    getWest: () => -180,
    getSouth: () => -90,
    getEast: () => 180,
    getNorth: () => 90,
  }),
  project: jest.fn(),
  unproject: jest.fn(),
});

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('FeatureService', () => {
  let mockMap: Partial<Map>;

  const flush = () => new Promise(resolve => setTimeout(resolve, 0));
  const mockServiceOptions: FeatureServiceOptions = {
    url: 'https://example.com/arcgis/rest/services/TestService/FeatureServer/0',
    where: '1=1',
    outFields: '*',
    f: 'geojson',
  };

  beforeEach(() => {
    mockMap = createMockMap();
    jest.clearAllMocks();

    // Default successful metadata response
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        copyrightText: 'Test Attribution',
        name: 'Test Service',
        geometryType: 'esriGeometryPoint',
      }),
    } as unknown as Response);
  });

  describe('Constructor', () => {
    it('should create a FeatureService instance', () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      expect(service).toBeInstanceOf(FeatureService);
      expect(service.esriServiceOptions.url).toBe(
        'https://example.com/arcgis/rest/services/TestService/FeatureServer/0'
      );
    });

    it('should throw error when url is not provided', () => {
      const invalidOptions = { ...mockServiceOptions };
      delete (invalidOptions as Record<string, unknown>).url;

      expect(() => {
        new FeatureService('test-source', mockMap as Map, invalidOptions);
      }).toThrow('A url must be supplied as part of the esriServiceOptions object.');
    });

    it('should clean trailing slash from URL', () => {
      const optionsWithSlash = {
        ...mockServiceOptions,
        url: 'https://example.com/arcgis/rest/services/TestService/FeatureServer/0/',
      };

      const service = new FeatureService('test-source', mockMap as Map, optionsWithSlash);

      expect(service.esriServiceOptions.url).toBe(
        'https://example.com/arcgis/rest/services/TestService/FeatureServer/0'
      );
    });

    it('should set default options correctly', () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      expect(service.esriServiceOptions.useVectorTiles).toBe(true);
      expect(service.esriServiceOptions.useBoundingBox).toBe(true);
    });

    it('should allow disabling vector tiles', () => {
      const options = { ...mockServiceOptions, useVectorTiles: false };
      const service = new FeatureService('test-source', mockMap as Map, options);

      expect(service.esriServiceOptions.useVectorTiles).toBe(false);
    });

    it('should allow disabling bounding box filtering', () => {
      const options = { ...mockServiceOptions, useBoundingBox: false };
      const service = new FeatureService('test-source', mockMap as Map, options);

      expect(service.esriServiceOptions.useBoundingBox).toBe(false);
    });
  });

  describe('Vector Tile Support Detection', () => {
    it('should detect vector tile support when VectorTileServer endpoint exists', async () => {
      // Mock successful vector tile endpoint check
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              copyrightText: 'Test Attribution',
              name: 'Test Service',
              geometryType: 'esriGeometryPoint',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              name: 'Vector Tile Service',
              tiles: ['https://example.com/{z}/{y}/{x}.pbf'],
            }),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      expect(service).toBeInstanceOf(FeatureService);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/arcgis/rest/services/TestService/VectorTileServer/0?f=json',
        undefined
      );
    });

    it('should fallback to GeoJSON when vector tile endpoint fails', async () => {
      // Mock failed vector tile endpoint check
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              copyrightText: 'Test Attribution',
              name: 'Test Service',
              geometryType: 'esriGeometryPoint',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response);

      new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'geojson',
        })
      );
    });

    it('should handle non-FeatureServer URLs', async () => {
      const options = {
        ...mockServiceOptions,
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer/0',
      };

      new FeatureService('test-source', mockMap as Map, options);
      await flush();

      // Should still create source but not try vector tile detection
      expect(mockMap.addSource).toHaveBeenCalled();
    });
  });

  describe('Source Creation', () => {
    it('should create vector source when vector tiles are supported', async () => {
      // Mock vector tile support
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              copyrightText: 'Test Attribution',
              name: 'Test Service',
              geometryType: 'esriGeometryPoint',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'Vector Tile Service' }),
        } as Response);

      new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'vector',
          tiles: expect.arrayContaining([expect.stringContaining('.pbf')]),
        })
      );
    });

    it('should create GeoJSON source when vector tiles are not supported', async () => {
      // Mock vector tile failure
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              copyrightText: 'Test Attribution',
              name: 'Test Service',
              geometryType: 'esriGeometryPoint',
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
        } as Response);

      new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'geojson',
          data: expect.stringContaining('/query'),
        })
      );
    });

    it('should include bounding box in GeoJSON query when enabled', async () => {
      const options = { ...mockServiceOptions, useVectorTiles: false, useBoundingBox: true };

      // Mock metadata response first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          copyrightText: 'Test Attribution',
          name: 'Test Service',
          geometryType: 'esriGeometryPoint',
        }),
      } as unknown as Response);

      // Mock vector tile check failure (404) to force GeoJSON mode
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      new FeatureService('test-source', mockMap as Map, options);
      await flush();

      // Check the addSource call for GeoJSON data URL with bounding box geometry
      const addSourceCall = (mockMap.addSource as jest.Mock).mock.calls[0];
      expect(addSourceCall).toBeDefined();
      expect(addSourceCall[0]).toBe('test-source');

      const sourceConfig = addSourceCall[1];
      expect(sourceConfig.type).toBe('geojson');
      expect(sourceConfig.data).toContain('geometry=');
      expect(sourceConfig.data).toContain('geometryType=esriGeometryEnvelope');
    });
  });

  describe('Style Generation', () => {
    it('should generate point style for point geometry', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            copyrightText: 'Test Attribution',
            name: 'Test Service',
            geometryType: 'esriGeometryPoint',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      const style = await service.getStyle();
      expect(style.type).toBe('circle');
      expect(style.paint).toHaveProperty('circle-radius');
    });

    it('should generate line style for polyline geometry', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            copyrightText: 'Test Attribution',
            name: 'Test Service',
            geometryType: 'esriGeometryPolyline',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      const style = await service.getStyle();
      expect(style.type).toBe('line');
      expect(style.paint).toHaveProperty('line-color');
    });

    it('should generate fill style for polygon geometry', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            copyrightText: 'Test Attribution',
            name: 'Test Service',
            geometryType: 'esriGeometryPolygon',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      const style = await service.getStyle();
      expect(style.type).toBe('fill');
      expect(style.paint).toHaveProperty('fill-color');
    });

    it('should default to circle style for unknown geometry', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            copyrightText: 'Test Attribution',
            name: 'Test Service',
            geometryType: 'esriGeometryUnknown',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      const style = await service.getStyle();
      expect(style.type).toBe('circle');
    });
  });

  describe('Parameter Updates', () => {
    it('should set where clause', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      service.setWhere('STATE_NAME = "California"');
      await flush();

      expect(service.esriServiceOptions.where).toBe('STATE_NAME = "California"');
      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
      expect(mockMap.addSource).toHaveBeenCalled();
    });

    it('should set output fields as array', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      service.setOutFields(['STATE_NAME', 'POP2000']);
      await flush();

      expect(service.esriServiceOptions.outFields).toEqual(['STATE_NAME', 'POP2000']);
      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
      expect(mockMap.addSource).toHaveBeenCalled();
    });

    it('should set output fields as string', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      service.setOutFields('STATE_NAME,POP2000');
      await flush();

      expect(service.esriServiceOptions.outFields).toBe('STATE_NAME,POP2000');
    });

    it('should set layers', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      service.setLayers([0, 1]);
      await flush();

      expect(service.esriServiceOptions.layers).toEqual([0, 1]);
      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
      expect(mockMap.addSource).toHaveBeenCalled();
    });

    it('should set single layer', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      service.setLayers(5);
      await flush();

      expect(service.esriServiceOptions.layers).toBe(5);
    });

    it('should set geometry filter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      const geometry = { x: -95, y: 40 };
      service.setGeometry(geometry, 'esriGeometryPoint');

      expect(service.esriServiceOptions.geometry).toEqual(geometry);
      expect(service.esriServiceOptions.geometryType).toBe('esriGeometryPoint');
    });

    it('should clear geometry filter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      // First set geometry
      service.setGeometry({ x: -95, y: 40 }, 'esriGeometryPoint');

      // Then clear it
      service.clearGeometry();

      expect(service.esriServiceOptions.geometry).toBeUndefined();
      expect(service.esriServiceOptions.geometryType).toBeUndefined();
    });
  });

  describe('Bounding Box Filtering', () => {
    it('should enable bounding box updates for GeoJSON sources', async () => {
      const options = { ...mockServiceOptions, useVectorTiles: false };
      const service = new FeatureService('test-source', mockMap as Map, options);
      (mockMap.getSource as jest.Mock).mockReturnValue({ setData: jest.fn() });

      service.setBoundingBoxFilter(true);

      expect(mockMap.on).toHaveBeenCalledWith('moveend', expect.any(Function));
      expect(mockMap.on).toHaveBeenCalledWith('zoomend', expect.any(Function));
    });

    it('should disable bounding box updates', async () => {
      const options = { ...mockServiceOptions, useVectorTiles: false, useBoundingBox: true };
      const service = new FeatureService('test-source', mockMap as Map, options);
      await flush();

      // Clear previous mocks to check only the off calls
      (mockMap.off as jest.Mock).mockClear();

      service.setBoundingBoxFilter(false);

      expect(mockMap.off).toHaveBeenCalledWith('moveend', expect.any(Function));
      expect(mockMap.off).toHaveBeenCalledWith('zoomend', expect.any(Function));
    });

    it('should update data when updateData is called for GeoJSON sources', () => {
      const options = { ...mockServiceOptions, useVectorTiles: false, useBoundingBox: true };
      const mockSource = { setData: jest.fn() };
      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

      const service = new FeatureService('test-source', mockMap as Map, options);
      service.updateData();

      expect(mockSource.setData).toHaveBeenCalledWith(expect.stringContaining('/query'));
    });

    it('should warn when updateData is called for vector tile sources', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const options = { ...mockServiceOptions, useVectorTiles: true };

      const service = new FeatureService('test-source', mockMap as Map, options);
      service.updateData();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('only applicable for GeoJSON sources')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Feature Querying', () => {
    it('should query features with default options', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      const mockFeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-95, 40] },
            properties: { name: 'Test Feature' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFeatureCollection),
      } as Response);

      const result = await service.queryFeatures();

      expect(result).toEqual(mockFeatureCollection);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/query'), undefined);
    });

    it('should query features with custom options', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      const customOptions = { where: 'POP2000 > 100000', outFields: 'NAME,POP2000' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
      } as Response);

      await service.queryFeatures(customOptions);

      const fetchUrl = (mockFetch as jest.Mock).mock.calls[1][0];
      // URL encoding uses + for spaces in query parameters
      expect(fetchUrl).toContain('where=POP2000+%3E+100000');
      expect(fetchUrl).toContain('outFields=NAME%2CPOP2000');
    });

    it('should handle query errors', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.queryFeatures()).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors in queries', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.queryFeatures()).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('Error Handling', () => {
    it('should handle source creation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock metadata fetch failure (first call fails)
      mockFetch.mockRejectedValueOnce(new Error('Service metadata fetch failed'));

      // Constructor shouldn't throw, but error should be logged async
      expect(() => {
        new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      }).not.toThrow();

      // Wait for async source creation to complete and catch the error
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating FeatureService source:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle vector tile detection errors gracefully', async () => {
      // Mock successful metadata but failed vector tile check
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              copyrightText: 'Test Attribution',
              name: 'Test Service',
            }),
        } as Response)
        .mockRejectedValueOnce(new Error('Vector tile endpoint error'));

      new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      // Should still create a source (fallback to GeoJSON)
      expect(mockMap.addSource).toHaveBeenCalled();
    });
  });

  describe('Getters and Properties', () => {
    it('should provide service metadata getter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      expect(service.serviceMetadata).toEqual(
        expect.objectContaining({
          copyrightText: 'Test Attribution',
          name: 'Test Service',
        })
      );
    });

    it('should provide source getter', () => {
      const mockSource = { type: 'geojson' };
      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      expect(service._source).toBe(mockSource);
    });

    it('should provide URL getter', () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      const url = service._url;
      expect(url).toContain('/query');
      expect(url).toContain('where='); // Should contain some where clause
    });

    it('should provide default style', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await flush();

      const style = service.defaultStyle;
      expect(style).toHaveProperty('type');
      expect(style).toHaveProperty('source', 'test-source');
    });
  });

  describe('Cleanup', () => {
    it('should remove source', () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      (mockMap.getSource as jest.Mock).mockReturnValue({});

      service.remove();

      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });

    it('should remove event listeners on cleanup', async () => {
      const options = { ...mockServiceOptions, useVectorTiles: false, useBoundingBox: true };
      const service = new FeatureService('test-source', mockMap as Map, options);
      await flush(); // Wait for initialization

      // Clear previous mock calls to check only cleanup calls
      (mockMap.off as jest.Mock).mockClear();

      service.remove();

      expect(mockMap.off).toHaveBeenCalledWith('moveend', expect.any(Function));
      expect(mockMap.off).toHaveBeenCalledWith('zoomend', expect.any(Function));
    });

    it('should handle remove when source does not exist', () => {
      (mockMap.getSource as jest.Mock).mockReturnValue(null);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      expect(() => service.remove()).not.toThrow();
    });
  });
});
