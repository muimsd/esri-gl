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

// Create a mock Map interface
const createMockMap = (): Partial<Map> => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn().mockReturnValue({
    setTiles: jest.fn(),
    setUrl: jest.fn()
  }),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  setLayerZoomRange: jest.fn(),
  setFilter: jest.fn(),
  queryRenderedFeatures: jest.fn().mockReturnValue([]),
  getBounds: jest.fn().mockReturnValue({
    getNorthEast: () => ({ lat: 45, lng: -90 }),
    getSouthWest: () => ({ lat: 35, lng: -100 })
  }),
  getZoom: jest.fn().mockReturnValue(10),
  project: jest.fn().mockReturnValue({ x: 400, y: 300 }),
  unproject: jest.fn().mockReturnValue({ lng: -95, lat: 40 })
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
        copyrightText: 'Test Copyright'
      })
    } as Response);
  });

  describe('Service-Source Integration', () => {
    it('should properly integrate DynamicMapService with MapLibre sources', () => {
      const sourceId = 'test-dynamic-source';
      
      new DynamicMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer'
      });

      // Verify service creates and manages source correctly
      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.objectContaining({
        type: 'raster',
        tiles: expect.arrayContaining([expect.stringContaining('https://example.com/MapServer')])
      }));
    });

    it('should properly integrate TiledMapService with cached tile sources', () => {
      const sourceId = 'test-tiled-source';
      
      new TiledMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer'
      });

      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.objectContaining({
        type: 'raster',
        tiles: expect.arrayContaining([expect.stringContaining('https://example.com/MapServer')])
      }));
    });

    it('should properly integrate ImageService with analytical capabilities', () => {
      const sourceId = 'test-image-source';
      
      new ImageService(sourceId, map as Map, {
        url: 'https://example.com/ImageServer'
      });

      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.objectContaining({
        type: 'raster',
        tiles: expect.arrayContaining([expect.stringContaining('https://example.com/ImageServer')])
      }));
    });

    it('should handle service removal and cleanup', () => {
      const sourceId = 'test-cleanup-source';
      const service = new DynamicMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer'
      });

      service.remove();
      expect(map.removeSource).toHaveBeenCalledWith(sourceId);
    });
  });

  describe('Service Lifecycle Management', () => {
    it('should handle multiple services with different source IDs', () => {
      new DynamicMapService('source-1', map as Map, {
        url: 'https://example1.com/MapServer'
      });
      
      new TiledMapService('source-2', map as Map, {
        url: 'https://example2.com/MapServer'
      });

      // Both services should create their own sources
      expect(map.addSource).toHaveBeenCalledTimes(2);
      expect(map.addSource).toHaveBeenCalledWith('source-1', expect.any(Object));
      expect(map.addSource).toHaveBeenCalledWith('source-2', expect.any(Object));
    });

    it('should handle service updates without errors', () => {
      const service = new DynamicMapService('dynamic-update', map as Map, {
        url: 'https://example.com/MapServer'
      });

      // Mock source for update operations
      (map.getSource as jest.Mock).mockReturnValue({
        setTiles: jest.fn()
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
              geometry: { x: -95, y: 40 }
            }
          ]
        })
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/MapServer'
      });

      const results = await task.at({ lng: -95, lat: 40 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/MapServer/identify'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(results).toBeInstanceOf(IdentifyFeatures);
    });

    it('should integrate IdentifyImage task with ImageService', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          location: { x: -95, y: 40 },
          catalogItems: {
            features: [
              {
                attributes: { Raster_Val: 123 }
              }
            ]
          }
        })
      } as Response);

      const task = new IdentifyImage({
        url: 'https://example.com/ImageServer'
      });

      const results = await task.at({ lng: -95, lat: 40 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/ImageServer/identify'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(results).toBeInstanceOf(IdentifyImage);
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
        url: 'https://public.example.com/MapServer'
      });

      // Service should be created without throwing errors
      expect(map.addSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const task = new IdentifyFeatures({
        url: 'https://unreachable.example.com/MapServer'
      });

      await expect(task.at({ lng: -95, lat: 40 })).rejects.toThrow('Network error');
    });

    it('should handle service errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/NonExistentService'
      });

      await expect(task.at({ lng: -95, lat: 40 })).rejects.toThrow();
    });

    it('should handle malformed service responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Malformed response missing required fields
          invalidResponse: true
        })
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/MapServer'
      });

      const results = await task.at({ lng: -95, lat: 40 });
      expect(results).toBeInstanceOf(IdentifyFeatures);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should efficiently manage multiple concurrent services', () => {
      const services = [];
      
      for (let i = 0; i < 5; i++) {
        services.push(
          new DynamicMapService(`concurrent-${i}`, map as Map, {
            url: `https://example${i}.com/MapServer`
          })
        );
      }

      expect(map.addSource).toHaveBeenCalledTimes(5);
      expect(services).toHaveLength(5);
    });

    it('should handle rapid service creation and removal', () => {
      const sourceId = 'rapid-lifecycle';
      
      const service = new DynamicMapService(sourceId, map as Map, {
        url: 'https://example.com/MapServer'
      });
      
      service.remove();

      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.any(Object));
      expect(map.removeSource).toHaveBeenCalledWith(sourceId);
    });

    it('should maintain service state during map updates', () => {
      const service = new DynamicMapService('persistent', map as Map, {
        url: 'https://example.com/MapServer'
      });

      // Mock source for update operations
      (map.getSource as jest.Mock).mockReturnValue({
        setTiles: jest.fn()
      });

      // Service should survive multiple updates
      service.update();
      service.update();
      service.update();

      expect(map.getSource).toHaveBeenCalledTimes(3);
    });
  });
});

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Create a mock Map interface
const createMockMap = (): Map => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn().mockReturnValue({
    setTiles: jest.fn(),
    setUrl: jest.fn()
  }),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  setLayerZoomRange: jest.fn(),
  setFilter: jest.fn(),
  queryRenderedFeatures: jest.fn().mockReturnValue([]),
  getBounds: jest.fn().mockReturnValue({
    getNorthEast: () => ({ lat: 45, lng: -90 }),
    getSouthWest: () => ({ lat: 35, lng: -100 })
  }),
  getZoom: jest.fn().mockReturnValue(10),
  project: jest.fn().mockReturnValue({ x: 400, y: 300 }),
  unproject: jest.fn().mockReturnValue({ lng: -95, lat: 40 })
});

