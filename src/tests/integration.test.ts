import { DynamicMapService } from '@/Services/DynamicMapService';
import { ImageService } from '@/Services/ImageService';
import { TiledMapService } from '@/Services/TiledMapService';
import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';
import { IdentifyFeatures } from '@/Tasks/IdentifyFeatures';
import { IdentifyImage } from '@/Tasks/IdentifyImage';
import type { Map } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Create a mock Map interface with only the methods we need
const createMockMap = (): Partial<Map> => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn().mockReturnValue({
    setTiles: jest.fn(),
    setUrl: jest.fn(),
    tiles: ['http://example.com/initial'],
    _options: {},
  }),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  setLayerZoomRange: jest.fn(),
  setFilter: jest.fn(),
  queryRenderedFeatures: jest.fn().mockReturnValue([]),
  getBounds: jest.fn().mockReturnValue({
    getNorthEast: () => ({ lat: 45, lng: -90 }),
    getSouthWest: () => ({ lat: 35, lng: -100 }),
  }),
  getZoom: jest.fn().mockReturnValue(10),
  project: jest.fn().mockReturnValue({ x: 400, y: 300 }),
  unproject: jest.fn().mockReturnValue({ lng: -95, lat: 40 }),
});

describe('Integration Tests', () => {
  let map: Partial<Map>;

  beforeEach(() => {
    jest.clearAllMocks();
    map = createMockMap();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        layers: [{ id: 0, name: 'Test Layer' }],
        spatialReference: { wkid: 3857 },
        copyrightText: 'Test Copyright',
      }),
    } as Response);
  });

  describe('Service-Source Integration', () => {
    it('should properly integrate DynamicMapService with MapLibre sources', () => {
      const sourceId = 'test-dynamic-source';

      new DynamicMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer',
      });

      // Verify service creates and manages source correctly
      expect(map.addSource).toHaveBeenCalledWith(
        sourceId,
        expect.objectContaining({
          type: 'raster',
          tiles: expect.arrayContaining([expect.stringContaining('https://example.com/MapServer')]),
        })
      );
    });

    it('should properly integrate TiledMapService with cached tile sources', () => {
      const sourceId = 'test-tiled-source';

      new TiledMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer',
      });

      expect(map.addSource).toHaveBeenCalledWith(
        sourceId,
        expect.objectContaining({
          type: 'raster',
          tiles: expect.arrayContaining([expect.stringContaining('https://example.com/MapServer')]),
        })
      );
    });

    it('should properly integrate ImageService with analytical capabilities', () => {
      const sourceId = 'test-image-source';

      new ImageService(sourceId, map as Map, {
        url: 'https://example.com/ImageServer',
      });

      expect(map.addSource).toHaveBeenCalledWith(
        sourceId,
        expect.objectContaining({
          type: 'raster',
          tiles: expect.arrayContaining([
            expect.stringContaining('https://example.com/ImageServer'),
          ]),
        })
      );
    });

    it('should handle service removal and cleanup', () => {
      const sourceId = 'test-cleanup-source';
      const service = new DynamicMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer',
      });

      service.remove();
      expect(map.removeSource).toHaveBeenCalledWith(sourceId);
    });
  });

  describe('Service Lifecycle Management', () => {
    it('should handle multiple services with different source IDs', () => {
      new DynamicMapService('source-1', map as Map, {
        url: 'https://example1.com/MapServer',
      });

      new TiledMapService('source-2', map as Map, {
        url: 'https://example2.com/MapServer',
      });

      // Both services should create their own sources
      expect(map.addSource).toHaveBeenCalledTimes(2);
      expect(map.addSource).toHaveBeenCalledWith('source-1', expect.any(Object));
      expect(map.addSource).toHaveBeenCalledWith('source-2', expect.any(Object));
    });

    it('should handle service updates without errors', () => {
      const service = new DynamicMapService('dynamic-update', map as Map, {
        url: 'https://example.com/MapServer',
      });

      // Mock source for update operations with required properties
      (map.getSource as jest.Mock).mockReturnValue({
        setTiles: jest.fn(),
        setUrl: jest.fn(),
        tiles: ['http://example.com/initial'],
        _options: {},
      });

      service.update();
      expect(map.getSource).toHaveBeenCalledWith('dynamic-update');
    });
  });

  describe('Task Integration', () => {
    it('should integrate IdentifyFeatures task with services', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              layerId: 0,
              layerName: 'Test Layer',
              value: 'Test Value',
              displayFieldName: 'NAME',
              attributes: { NAME: 'Test Feature' },
              geometry: { x: -95, y: 40 },
            },
          ],
        }),
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });

      await task.at({ lng: -95, lat: 40 }).run();
      // Verify URL used contains expected endpoint
      const firstCallUrl = (mockFetch.mock.calls[0] && mockFetch.mock.calls[0][0]) as string;
      expect(firstCallUrl).toContain('https://example.com/MapServer/identify');
    });

    it('should integrate IdentifyImage task with ImageService', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          location: { x: -95, y: 40 },
          catalogItems: {
            features: [
              {
                attributes: { Raster_Val: 123 },
              },
            ],
          },
        }),
      } as Response);

      const task = new IdentifyImage({
        url: 'https://example.com/ImageServer',
      });

      const results = await task.at({ lng: -95, lat: 40 }).run();
      const firstCallUrl2 = (mockFetch.mock.calls[0] && mockFetch.mock.calls[0][0]) as string;
      expect(firstCallUrl2).toContain('https://example.com/ImageServer/identify');
      expect(results).toHaveProperty('results');
    });
  });

  describe('Cross-Service Interactions', () => {
    it('should handle vector basemap styles independently', () => {
      const vectorStyle = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');

      expect(vectorStyle.styleUrl).toContain('apiKey=test-api-key');
      expect(vectorStyle.styleName).toBe('ArcGIS:Streets');

      // Vector basemap styles don't interact with map sources directly
      expect(map.addSource).not.toHaveBeenCalled();
    });

    it('should handle service authentication patterns', () => {
      new DynamicMapService('public-test', map as Map, {
        url: 'https://public.example.com/MapServer',
      });

      // Service should be created without throwing errors
      expect(map.addSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const task = new IdentifyFeatures({
        url: 'https://unreachable.example.com/MapServer',
      });

      await expect(task.at({ lng: -95, lat: 40 }).run()).rejects.toThrow('Network error');
    });

    it('should handle service errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/NonExistentService',
      });

      await expect(task.at({ lng: -95, lat: 40 }).run()).rejects.toThrow();
    });

    it('should handle malformed service responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Malformed response missing required fields
          invalidResponse: true,
        }),
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });

      const results = await task.at({ lng: -95, lat: 40 }).run();
      expect(results).toBeDefined();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should efficiently manage multiple concurrent services', () => {
      const services = [];

      for (let i = 0; i < 5; i++) {
        services.push(
          new DynamicMapService(`concurrent-${i}`, map as Map, {
            url: `https://example${i}.com/MapServer`,
          })
        );
      }

      expect(map.addSource).toHaveBeenCalledTimes(5);
      expect(services).toHaveLength(5);
    });

    it('should handle rapid service creation and removal', () => {
      const sourceId = 'rapid-lifecycle';

      const service = new DynamicMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer',
      });

      service.remove();

      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.any(Object));
      expect(map.removeSource).toHaveBeenCalledWith(sourceId);
    });

    it('should maintain service state during map updates', async () => {
      const service = new DynamicMapService('persistent', map as Map, {
        url: 'https://example.com/MapServer',
      });

      // Mock source for update operations with required properties
      (map.getSource as jest.Mock).mockReturnValue({
        setTiles: jest.fn(),
        setUrl: jest.fn(),
        tiles: ['http://example.com/initial'],
        _options: {},
      });

      // Service should survive multiple updates
      service.update();

      // Wait for debounced update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      service.update();

      // Wait for second debounced update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      service.update();

      // Wait for third debounced update to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Each update should trigger getSource once (due to debouncing, rapid calls are collapsed)
      expect(map.getSource).toHaveBeenCalledTimes(3);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle complex multi-service map setup', () => {
      // Base imagery layer
      new ImageService('imagery', map as Map, {
        url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
      });

      // Dynamic overlay with multiple layers
      new DynamicMapService('overlay', map as Map, {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
        layers: [0, 1, 2],
      });

      // Vector basemap for reference
      const vectorStyle = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');

      expect(map.addSource).toHaveBeenCalledTimes(2);
      expect(vectorStyle.styleName).toBe('ArcGIS:Streets');
    });

    it('should handle identify operations across multiple services', async () => {
      mockFetch.mockClear();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                layerId: 0,
                layerName: 'States',
                value: 'California',
                attributes: { STATE_NAME: 'California' },
              },
            ],
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            location: { x: -120, y: 35 },
            catalogItems: { features: [{ attributes: { Pixel_Value: 255 } }] },
          }),
        } as Response);

      new DynamicMapService('overlay', map as Map, {
        url: 'https://example.com/MapServer',
      });

      const identifyTask1 = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });

      const identifyTask2 = new IdentifyImage({
        url: 'https://example.com/ImageServer',
      });

      const results1 = await identifyTask1.at({ lng: -120, lat: 35 }).run();
      const results2 = await identifyTask2.at({ lng: -120, lat: 35 }).run();
      expect(results1).toBeDefined();
      expect(results2).toBeDefined();

      // Validate that both identify requests were issued (allowing any extra internal fetches)
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
