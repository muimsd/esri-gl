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

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'vector',
          attribution: 'Custom Attribution',
          minzoom: 0,
          maxzoom: 18,
        })
      );
    });
  });

  describe('Source Generation', () => {
    it('should generate correct vector source configuration', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      new VectorTileService('test-source', mockMap, options);

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'vector',
          tiles: ['https://example.com/VectorTileServer/tile/{z}/{y}/{x}.pbf'],
        })
      );
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

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'basemap-source',
        expect.objectContaining({
          type: 'vector',
          tiles: expect.arrayContaining([expect.stringContaining('World_Basemap_v2')]),
        })
      );
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

      expect(mockMap.addSource).toHaveBeenCalledWith(
        'custom-source',
        expect.objectContaining({
          attribution: 'Custom Data Provider',
          minzoom: 2,
          maxzoom: 16,
        })
      );
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

  describe('Style Management', () => {
    beforeEach(() => {
      // Mock fetch for style requests
      global.fetch = jest.fn();
    });

    it('should get default style URL when no metadata is loaded', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      expect(service._styleUrl).toBe('resources/styles/root.json');
    });

    it('should use custom defaultStyles from metadata', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        defaultStyles: 'custom/styles/style.json',
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getMetadata();

      expect(service._styleUrl).toBe('custom/styles/style.json');
    });

    it('should fetch and parse style data successfully', async () => {
      const mockStyleData = {
        layers: [
          {
            type: 'fill',
            'source-layer': 'polygons',
            layout: { visibility: 'visible' },
            paint: { 'fill-color': '#ff0000' },
          },
        ],
      };

      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        defaultStyles: 'resources/styles/root.json',
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStyleData),
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      const style = await service.getStyle();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/VectorTileServer/resources/styles/root.json',
        undefined
      );

      expect(style).toEqual({
        type: 'fill',
        source: 'test-source',
        'source-layer': 'polygons',
        layout: { visibility: 'visible' },
        paint: { 'fill-color': '#ff0000' },
      });
    });

    it('should return cached style on subsequent calls', async () => {
      const mockStyleData = {
        layers: [
          {
            type: 'line',
            'source-layer': 'roads',
            layout: {},
            paint: { 'line-color': '#0000ff' },
          },
        ],
      };

      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStyleData),
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      // First call
      const style1 = await service.getStyle();
      // Second call
      const style2 = await service.getStyle();

      expect(style1).toEqual(style2);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Should only fetch once
    });

    it('should handle style fetch HTTP errors', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      await expect(service.getStyle()).rejects.toThrow('Failed to fetch style: 404');
    });

    it('should handle style fetch network errors', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      await expect(service.getStyle()).rejects.toThrow('Network error');
    });

    it('should handle malformed style data', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            /* no layers property */
          }),
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      await expect(service.getStyle()).rejects.toThrow(
        'VectorTile style document is missing layers.'
      );
    });

    it('should handle empty layers array in style data', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ layers: [] }),
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      await expect(service.getStyle()).rejects.toThrow(
        'VectorTile style document is missing layers.'
      );
    });

    it('should use fetchOptions for style requests', async () => {
      const mockStyleData = {
        layers: [
          {
            type: 'symbol',
            'source-layer': 'labels',
            layout: { 'text-field': '{name}' },
            paint: {},
          },
        ],
      };

      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStyleData),
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getStyle();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/VectorTileServer/resources/styles/root.json',
        undefined
      );
    });

    it('should provide defaultStyle getter after style is loaded', async () => {
      const mockStyleData = {
        layers: [
          {
            type: 'circle',
            'source-layer': 'points',
            layout: {},
            paint: { 'circle-radius': 5 },
          },
        ],
      };

      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStyleData),
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getStyle();

      const defaultStyle = service.defaultStyle;

      expect(defaultStyle).toEqual({
        type: 'circle',
        source: 'test-source',
        'source-layer': 'points',
        layout: {},
        paint: { 'circle-radius': 5 },
      });
    });

    it('should handle metadata errors during style fetch', async () => {
      const error = new Error('Metadata service error');
      mockGetServiceDetails.mockRejectedValue(error);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      await expect(service.getStyle()).rejects.toThrow('Metadata service error');
    });
  });

  describe('Source Configuration', () => {
    it('should provide source configuration getter', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      const source = service._source;

      expect(source).toEqual({
        type: 'vector',
        tiles: ['https://example.com/VectorTileServer/tile/{z}/{y}/{x}.pbf'],
      });
    });

    it('should merge vector options into source configuration', () => {
      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const vectorOptions: VectorSourceOptions = {
        attribution: 'Custom Attribution',
        minzoom: 3,
        maxzoom: 15,
      };

      const service = new VectorTileService('test-source', mockMap, options, vectorOptions);
      const source = service._source;

      expect(source).toEqual({
        type: 'vector',
        tiles: ['https://example.com/VectorTileServer/tile/{z}/{y}/{x}.pbf'],
        attribution: 'Custom Attribution',
        minzoom: 3,
        maxzoom: 15,
      });
    });

    it('should update source tiles based on metadata', async () => {
      const mockMetadata = {
        tiles: ['/custom/path/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getMetadata();

      const source = service._source;

      expect(source.tiles).toEqual([
        'https://example.com/VectorTileServer/custom/path/{z}/{y}/{x}.pbf',
      ]);
    });
  });

  describe('fetchOptions Integration', () => {
    it('should pass fetchOptions to getServiceDetails for metadata', async () => {
      const fetchOptions = {
        headers: { 'X-API-Key': 'secret123' },
        timeout: 5000,
      };

      const options = {
        url: 'https://example.com/VectorTileServer',
        fetchOptions,
      } as VectorTileServiceOptions & { fetchOptions: RequestInit };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getMetadata();

      expect(mockGetServiceDetails).toHaveBeenCalledWith(
        'https://example.com/VectorTileServer',
        fetchOptions
      );
    });
  });

  describe('Complex Metadata Scenarios', () => {
    it('should handle multiple tile URLs in metadata', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf', '/fallback/tile/{z}/{y}/{x}.pbf'],
        name: 'Multi-URL Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getMetadata();

      // Should use first tile URL
      expect(service._tileUrl).toBe('/tile/{z}/{y}/{x}.pbf');
    });

    it('should handle metadata with undefined defaultStyles', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
        defaultStyles: undefined,
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getMetadata();

      // Should fall back to default style URL
      expect(service._styleUrl).toBe('resources/styles/root.json');
    });

    it('should handle metadata with empty string defaultStyles', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
        defaultStyles: '',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);
      await service.getMetadata();

      // Should fall back to default style URL
      expect(service._styleUrl).toBe('resources/styles/root.json');
    });
  });

  describe('Error Recovery', () => {
    it('should handle partial service failures gracefully', async () => {
      // Metadata succeeds but style fails
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Style fetch failed'));

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      // Metadata should work
      const metadata = await service.getMetadata();
      expect(metadata).toEqual(mockMetadata);

      // Style should fail
      await expect(service.getStyle()).rejects.toThrow('Style fetch failed');
    });

    it('should handle JSON parse errors in style response', async () => {
      const mockMetadata = {
        tiles: ['/tile/{z}/{y}/{x}.pbf'],
        name: 'Test Service',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const options: VectorTileServiceOptions = {
        url: 'https://example.com/VectorTileServer',
      };

      const service = new VectorTileService('test-source', mockMap, options);

      await expect(service.getStyle()).rejects.toThrow('Invalid JSON');
    });
  });
});