describe('Integration Tests', () => {
  let map: Map;

  beforeEach(() => {
    jest.clearAllMocks();
    map = createMockMap();
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        layers: [{ id: 0, name: 'Test Layer' }],
        spatialReference: { wkid: 3857 },
        copyrightText: 'Test Copyright'
      })
    } as Response);
  });

  describe('Service-Source Integration', () => {
    it('should properly integrate DynamicMapService with MapLibre sources', async () => {
      const sourceId = 'test-dynamic-source';
      const service = new DynamicMapService(sourceId, map, {
        url: 'https://example.com/MapServer'
      });

      // Verify service creates and manages source correctly
      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.objectContaining({
        type: 'raster',
        tiles: expect.arrayContaining([expect.stringContaining('https://example.com/MapServer')])
      }));
    });

    it('should properly integrate TiledMapService with cached tile sources', async () => {
      const sourceId = 'test-tiled-source';
      const service = new TiledMapService(sourceId, map, {
        url: 'https://example.com/MapServer'
      });

      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.objectContaining({
        type: 'raster',
        tiles: expect.arrayContaining([expect.stringContaining('https://example.com/MapServer')])
      }));
    });

    it('should properly integrate ImageService with analytical capabilities', async () => {
      const sourceId = 'test-image-source';
      const service = new ImageService(sourceId, map, {
        url: 'https://example.com/ImageServer'
      });

      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.objectContaining({
        type: 'raster',
        tiles: expect.arrayContaining([expect.stringContaining('https://example.com/ImageServer')])
      }));
    });

    it('should handle service removal and cleanup', () => {
      const sourceId = 'test-cleanup-source';
      const service = new DynamicMapService(sourceId, map, {
        url: 'https://example.com/MapServer'
      });

      service.remove();
      expect(map.removeSource).toHaveBeenCalledWith(sourceId);
    });
  });

  describe('Service Lifecycle Management', () => {
    it('should handle multiple services with different source IDs', () => {
      const service1 = new DynamicMapService('source-1', map, {
        url: 'https://example1.com/MapServer'
      });
      
      const service2 = new TiledMapService('source-2', map, {
        url: 'https://example2.com/MapServer'
      });

      // Both services should create their own sources
      expect(map.addSource).toHaveBeenCalledTimes(2);
      expect(map.addSource).toHaveBeenCalledWith('source-1', expect.any(Object));
      expect(map.addSource).toHaveBeenCalledWith('source-2', expect.any(Object));
    });

    it('should handle service updates without errors', async () => {
      const service = new DynamicMapService('dynamic-update', map, {
        url: 'https://example.com/MapServer'
      });

      // Mock source with update methods
      (map.getSource as jest.Mock).mockReturnValue({
        setTiles: jest.fn(),
        setUrl: jest.fn()
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
              geometry: { x: -95, y: 40 }
            }
          ]
        })
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/MapServer'
      });

      const results = await task.at({ lng: -95, lat: 40 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/MapServer/identify'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(results).toBeInstanceOf(IdentifyFeatures);
    });

    it('should integrate IdentifyImage task with ImageService', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          location: { x: -95, y: 40 },
          catalogItems: {
            features: [
              {
                attributes: { Raster_Val: 123 }
              }
            ]
          }
        })
      } as Response);

      const task = new IdentifyImage({
        url: 'https://example.com/ImageServer'
      });

      const results = await task.at({ lng: -95, lat: 40 });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/ImageServer/identify'),
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(results).toBeInstanceOf(IdentifyImage);
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
      const publicService = new DynamicMapService('public-test', map, {
        url: 'https://public.example.com/MapServer'
      });

      // Service should be created without throwing errors
      expect(map.addSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const task = new IdentifyFeatures({
        url: 'https://unreachable.example.com/MapServer'
      });

      await expect(task.at({ lng: -95, lat: 40 })).rejects.toThrow('Network error');
    });

    it('should handle service errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/NonExistentService'
      });

      await expect(task.at({ lng: -95, lat: 40 })).rejects.toThrow();
    });

    it('should handle malformed service responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Malformed response missing required fields
          invalidResponse: true
        })
      } as Response);

      const task = new IdentifyFeatures({
        url: 'https://example.com/MapServer'
      });

      const results = await task.at({ lng: -95, lat: 40 });
      expect(results).toBeInstanceOf(IdentifyFeatures);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should efficiently manage multiple concurrent services', () => {
      const services = [];
      
      for (let i = 0; i < 5; i++) {
        services.push(
          new DynamicMapService(`concurrent-${i}`, map, {
            url: `https://example${i}.com/MapServer`
          })
        );
      }

      expect(map.addSource).toHaveBeenCalledTimes(5);
      expect(services).toHaveLength(5);
    });

    it('should handle rapid service creation and removal', () => {
      const sourceId = 'rapid-lifecycle';
      
      const service = new DynamicMapService(sourceId, map, {
        url: 'https://example.com/MapServer'
      });
      
      service.remove();

      expect(map.addSource).toHaveBeenCalledWith(sourceId, expect.any(Object));
      expect(map.removeSource).toHaveBeenCalledWith(sourceId);
    });

    it('should maintain service state during map updates', async () => {
      const service = new DynamicMapService('persistent', map, {
        url: 'https://example.com/MapServer'
      });

      // Mock source for update operations
      (map.getSource as jest.Mock).mockReturnValue({
        setTiles: jest.fn()
      });

      // Service should survive multiple updates
      service.update();
      service.update();
      service.update();

      expect(map.getSource).toHaveBeenCalledTimes(3);
    });
  });
});

