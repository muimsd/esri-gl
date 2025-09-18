import { VectorTileService } from '@/Services/VectorTileService';
import { cleanTrailingSlash, getServiceDetails } from '@/utils';
import type { Map, VectorTileServiceOptions, VectorSourceOptions } from '@/types';

// Mock the utilities
jest.mock('@/utils', () => ({
  cleanTrailingSlash: jest.fn(),
  getServiceDetails: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();
const mockCleanTrailingSlash = cleanTrailingSlash as jest.MockedFunction<typeof cleanTrailingSlash>;
const mockGetServiceDetails = getServiceDetails as jest.MockedFunction<typeof getServiceDetails>;

describe('VectorTileService', () => {
  let mockMap: jest.Mocked<Map>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMap = {
      addSource: jest.fn(),
      removeSource: jest.fn(),
      getSource: jest.fn(),
    } as unknown as jest.Mocked<Map>;

    // Default mock implementations
    mockCleanTrailingSlash.mockImplementation((url: string) => url.replace(/\/$/, ''));
    mockGetServiceDetails.mockResolvedValue({
      tiles: ['/tile/{z}/{y}/{x}.pbf'],
      defaultStyles: 'resources/styles/root.json',
      name: 'Test Vector Service',
    });
  });

  describe('Constructor', () => {
    it('should create VectorTileService instance with required options', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      expect(service).toBeInstanceOf(VectorTileService);
      expect(mockCleanTrailingSlash).toHaveBeenCalledWith(options.url);
      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.any(Object));
    });

    it('should throw error if url is not provided', () => {
      expect(() => {
        new VectorTileService('test-source', mockMap, {} as VectorTileServiceOptions);
      }).toThrow('A url must be supplied as part of the esriServiceOptions object.');
    });

    it('should set default options correctly', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      expect(service.options).toEqual({
        url: 'https://example.com/VectorTileServer',
        useDefaultStyle: true,
      });
    });

    it('should create source with vector options', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };
      
      const vectorOptions: VectorSourceOptions = {
        attribution: 'Custom Attribution',
        minzoom: 0,
        maxzoom: 18,
      };

      new VectorTileService('test-source', mockMap, options, vectorOptions);

      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.objectContaining({
        type: 'vector',
        attribution: 'Custom Attribution',
        minzoom: 0,
        maxzoom: 18,
      }));
    });
  });

  describe('Source Generation', () => {
    it('should generate correct vector source configuration', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      new VectorTileService('test-source', mockMap, options);

      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.objectContaining({
        type: 'vector',
        tiles: ['https://example.com/VectorTileServer/tile/{z}/{y}/{x}.pbf'],
      }));
    });

    it('should use metadata tile URL when available', async () => {
      const mockMetadata = {
        tiles: ['/custom/tile/{z}/{y}/{x}.pbf'],
        name: 'Custom Vector Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      
      // Wait for metadata to load
      await service.getMetadata();

      // Check that _tileUrl uses metadata
      expect(service._tileUrl).toBe('/custom/tile/{z}/{y}/{x}.pbf');
    });

    it('should use default tile URL when metadata is not available', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      // Before metadata is loaded
      expect(service._tileUrl).toBe('/tile/{z}/{y}/{x}.pbf');
    });
  });

  describe('Service Metadata', () => {
    it('should fetch and return service metadata', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
        description: 'A test vector tile service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      const metadata = await service.getMetadata();

      expect(metadata).toEqual(mockMetadata);
      expect(mockGetServiceDetails).toHaveBeenCalledWith(
        'https://example.com/VectorTileServer',
        undefined
      );
    });

    it('should handle metadata fetch errors', async () => {
      const error = new Error('Service unavailable');
      mockGetServiceDetails.mockRejectedValue(error);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      await expect(service.getMetadata()).rejects.toThrow('Service unavailable');
    });

    it('should return cached metadata on subsequent calls', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      
      // First call
      const metadata1 = await service.getMetadata();
      // Second call
      const metadata2 = await service.getMetadata();

      expect(metadata1).toEqual(mockMetadata);
      expect(metadata2).toEqual(mockMetadata);
      // Should only call getServiceDetails once
      expect(mockGetServiceDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('Source Management', () => {
    it('should remove source from map', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      service.remove();

      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });

    it('should have update method that does nothing', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      
      // Should not throw error
      expect(() => service.update()).not.toThrow();
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should support Esri vector basemap service pattern', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer',
      };

      new VectorTileService('basemap-source', mockMap, options);

      expect(mockMap.addSource).toHaveBeenCalledWith('basemap-source', expect.objectContaining({
        type: 'vector',
        tiles: expect.arrayContaining([expect.stringContaining('World_Basemap_v2')])
      }));
    });

    it('should support custom vector tile services with options', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://custom.example.com/VectorTileServer',
        getAttributionFromService: false,
      };

      const vectorOptions: VectorSourceOptions = {
        attribution: 'Custom Data Provider',
        minzoom: 2,
        maxzoom: 16,
      };

      new VectorTileService('custom-source', mockMap, options, vectorOptions);

      expect(mockMap.addSource).toHaveBeenCalledWith('custom-source', expect.objectContaining({
        attribution: 'Custom Data Provider',
        minzoom: 2,
        maxzoom: 16,
      }));
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL with trailing slash', () => {
      mockCleanTrailingSlash.mockReturnValue('https://example.com/VectorTileServer');

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer/',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      expect(mockCleanTrailingSlash).toHaveBeenCalledWith('https://example.com/VectorTileServer/');
      expect(service.options.url).toBe('https://example.com/VectorTileServer');
    });

    it('should handle missing tiles in metadata gracefully', async () => {
      const mockMetadata = {
        name: 'Test Service',
        // No tiles property
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getMetadata();

      // Should fall back to default tile URL
      expect(service._tileUrl).toBe('/tile/{z}/{y}/{x}.pbf');
    });
  });
});