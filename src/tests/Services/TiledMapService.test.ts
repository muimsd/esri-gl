import { TiledMapService } from '@/Services/TiledMapService';
import type { Map } from '@/types';

// Mock Map with minimal interface
const createMockMap = (): Partial<Map> => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
});

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('TiledMapService', () => {
  let mockMap: Partial<Map>;
  let service: TiledMapService;

  beforeEach(() => {
    mockMap = createMockMap();
    jest.clearAllMocks();

    // Default successful metadata response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          serviceDescription: 'Test Tiled Service',
          copyrightText: 'Test Copyright',
          tileInfo: {
            cols: 256,
            rows: 256,
            format: 'PNG',
          },
          spatialReference: { wkid: 3857 },
        }),
    } as Response);
  });

  describe('Constructor', () => {
    it('should create service with basic options', () => {
      service = new TiledMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'raster',
          tiles: expect.arrayContaining([expect.stringContaining('tile')]),
          tileSize: 256,
        })
      );
    });

    it('should handle custom tile size', () => {
      service = new TiledMapService(
        'test-source',
        mockMap as Map,
        {
          url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        },
        {
          tileSize: 512,
        }
      );

      const addSourceCall = (mockMap.addSource as jest.Mock).mock.calls[0];
      const sourceOptions = addSourceCall[1];

      expect(sourceOptions.tileSize).toBe(512);
    });

    it('should handle attribution option', () => {
      service = new TiledMapService(
        'test-source',
        mockMap as Map,
        {
          url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        },
        {
          attribution: 'Custom Attribution',
        }
      );

      const addSourceCall = (mockMap.addSource as jest.Mock).mock.calls[0];
      const sourceOptions = addSourceCall[1];

      expect(sourceOptions.attribution).toBe('Custom Attribution');
    });

    it('should fetch service metadata when getAttributionFromService is true', async () => {
      service = new TiledMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        getAttributionFromService: true,
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/MapServer?f=json'),
        expect.any(Object)
      );
    });

    it('should throw error when URL is missing', () => {
      expect(() => {
        new TiledMapService('test-source', mockMap as Map, { url: '' });
      }).toThrow('A url must be supplied as part of the esriServiceOptions object.');
    });
  });

  describe('Service Properties', () => {
    it('should have correct source configuration', () => {
      service = new TiledMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });

      // Verify service was created with correct properties
      expect(service.esriServiceOptions).toEqual(
        expect.objectContaining({
          url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        })
      );
    });
  });

  describe('Update and Remove', () => {
    beforeEach(() => {
      service = new TiledMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
      });
    });

    it('should update source', () => {
      service.update();
      expect(mockMap.getSource).toHaveBeenCalledWith('test-source');
    });

    it('should remove source', () => {
      service.remove();
      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during metadata fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      service = new TiledMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        getAttributionFromService: true,
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(service).toBeDefined();
    });

    it('should handle invalid response during metadata fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Service not found' }),
      } as Response);

      service = new TiledMapService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
        getAttributionFromService: true,
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(service).toBeDefined();
    });
  });
});