// Mock Map implementation for integration tests
const createMockMap = (): Map => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn().mockReturnValue({
    setUrl: jest.fn(),
    setTiles: jest.fn(),
    setData: jest.fn(),
    reload: jest.fn()
  }),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  hasLayer: jest.fn().mockReturnValue(false),
  queryRenderedFeatures: jest.fn().mockReturnValue([]),
  project: jest.fn().mockReturnValue({ x: 100, y: 100 }),
  getBounds: jest.fn().mockReturnValue({
    getNorthEast: () => ({ lng: -95, lat: 40 }),
    getSouthWest: () => ({ lng: -96, lat: 39 })
  }),
  getZoom: jest.fn().mockReturnValue(10),
  fire: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn()
});

// Mock successful fetch responses
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const mockServiceResponse = {
  mapName: 'Test Map',
  layers: [
    { id: 0, name: 'Layer 0' },
    { id: 1, name: 'Layer 1' }
  ],
  spatialReference: { wkid: 102100 },
  initialExtent: { xmin: -180, ymin: -90, xmax: 180, ymax: 90 }
};

const mockImageServiceResponse = {
  name: 'Test Image Service',
  pixelSizeX: 30,
  pixelSizeY: 30,
  bandCount: 1,
  spatialReference: { wkid: 4326 },
  extent: { xmin: -180, ymin: -90, xmax: 180, ymax: 90 }
};

