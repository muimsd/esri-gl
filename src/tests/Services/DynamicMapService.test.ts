import { DynamicMapService } from '@/Services/DynamicMapService';
import type { Map, LayerLabelingInfo } from '@/types';

// Mock MapLibre/Mapbox GL Map with minimal interface
const createMockMap = (): Partial<Map> => {
  const sources: Record<string, any> = {};
  const sourceCaches: Record<string, any> = {};
  const mockMap: any = {
    addSource: jest.fn((id: string, source: any) => {
      sources[id] = source;
      // Also add to sourceCaches for legacy update path
      sourceCaches[id] = {
        clearTiles: jest.fn(),
        update: jest.fn(),
      };
      return mockMap;
    }),
    removeSource: jest.fn((id: string) => {
      delete sources[id];
      delete sourceCaches[id];
      return mockMap;
    }),
    getSource: jest.fn((id: string) => sources[id]),
    getStyle: jest.fn().mockReturnValue({ layers: [] }),
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
      getWest: () => -180,
      getSouth: () => -90,
      getEast: () => 180,
      getNorth: () => 90,
    }),
    getContainer: jest.fn().mockReturnValue({
      getBoundingClientRect: () => ({ width: 800, height: 600 }),
    }),
    project: jest.fn(),
    unproject: jest.fn(),
    // Mock style.sourceCaches for legacy update path
    style: {
      sourceCaches,
    },
    transform: {}, // Mock transform object for update() calls
  };
  return mockMap;
};

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

  describe('Dynamic Layers and Filters', () => {
    class StubMap {
      style: any = { sourceCaches: {}, _otherSourceCaches: {} };
      transform: any = {};
      sources: Record<string, any> = {};

      addSource(id: string, source: any) {
        this.sources[id] = { ...source };
        this.style.sourceCaches[id] = {
          clearTiles: jest.fn(),
          update: jest.fn(),
        };
      }

      getSource(id: string) {
        return this.sources[id];
      }

      removeSource(id: string) {
        delete this.sources[id];
      }
    }

    const waitForUpdate = () => new Promise(resolve => setTimeout(resolve, 50));

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    it('appends dynamicLayers param when set', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      });

      const initialSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      expect(initialSource.tiles[0]).not.toContain('dynamicLayers=');

      svc.setDynamicLayers([
        { id: 3, visible: true, drawingInfo: { renderer: { type: 'simple' } } },
      ]);
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      expect(updatedSource.tiles[0]).toContain('dynamicLayers=');
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain('"id":3');
      expect(encoded).toContain('"renderer"');
    });

    it('builds and applies comparison filter', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      });

      svc.setLayerFilter(2, { field: 'STATE_NAME', op: '=', value: 'California' });
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain('"id":2');
      expect(encoded).toContain("STATE_NAME+=+'California'");
      expect(encoded).toContain('"source":{"type":"mapLayer","mapLayerId":2}');
    });

    it('builds IN filter correctly', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      });

      svc.setLayerFilter(1, { field: 'STATE_ABBR', op: 'IN', values: ['CA', 'OR', 'WA'] });
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain("STATE_ABBR+IN+('CA',+'OR',+'WA')");
    });

    it('builds BETWEEN filter correctly', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      });

      svc.setLayerFilter(3, { field: 'POP2000', op: 'BETWEEN', from: 1_000_000, to: 5_000_000 });
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain('POP2000+BETWEEN+1000000+AND+5000000');
    });

    it('builds grouped AND filter correctly', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      });

      svc.setLayerFilter(2, {
        op: 'AND',
        filters: [
          { field: 'POP2000', op: '>', value: 1_000_000 },
          { field: 'SUB_REGION', op: '=', value: 'Pacific' },
        ],
      });
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain("(POP2000+>+1000000+AND+SUB_REGION+=+'Pacific')");
    });

    it('maps visible to visibility and adds default source', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      });

      svc.setDynamicLayers([{ id: 5, visible: false }]);
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain('"visibility":false');
      expect(encoded).not.toContain('"visible"');
      expect(encoded).toContain('"source":{"type":"mapLayer","mapLayerId":5}');
    });

    it('preserves visible layers when applying renderer to a single layer', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
        layers: [0, 1, 2],
      });

      svc.setLayerRenderer(2, {
        type: 'simple',
        symbol: { type: 'esriSFS', color: [0, 122, 255, 90] },
      });
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain('"id":2');
      expect(encoded).toContain('"symbol":{"type":"esriSFS","color":[0,122,255,90]}');
      expect(encoded).toContain('"id":0');
      expect(encoded).toContain('"id":1');
    });

    it('preserves visible layers when applying filter to a single layer', async () => {
      const map = new StubMap() as unknown as Map;
      const svc = new DynamicMapService('dyn-src', map, {
        url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
        layers: [1, 2, 3],
      });

      svc.setLayerFilter(2, {
        field: 'STATE_NAME',
        op: '=',
        value: 'California',
      });
      await waitForUpdate();

      const updatedSource = (map as any).getSource('dyn-src') as { tiles: string[] };
      const encoded = decodeURIComponent(updatedSource.tiles[0]);
      expect(encoded).toContain('"id":2');
      expect(encoded).toContain("STATE_NAME+=+'California'");
      expect(encoded).toContain('"id":1');
      expect(encoded).toContain('"id":3');
    });
  });

  describe('Layer Labeling', () => {
    let labelingMap: Partial<Map>;

    beforeEach(() => {
      labelingMap = createMockMap();
      service = new DynamicMapService('test-source', labelingMap as Map, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: [0, 1, 2],
        getAttributionFromService: false,
      });
    });

    it('should apply labeling configuration correctly', () => {
      const labelConfig: LayerLabelingInfo = {
        labelExpression: '[state_name]',
        symbol: {
          type: 'esriTS',
          color: [255, 255, 255, 255],
          backgroundColor: [0, 0, 0, 128],
          font: {
            family: 'Arial',
            size: 12,
            weight: 'bold',
          },
        },
        minScale: 0,
        maxScale: 25_000_000,
      };

      service.setLayerLabels(2, labelConfig);

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      expect(Array.isArray(dynamicLayers)).toBe(true);

      const labeledLayer = dynamicLayers.find(l => l.id === 2);
      expect(labeledLayer).toBeDefined();
      expect(labeledLayer?.drawingInfo.labelingInfo).toEqual([labelConfig]);
      expect(dynamicLayers.map(l => l.id).sort()).toEqual([0, 1, 2]);
    });

    it('should use correct field names in label expressions', () => {
      service.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] },
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const labeledLayer = dynamicLayers.find(l => l.id === 2);
      expect(labeledLayer?.drawingInfo.labelingInfo?.[0].labelExpression).toBe('[state_name]');
    });

    it('should generate correct URL with dynamicLayers parameter', () => {
      service.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] },
      });

      const tileUrl = service._source.tiles[0];
      expect(tileUrl).toContain('dynamicLayers=');
      expect(tileUrl).toContain(encodeURIComponent('[state_name]'));
    });

    it('should preserve existing layer configurations when adding labels', () => {
      service.setLayerRenderer(2, {
        type: 'simple',
        symbol: {
          type: 'esriSFS',
          color: [255, 0, 0, 128],
        },
      });

      service.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] },
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 2);
      expect(layer?.drawingInfo.renderer).toBeDefined();
      expect(layer?.drawingInfo.labelingInfo).toBeDefined();
    });

    it('should disable labels by removing labelingInfo', () => {
      service.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] },
      });

      service.setLayerLabelsVisible(2, false);

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 2);
      expect(layer?.drawingInfo.labelingInfo).toBeUndefined();
    });

    it('should enable default labels when none exist', () => {
      service.setLayerLabelsVisible(2, true);

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 2);
      expect(layer?.drawingInfo.labelingInfo).toBeDefined();
      expect(layer?.drawingInfo.labelingInfo).toHaveLength(1);
    });

    it('should apply state abbreviation labels correctly', () => {
      service.setLayerLabels(0, {
        labelExpression: '[state_abbr]',
        symbol: {
          type: 'esriTS',
          color: [0, 0, 0, 255],
          backgroundColor: [255, 255, 255, 180],
          font: {
            family: 'Arial',
            size: 12,
            weight: 'bold',
          },
        },
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 0);
      expect(layer?.drawingInfo.labelingInfo?.[0].labelExpression).toBe('[state_abbr]');
    });

    it('should apply population labels correctly', () => {
      service.setLayerLabels(0, {
        labelExpression: '[pop2000]',
        symbol: {
          type: 'esriTS',
          color: [0, 255, 0, 255],
          backgroundColor: [0, 0, 0, 140],
          font: {
            family: 'Arial',
            size: 9,
            weight: 'bold',
          },
        },
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 0);
      expect(layer?.drawingInfo.labelingInfo?.[0].labelExpression).toBe('[pop2000]');
    });

    it('should apply sub-region labels correctly', () => {
      service.setLayerLabels(0, {
        labelExpression: '[sub_region]',
        symbol: {
          type: 'esriTS',
          color: [255, 255, 0, 255],
          backgroundColor: [0, 0, 0, 160],
          font: {
            family: 'Arial',
            size: 8,
            weight: 'bold',
          },
        },
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 0);
      expect(layer?.drawingInfo.labelingInfo?.[0].labelExpression).toBe('[sub_region]');
    });

    it('should apply city labels correctly', () => {
      service.setLayerLabels(0, {
        labelExpression: '[areaname]',
        symbol: {
          type: 'esriTS',
          color: [255, 255, 255, 255],
          backgroundColor: [255, 140, 0, 160],
          font: {
            family: 'Arial',
            size: 11,
            weight: 'bold',
          },
        },
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 0);
      expect(layer?.drawingInfo.labelingInfo?.[0].labelExpression).toBe('[areaname]');
    });

    it('should apply highway labels correctly', () => {
      service.setLayerLabels(1, {
        labelExpression: '[route]',
        symbol: {
          type: 'esriTS',
          color: [255, 255, 255, 255],
          backgroundColor: [34, 139, 34, 160],
          font: {
            family: 'Arial',
            size: 10,
            weight: 'bold',
          },
        },
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 1);
      expect(layer?.drawingInfo.labelingInfo?.[0].labelExpression).toBe('[route]');
    });
  });

  describe('Advanced Operations', () => {
    beforeEach(() => {
      service = new DynamicMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });
    });

    describe('Time-Aware Management', () => {
      it('should set layer time options', () => {
        const timeOptions = {
          useTime: true,
          timeExtent: [Date.now() - 86_400_000, Date.now()] as [number, number],
          timeOffset: 0,
          timeOffsetUnits: 'esriTimeUnitsHours' as const,
        };

        service.setLayerTimeOptions(2, timeOptions);

        const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
        const layer = dynamicLayers.find(l => l.id === 2);
        expect(layer?.layerTimeOptions).toEqual(timeOptions);
      });

      it('should accept animateTime inputs', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 86_400_000);

        service.animateTime({
          from: yesterday,
          to: now,
          intervalMs: 5000,
          loop: false,
        });

        expect(true).toBe(true);
      });
    });

    describe('Layer Statistics', () => {
      it('should query layer statistics', async () => {
        const mockResponse = {
          features: [
            {
              attributes: {
                total_count: 50,
                sum_population: 1_000_000,
                avg_population: 20_000,
              },
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const stats = [
          {
            statisticType: 'count' as const,
            onStatisticField: 'OBJECTID',
            outStatisticFieldName: 'total_count',
          },
        ];

        const result = await service.getLayerStatistics(1, stats);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/1/query?f=json&where=1%3D1&outStatistics=')
        );
        expect(result).toEqual(mockResponse.features);
      });

      it('should handle statistics query with grouping', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ features: [] }),
        } as Response);

        await service.getLayerStatistics(
          1,
          [
            {
              statisticType: 'count',
              onStatisticField: 'OBJECTID',
              outStatisticFieldName: 'count',
            },
          ],
          {
            where: 'STATE = "California"',
            groupByFieldsForStatistics: 'COUNTY',
          }
        );

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/where=STATE.*California.*groupByFieldsForStatistics=COUNTY/)
        );
      });
    });

    describe('Feature Queries', () => {
      it('should query layer features', async () => {
        const mockResponse = {
          features: [
            {
              attributes: { NAME: 'Test Feature', ID: 1 },
              geometry: { type: 'Point', coordinates: [-100, 40] },
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const result = await service.queryLayerFeatures(2, {
          where: 'ID > 0',
          outFields: ['NAME', 'ID'],
          returnGeometry: true,
        });

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/2/query?f=json&where=ID'));
        expect(result).toEqual(mockResponse);
      });

      it('should handle spatial queries', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ features: [] }),
        } as Response);

        await service.queryLayerFeatures(1, {
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-100, 30],
                [-80, 30],
                [-80, 50],
                [-100, 50],
                [-100, 30],
              ],
            ],
          },
          geometryType: 'esriGeometryPolygon',
          spatialRel: 'esriSpatialRelContains',
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(
            /geometry=.*geometryType=esriGeometryPolygon.*spatialRel=esriSpatialRelContains/
          )
        );
      });
    });

    describe('Map Export', () => {
      it('should export map image', async () => {
        const mockBlob = new Blob(['test image data'], { type: 'image/png' });
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
        } as Response);

        const exportOptions = {
          bbox: [-100, 30, -80, 50] as [number, number, number, number],
          size: [800, 600] as [number, number],
          format: 'png' as const,
          dpi: 150,
          transparent: true,
        };

        const result = await service.exportMapImage(exportOptions);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(
            '/export?f=image&bbox=-100%2C30%2C-80%2C50&size=800%2C600&format=png&transparent=true&dpi=150'
          )
        );
        expect(result).toEqual(mockBlob);
      });

      it('should handle export with dynamic layers', async () => {
        const mockBlob = new Blob(['test']);
        mockFetch.mockResolvedValueOnce({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
        } as Response);

        service.setLayerRenderer(1, {
          type: 'simple',
          symbol: { type: 'esriSFS', color: [255, 0, 0, 128] },
        });

        await service.exportMapImage({
          bbox: [-100, 30, -80, 50] as [number, number, number, number],
          size: [800, 600] as [number, number],
          dynamicLayers: service.esriServiceOptions.dynamicLayers as any,
        });

        expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/dynamicLayers=/));
      });
    });

    describe('Legend Generation', () => {
      it('should generate legend for all layers', async () => {
        const mockResponse = {
          layers: [
            {
              layerId: 0,
              layerName: 'Layer 0',
              legend: [{ label: 'Symbol 1', url: 'http://example.com/symbol1.png' }],
            },
            {
              layerId: 1,
              layerName: 'Layer 1',
              legend: [{ label: 'Symbol 2', url: 'http://example.com/symbol2.png' }],
            },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const legend = await service.generateLegend();

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/legend?f=json'));
        expect(legend).toEqual(mockResponse.layers);
      });

      it('should generate legend for specific layers', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ layers: [] }),
        } as Response);

        await service.generateLegend([1, 3]);

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('layers=1%2C3'));
      });
    });

    describe('Metadata Discovery', () => {
      it('should get layer info', async () => {
        const mockResponse = {
          id: 1,
          name: 'Test Layer',
          type: 'Feature Layer',
          fields: [
            { name: 'OBJECTID', type: 'esriFieldTypeOID' },
            { name: 'NAME', type: 'esriFieldTypeString' },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const info = await service.getLayerInfo(1);

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/1?f=json'));
        expect(info).toEqual(mockResponse);
      });

      it('should discover all service layers', async () => {
        const mockResponse = {
          layers: [
            { id: 0, name: 'Layer 0' },
            { id: 1, name: 'Layer 1' },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const layers = await service.discoverLayers();

        expect(mockFetch).toHaveBeenCalledWith(expect.stringMatching(/\/MapServer\?f=json$/));
        expect(layers).toEqual(mockResponse.layers);
      });

      it('should get layer fields', async () => {
        const mockResponse = {
          fields: [
            { name: 'OBJECTID', type: 'esriFieldTypeOID' },
            { name: 'NAME', type: 'esriFieldTypeString' },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockResponse),
        } as Response);

        const fields = await service.getLayerFields(1);

        expect(fields).toEqual(mockResponse.fields);
      });

      it('should get layer extent', async () => {
        const mockExtent = {
          xmin: -180,
          ymin: -90,
          xmax: 180,
          ymax: 90,
          spatialReference: { wkid: 4326 },
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ extent: mockExtent }),
        } as Response);

        const extent = await service.getLayerExtent(1);

        expect(extent).toEqual(mockExtent);
      });
    });

    describe('Batch Operations', () => {
      it('should apply bulk layer properties', () => {
        service.setBulkLayerProperties([
          { layerId: 1, operation: 'visibility', value: true },
          {
            layerId: 1,
            operation: 'renderer',
            value: {
              type: 'simple',
              symbol: { type: 'esriSFS', color: [255, 0, 0, 128] },
            },
          },
          {
            layerId: 2,
            operation: 'filter',
            value: { field: 'STATUS', op: '=', value: 'Active' },
          },
        ]);

        const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
        const layer1 = dynamicLayers.find(l => l.id === 1);
        const layer2 = dynamicLayers.find(l => l.id === 2);
        expect(layer1?.visible).toBe(true);
        expect(layer1?.drawingInfo.renderer).toBeDefined();
        expect(layer2?.definitionExpression).toBe("STATUS = 'Active'");
      });

      it('should support transaction updates', () => {
        service.beginUpdate();
        expect(service.isInTransaction).toBe(true);

        service.setLayerVisibility(1, false);
        service.commitUpdate();

        expect(service.isInTransaction).toBe(false);
        expect((mockMap as Map).getSource?.('test-source')).toBeDefined();
      });

      it('should support transaction rollback', () => {
        service.beginUpdate();
        service.setLayerVisibility(1, false);
        service.rollbackUpdate();

        expect(service.isInTransaction).toBe(false);
        expect(service.esriServiceOptions.dynamicLayers).toBeDefined();
      });
    });

    describe('Advanced Error Handling', () => {
      it('should handle statistics query errors', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              error: { message: 'Statistics query failed' },
            }),
        } as Response);

        await expect(
          service.getLayerStatistics(1, [
            {
              statisticType: 'count',
              onStatisticField: 'OBJECTID',
              outStatisticFieldName: 'count',
            },
          ])
        ).rejects.toThrow('Statistics query failed: Statistics query failed');
      });

      it('should handle feature query errors', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              error: { message: 'Query failed' },
            }),
        } as Response);

        await expect(service.queryLayerFeatures(1, { where: '1=1' })).rejects.toThrow(
          'Layer query failed: Query failed'
        );
      });

      it('should handle export errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
        } as Response);

        await expect(
          service.exportMapImage({
            bbox: [-100, 30, -80, 50],
            size: [800, 600],
          })
        ).rejects.toThrow('Export failed: Internal Server Error');
      });

      it('should handle legend generation errors', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              error: { message: 'Legend generation failed' },
            }),
        } as Response);

        await expect(service.generateLegend()).rejects.toThrow(
          'Legend generation failed: Legend generation failed'
        );
      });

      it('should handle layer info errors', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              error: { message: 'Layer not found' },
            }),
        } as Response);

        await expect(service.getLayerInfo(999)).rejects.toThrow(
          'Layer info request failed: Layer not found'
        );
      });

      it('should handle missing extent error', async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ name: 'Layer without extent' }),
        } as Response);

        await expect(service.getLayerExtent(1)).rejects.toThrow('No extent available for layer 1');
      });
    });
  });
});
