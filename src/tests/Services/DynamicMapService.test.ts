import { DynamicMapService } from '@/Services/DynamicMapService';
import type { Map } from '@/types';

// Mock MapLibre/Mapbox GL Map with minimal interface
const createMockMap = (): Partial<Map> => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn().mockReturnValue({
    setTiles: jest.fn(),
    setUrl: jest.fn(),
    tiles: ['https://example.com/{z}/{x}/{y}.png'],
    _options: {},
  }),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  getCanvas: jest.fn().mockReturnValue({ width: 800, height: 600 }),
  getBounds: jest.fn().mockReturnValue({
    toArray: () => [
      [-180, -90],
      [180, 90],
    ],
  }),
  project: jest.fn(),
  unproject: jest.fn(),
});

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('DynamicMapService', () => {
  let mockMap: Partial<Map>;
  let service: DynamicMapService;

  beforeEach(() => {
    mockMap = createMockMap();
    jest.clearAllMocks();

    // Default successful metadata response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          serviceDescription: 'Test Dynamic Service',
          copyrightText: 'Test Copyright',
          layers: [
            { id: 0, name: 'Layer 0', minScale: 0, maxScale: 0 },
            { id: 1, name: 'Layer 1', minScale: 0, maxScale: 0 },
          ],
          spatialReference: { wkid: 3857 },
        }),
    } as Response);
  });

  describe('Constructor', () => {
    it('should create service with basic options', () => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'raster',
          tiles: expect.arrayContaining([expect.stringContaining('export')]),
          tileSize: 256,
        })
      );
    });

    it('should handle custom layers option', () => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        layers: [0, 1],
      });

      const addSourceCall = (mockMap.addSource as jest.Mock).mock.calls[0];
      const sourceOptions = addSourceCall[1];

      expect(sourceOptions.tiles[0]).toContain('layers=show%3A0%2C1');
    });

    it('should handle layer definitions', () => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        layerDefs: { '0': 'POPULATION > 100000' },
      });

      const addSourceCall = (mockMap.addSource as jest.Mock).mock.calls[0];
      const sourceOptions = addSourceCall[1];

      expect(sourceOptions.tiles[0]).toContain('layerDefs=');
    });

    it('should fetch service metadata when getAttributionFromService is true', async () => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        getAttributionFromService: true,
      });

      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/MapServer?f=json'),
        expect.any(Object)
      );
    });

    it('should throw error when URL is missing', () => {
      expect(() => {
        new DynamicMapService('test-source', mockMap as Map, { url: '' });
      }).toThrow('A url must be supplied as part of the esriServiceOptions object.');
    });
  });

  describe('Identify', () => {
    beforeEach(() => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                layerId: 0,
                layerName: 'Test Layer',
                attributes: { OBJECTID: 1, NAME: 'Test Feature' },
                geometry: { x: -122.4194, y: 37.7749 },
              },
            ],
          }),
      } as Response);
    });

    it('should identify features at point', async () => {
      const results = await service.identify({ lng: -122.4194, lat: 37.7749 });

      // Check that the identify call was made (should be the last/second call)
      const identifyCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const identifyUrl = identifyCall[0] as string;

      expect(identifyUrl).toContain('/identify?');

      expect(results).toEqual({
        results: expect.arrayContaining([
          expect.objectContaining({
            layerId: 0,
            layerName: 'Test Layer',
            attributes: { OBJECTID: 1, NAME: 'Test Feature' },
          }),
        ]),
      });
    });

    it('should handle identify with returnGeometry=true', async () => {
      await service.identify({ lng: -122.4194, lat: 37.7749 }, true);

      // Check the identify call (should be the last/second call)
      const identifyCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const url = identifyCall[0] as string;

      expect(url).toContain('returnGeometry=true');
    });

    it('should handle identify errors', async () => {
      mockFetch.mockRejectedValue(new Error('Service error'));

      await expect(service.identify({ lng: 0, lat: 0 })).rejects.toThrow('Service error');
    });
  });

  describe('Time Support', () => {
    it('should handle time options in constructor', () => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        from: new Date('2020-01-01'),
        to: new Date('2020-12-31'),
      });

      expect(mockMap.addSource).toHaveBeenCalled();
    });
  });

  describe('Options Getter', () => {
    it('should return merged options with defaults', () => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        layers: [1, 2],
      });

      const options = service.options;

      expect(options).toEqual(
        expect.objectContaining({
          url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
          layers: [1, 2],
          format: 'png24',
          dpi: 96,
          transparent: true,
          getAttributionFromService: true,
        })
      );
    });
  });

  describe('Update and Remove', () => {
    beforeEach(() => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });
    });

    it('should update source', async () => {
      service.update();
      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      // Update calls internal _updateSource which uses getSource
      expect(mockMap.getSource).toHaveBeenCalledWith('test-source');
    });

    it('should handle update when source supports setTiles (modern MapboxGL)', async () => {
      const mockSource = {
        tiles: ['old-tile-url'],
        setTiles: jest.fn(),
        _options: {},
      };

      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);
      service.update();
      
      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockSource.setTiles).toHaveBeenCalled();
      expect(mockSource.tiles[0]).toContain('export');
    });

    it('should handle update when using legacy sourceCaches (old MapboxGL/MaplibreGL)', async () => {
      const mockSource = {
        tiles: ['old-tile-url'],
        _options: {},
      }; // No setTiles method

      const mockSourceCache = {
        clearTiles: jest.fn(),
        update: jest.fn(),
      };

      // Mock the map style for legacy update path
      (mockMap as any).style = {
        sourceCaches: {
          'test-source': mockSourceCache,
        },
      };

      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);
      service.update();
      
      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockSourceCache.clearTiles).toHaveBeenCalled();
      expect(mockSourceCache.update).toHaveBeenCalledWith((mockMap as any).transform);
    });

    it('should handle update when using _otherSourceCaches fallback', async () => {
      const mockSource = {
        tiles: ['old-tile-url'],
        _options: {},
      }; // No setTiles method

      const mockSourceCache = {
        clearTiles: jest.fn(),
        update: jest.fn(),
      };

      // Mock the map style for _otherSourceCaches fallback
      (mockMap as any).style = {
        _otherSourceCaches: {
          'test-source': mockSourceCache,
        },
        sourceCaches: {
          'test-source': mockSourceCache,
        },
      };

      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);
      service.update();
      
      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockSourceCache.clearTiles).toHaveBeenCalled();
      expect(mockSourceCache.update).toHaveBeenCalledWith((mockMap as any).transform);
    });

    it('should remove source', () => {
      service.remove();
      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });
  });

  describe('Layer and Time Configuration', () => {
    beforeEach(() => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });
    });

    it('should set layer definitions and update source', async () => {
      const mockSource = {
        tiles: ['old-tile-url'],
        setTiles: jest.fn(),
        _options: {},
      };

      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

      service.setLayerDefs({ '0': 'POPULATION > 100000', '1': 'STATE_NAME = "California"' });
      
      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(service.esriServiceOptions.layerDefs).toEqual({
        '0': 'POPULATION > 100000',
        '1': 'STATE_NAME = "California"',
      });
      expect(mockSource.setTiles).toHaveBeenCalled();
    });

    it('should set layers and update source', async () => {
      const mockSource = {
        tiles: ['old-tile-url'],
        setTiles: jest.fn(),
        _options: {},
      };

      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

      service.setLayers([0, 1, 2]);
      
      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(service.esriServiceOptions.layers).toEqual([0, 1, 2]);
      expect(mockSource.setTiles).toHaveBeenCalled();
    });

    it('should set date range and update source', async () => {
      const mockSource = {
        tiles: ['old-tile-url'],
        setTiles: jest.fn(),
        _options: {},
      };

      (mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

      const from = new Date('2020-01-01');
      const to = new Date('2020-12-31');
      service.setDate(from, to);
      
      // Wait for async update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(service.esriServiceOptions.from).toEqual(from);
      expect(service.esriServiceOptions.to).toEqual(to);
      expect(mockSource.setTiles).toHaveBeenCalled();
    });
  });

  describe('Attribution Management', () => {
    beforeEach(() => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        getAttributionFromService: false, // Prevent automatic attribution fetching
      });
    });

    it('should set attribution when metadata is already available', async () => {
      // Mock the updateAttribution function
      const updateAttribution = jest.fn();
      const originalModule = await import('@/utils');
      jest.spyOn(originalModule, 'updateAttribution').mockImplementation(updateAttribution);

      // Simulate metadata being loaded
      (service as any)._serviceMetadata = {
        copyrightText: 'Test Attribution',
      };

      await service.setAttributionFromService();

      expect(updateAttribution).toHaveBeenCalledWith('Test Attribution', 'test-source', mockMap);
    });

    it('should fetch metadata first if not available when setting attribution', async () => {
      // Mock successful metadata response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            serviceDescription: 'Test Service',
            copyrightText: 'Fetched Attribution',
            layers: [],
          }),
      } as Response);

      const updateAttribution = jest.fn();
      const originalModule = await import('@/utils');
      jest.spyOn(originalModule, 'updateAttribution').mockImplementation(updateAttribution);

      await service.setAttributionFromService();

      expect(updateAttribution).toHaveBeenCalledWith('Fetched Attribution', 'test-source', mockMap);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset mocks before each error handling test
      jest.clearAllMocks();
    });

    it('should handle network errors during metadata fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Create service without getAttributionFromService to avoid async issues
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        getAttributionFromService: false,
      });

      // Service should still be created even if metadata fetch fails
      expect(service).toBeDefined();

      // Verify that the metadata fetch would fail if called directly
      try {
        await service.getMetadata();
        fail('Expected metadata fetch to reject');
      } catch (error) {
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle invalid response during metadata fetch', async () => {
      // Reset the mock from the previous test
      jest.clearAllMocks();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Service not found' }),
      } as Response);

      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        getAttributionFromService: true,
      });

      // Service should still be created even if metadata fetch fails
      expect(service).toBeDefined();
    });
  });
});