const mockFeatureServiceResponse = {
  layers: [
    { id: 0, name: 'Points', type: 'Feature Layer', geometryType: 'esriGeometryPoint' }
  ],
  spatialReference: { wkid: 4326 }
};

describe('Service Integration Tests', () => {
  let map: Map;

  beforeEach(() => {
    map = createMockMap();
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  describe('Service Lifecycle Management', () => {
    it('should manage multiple services on same map', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockServiceResponse)
      } as Response);

      const dynamicService = new DynamicMapService('dynamic-source', map, {
        url: 'https://example.com/dynamic'
      });
      
      const tiledService = new TiledMapService('tiled-source', map, {
        url: 'https://example.com/tiled'
      });

      await dynamicService.getMetadata();
      await tiledService.getMetadata();

      expect(map.addSource).toHaveBeenCalledTimes(2);
      expect(map.addSource).toHaveBeenCalledWith('dynamic-source', expect.any(Object));
      expect(map.addSource).toHaveBeenCalledWith('tiled-source', expect.any(Object));
    });

    it('should handle service removal properly', () => {
      const service = new DynamicMapService('test-source', map, {
        url: 'https://example.com/service'
      });

      service.remove();

      expect(map.removeSource).toHaveBeenCalledWith('test-source');
    });

    it('should prevent source ID conflicts', () => {
      const sourceId = 'conflict-source';

      const service1 = new DynamicMapService(sourceId, map, {
        url: 'https://example.com/service1'
      });

      // Second service with same sourceId should work but will conflict at map level
      const service2 = new TiledMapService(sourceId, map, {
        url: 'https://example.com/service2'
      });

      expect(map.addSource).toHaveBeenCalledTimes(2);
      expect(map.addSource).toHaveBeenNthCalledWith(1, sourceId, expect.any(Object));
      expect(map.addSource).toHaveBeenNthCalledWith(2, sourceId, expect.any(Object));
    });
  });

  describe('Service-Task Integration', () => {
    it('should work with IdentifyFeatures task', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockServiceResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            results: [
              { layerId: 0, feature: { geometry: { x: -95, y: 40 }, attributes: { NAME: 'Test' } } }
            ]
          })
        } as Response);

      const service = new DynamicMapService('test-source', map, {
        url: 'https://example.com/service'
      });

      const task = new IdentifyFeatures({
        url: 'https://example.com/service/identify'
      });

      await service.getMetadata();
      const results = await task.at({ lng: -95, lat: 40 }, map);

      expect(results).toBeDefined();
      expect(Array.isArray(results.results)).toBe(true);
    });

    it('should work with IdentifyImage task', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockImageServiceResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            value: 123,
            location: { x: -95, y: 40 }
          })
        } as Response);

      const service = new ImageService('image-source', map, {
        url: 'https://example.com/imageservice'
      });

      const task = new IdentifyImage({
        url: 'https://example.com/imageservice'
      });

      await service.getMetadata();
      const results = await task.at({ lng: -95, lat: 40 });

      expect(results.value).toBe(123);
      expect(results.location).toEqual({ x: -95, y: 40 });
    });

    it('should work with QueryFeatures task', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockFeatureServiceResponse)
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            features: [
              { geometry: { x: -95, y: 40 }, attributes: { ID: 1, NAME: 'Feature 1' } }
            ]
          })
        } as Response);

      const service = new FeatureService('feature-source', map, {
        url: 'https://example.com/featureservice/0'
      });

      const task = new QueryFeatures({
        url: 'https://example.com/featureservice/0'
      });

      await service.getMetadata();
      const results = await task.where('1=1').run();

      expect(results.features).toHaveLength(1);
      expect(results.features[0].attributes.NAME).toBe('Feature 1');
    });
  });

  describe('Cross-Service Interactions', () => {
    it('should handle multiple services with different authentication', () => {
      const publicService = new DynamicMapService('public-source', map, {
        url: 'https://services.arcgisonline.com/public'
      });

      const secureService = new DynamicMapService('secure-source', map, {
        url: 'https://services.arcgisonline.com/secure',
        token: 'test-token'
      });

      expect(publicService._esriOptions.token).toBeUndefined();
      expect(secureService._esriOptions.token).toBe('test-token');
    });

    it('should coordinate identify operations across multiple services', async () => {
      const identifyResponses = [
        { results: [{ layerId: 0, feature: { attributes: { name: 'Service1Feature' } } }] },
        { results: [{ layerId: 0, feature: { attributes: { name: 'Service2Feature' } } }] }
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockServiceResponse) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockServiceResponse) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(identifyResponses[0]) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(identifyResponses[1]) } as Response);

      const service1 = new DynamicMapService('service1', map, {
        url: 'https://example.com/service1'
      });
      
      const service2 = new DynamicMapService('service2', map, {
        url: 'https://example.com/service2'
      });

      await Promise.all([
        service1.getMetadata(),
        service2.getMetadata()
      ]);

      const point = { lng: -95, lat: 40 };
      const results = await Promise.all([
        service1.identify(point),
        service2.identify(point)
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].results[0].feature.attributes.name).toBe('Service1Feature');
      expect(results[1].results[0].feature.attributes.name).toBe('Service2Feature');
    });

    it('should handle mixed service types on same map', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockServiceResponse) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockImageServiceResponse) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockFeatureServiceResponse) } as Response);

      const dynamicService = new DynamicMapService('dynamic', map, {
        url: 'https://example.com/dynamic'
      });
      
      const imageService = new ImageService('image', map, {
        url: 'https://example.com/image'
      });
      
      const featureService = new FeatureService('features', map, {
        url: 'https://example.com/features/0'
      });

      // All should initialize without conflicts
      await Promise.all([
        dynamicService.getMetadata(),
        imageService.getMetadata(),
        featureService.getMetadata()
      ]);

      expect(map.addSource).toHaveBeenCalledTimes(3);
      expect(map.addSource).toHaveBeenCalledWith('dynamic', expect.objectContaining({ type: 'raster' }));
      expect(map.addSource).toHaveBeenCalledWith('image', expect.objectContaining({ type: 'raster' }));
      expect(map.addSource).toHaveBeenCalledWith('features', expect.objectContaining({ type: 'geojson' }));
    });
  });

  describe('Map State Management', () => {
    it('should handle map bound changes affecting multiple services', () => {
      const service1 = new DynamicMapService('service1', map, {
        url: 'https://example.com/service1'
      });
      
      const service2 = new DynamicMapService('service2', map, {
        url: 'https://example.com/service2'
      });

      // Simulate map bounds change
      (map.getBounds as jest.Mock).mockReturnValue({
        getNorthEast: () => ({ lng: -94, lat: 41 }),
        getSouthWest: () => ({ lng: -97, lat: 38 })
      });
      
      (map.getZoom as jest.Mock).mockReturnValue(12);

      service1.update();
      service2.update();

      // Both services should update their sources
      expect(map.getSource).toHaveBeenCalledWith('service1');
      expect(map.getSource).toHaveBeenCalledWith('service2');
    });

    it('should handle service cleanup when map is destroyed', () => {
      const services = [
        new DynamicMapService('service1', map, { url: 'https://example.com/1' }),
        new TiledMapService('service2', map, { url: 'https://example.com/2' }),
        new ImageService('service3', map, { url: 'https://example.com/3' })
      ];

      // Simulate cleanup
      services.forEach(service => service.remove());

      expect(map.removeSource).toHaveBeenCalledTimes(3);
      expect(map.removeSource).toHaveBeenCalledWith('service1');
      expect(map.removeSource).toHaveBeenCalledWith('service2');
      expect(map.removeSource).toHaveBeenCalledWith('service3');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network failures gracefully across services', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const service1 = new DynamicMapService('service1', map, {
        url: 'https://unreachable.com/service1'
      });
      
      const service2 = new TiledMapService('service2', map, {
        url: 'https://unreachable.com/service2'
      });

      await expect(service1.getMetadata()).rejects.toThrow('Network error');
      await expect(service2.getMetadata()).rejects.toThrow('Network error');

      // Sources should still be added even if metadata fails
      expect(map.addSource).toHaveBeenCalledTimes(2);
    });

    it('should handle partial service failures in identify operations', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockServiceResponse) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockServiceResponse) } as Response)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ results: [] }) } as Response)
        .mockRejectedValueOnce(new Error('Service unavailable'));

      const service1 = new DynamicMapService('working-service', map, {
        url: 'https://example.com/working'
      });
      
      const service2 = new DynamicMapService('failing-service', map, {
        url: 'https://example.com/failing'
      });

      await Promise.all([
        service1.getMetadata(),
        service2.getMetadata()
      ]);

      const point = { lng: -95, lat: 40 };
      const results = await Promise.allSettled([
        service1.identify(point),
        service2.identify(point)
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent metadata requests efficiently', async () => {
      const metadataPromises = Array(5).fill(null).map(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockServiceResponse) } as Response)
      );
      
      mockFetch.mockImplementation(() => metadataPromises[mockFetch.mock.calls.length - 1]);

      const services = Array(5).fill(null).map((_, i) =>
        new DynamicMapService(`service-${i}`, map, { url: `https://example.com/service${i}` })
      );

      const startTime = Date.now();
      await Promise.all(services.map(service => service.getMetadata()));
      const endTime = Date.now();

      // Should complete reasonably quickly (less than 1 second for mocked responses)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    it('should handle service updates without recreating sources', () => {
      const service = new DynamicMapService('test-source', map, {
        url: 'https://example.com/service'
      });

      const mockSource = {
        setUrl: jest.fn(),
        setTiles: jest.fn(),
        reload: jest.fn()
      };
      
      (map.getSource as jest.Mock).mockReturnValue(mockSource);

      // Multiple updates should reuse existing source
      service.update();
      service.update();
      service.update();

      expect(map.addSource).toHaveBeenCalledTimes(1);
      expect(mockSource.setUrl).toHaveBeenCalledTimes(3);
    });
  });

  describe('VectorBasemapStyle Integration', () => {
    it('should work independently from other services', () => {
      const basemapStyle = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');
      
      const dynamicService = new DynamicMapService('overlay', map, {
        url: 'https://example.com/overlay'
      });

      // VectorBasemapStyle doesn't interact with map sources directly
      expect(basemapStyle.styleUrl).toContain('ArcGIS:Streets');
      expect(map.addSource).toHaveBeenCalledTimes(1); // Only from DynamicMapService
    });

    it('should handle style changes without affecting other services', () => {
      const basemapStyle = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');
      const service = new DynamicMapService('overlay', map, {
        url: 'https://example.com/overlay'
      });

      const originalUrl = basemapStyle.styleUrl;
      basemapStyle.setStyle('ArcGIS:Imagery');
      
      // Style change shouldn't affect other services
      expect(basemapStyle.styleUrl).not.toBe(originalUrl);
      expect(map.addSource).toHaveBeenCalledTimes(1); // Still just the DynamicMapService
    });
  });
});