import { ImageService } from '@/Services/ImageService';
import { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils';
import type { Map, ImageServiceOptions, RasterSourceOptions } from '@/types';

// Mock the utilities
jest.mock('@/utils', () => ({
  cleanTrailingSlash: jest.fn(),
  getServiceDetails: jest.fn(),
  updateAttribution: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
const mockCleanTrailingSlash = cleanTrailingSlash as jest.MockedFunction<typeof cleanTrailingSlash>;
const mockGetServiceDetails = getServiceDetails as jest.MockedFunction<typeof getServiceDetails>;
const mockUpdateAttribution = updateAttribution as jest.MockedFunction<typeof updateAttribution>;

describe('ImageService', () => {
  let mockMap: jest.Mocked<Map>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMap = {
      addSource: jest.fn(),
      removeSource: jest.fn(),
      getSource: jest.fn(),
      getCanvas: jest.fn(),
      getBounds: jest.fn(),
    } as unknown as jest.Mocked<Map>;

    // Default mock implementations
    mockCleanTrailingSlash.mockImplementation((url: string) => url.replace(/\/$/, ''));
    mockGetServiceDetails.mockResolvedValue({
      capabilities: 'Catalog,Image,Metadata',
      description: 'Test Image Service',
      copyrightText: 'Test Copyright',
      spatialReference: { wkid: 102100 },
    });
    mockUpdateAttribution.mockImplementation(() => {});

    // Mock canvas and bounds for identify method
    (mockMap.getCanvas as jest.Mock).mockReturnValue({ 
      width: 800, 
      height: 600 
    } as unknown as HTMLCanvasElement);
    
    (mockMap.getBounds as jest.Mock).mockReturnValue({
      toArray: () => [[-118.5, 34.0], [-118.0, 34.5]]
    } as unknown);
  });

  describe('Constructor', () => {
    it('should create ImageService instance with required options', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
      };

      const service = new ImageService('test-source', mockMap, options);

      expect(service).toBeInstanceOf(ImageService);
      expect(mockCleanTrailingSlash).toHaveBeenCalledWith(options.url);
      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.any(Object));
    });

    it('should throw error if url is not provided', () => {
      expect(() => {
        new ImageService('test-source', mockMap, {} as ImageServiceOptions);
      }).toThrow('A url must be supplied as part of the esriServiceOptions object.');
    });

    it('should set default options correctly', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
      };

      const service = new ImageService('test-source', mockMap, options);

      expect(service.options).toEqual({
        url: 'https://example.com/ImageServer',
        layers: false,
        layerDefs: false,
        format: 'jpgpng',
        dpi: 96,
        transparent: true,
        getAttributionFromService: true,
        time: false,
      });
    });

    it('should merge custom options with defaults', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        format: 'png',
        transparent: false,
        renderingRule: { rasterFunction: 'Stretch' },
      };

      const service = new ImageService('test-source', mockMap, options);

      expect(service.options.format).toBe('png');
      expect(service.options.transparent).toBe(false);
      expect(service.options.renderingRule).toEqual({ rasterFunction: 'Stretch' });
    });

    it('should create source with raster options', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
      };
      
      const rasterOptions: RasterSourceOptions = {
        tileSize: 512,
        attribution: 'Custom Attribution',
      };

      new ImageService('test-source', mockMap, options, rasterOptions);

      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.objectContaining({
        tileSize: 512,
        attribution: 'Custom Attribution',
      }));
    });

    it('should call getServiceDetails by default for attribution', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
      };

      new ImageService('test-source', mockMap, options);

      // Attribution is fetched asynchronously, so getServiceDetails should be called
      expect(mockGetServiceDetails).toHaveBeenCalled();
    });

    it('should skip attribution if getAttributionFromService is false', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      new ImageService('test-source', mockMap, options);

      expect(mockGetServiceDetails).not.toHaveBeenCalled();
    });
  });

  describe('Source Generation', () => {
    it('should generate correct raster source configuration', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
      };

      new ImageService('test-source', mockMap, options);

      const expectedSource = {
        type: 'raster',
        tiles: ['https://example.com/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&format=jpgpng&size=256%2C256&f=image'],
        tileSize: 256,
      };

      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expectedSource);
    });

    it('should include custom tileSize from raster options', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
      };
      
      const rasterOptions: RasterSourceOptions = {
        tileSize: 512,
      };

      new ImageService('test-source', mockMap, options, rasterOptions);

      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.objectContaining({
        tileSize: 512,
        tiles: expect.arrayContaining([expect.stringContaining('size=512%2C512')]),
      }));
    });

    it('should include mosaic rule when provided', () => {
      const mosaicRule = {
        mosaicMethod: 'esriMosaicNorthwest',
        ascending: true,
      };

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        mosaicRule,
      };

      new ImageService('test-source', mockMap, options);

      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.objectContaining({
        tiles: expect.arrayContaining([expect.stringContaining('mosaicRule=' + encodeURIComponent(JSON.stringify(mosaicRule)))]),
      }));
    });

    it('should include rendering rule when provided', () => {
      const renderingRule = {
        rasterFunction: 'Stretch',
        arguments: { StretchType: 0 },
      };

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        renderingRule,
      };

      new ImageService('test-source', mockMap, options);

      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.objectContaining({
        tiles: expect.arrayContaining([expect.stringContaining('renderingRule=' + encodeURIComponent(JSON.stringify(renderingRule)))]),
      }));
    });
  });

  describe('Service Metadata', () => {
    it('should fetch and return service metadata', async () => {
      const mockMetadata = {
        capabilities: 'Catalog,Image,Metadata',
        description: 'Test Service',
        copyrightText: 'Test Copyright',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false, // Skip auto-fetch in constructor
      };

      const service = new ImageService('test-source', mockMap, options);
      const metadata = await service.getMetadata();

      expect(metadata).toEqual(mockMetadata);
    });

    it('should handle service metadata fetch errors', async () => {
      const error = new Error('Service unavailable');
      mockGetServiceDetails.mockRejectedValue(error);

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);

      await expect(service.getMetadata()).rejects.toThrow('Service unavailable');
    });

    it('should return cached metadata on subsequent calls', async () => {
      const mockMetadata = {
        capabilities: 'Catalog,Image,Metadata',
        description: 'Test Service',
        copyrightText: 'Test Copyright',
      };

      mockGetServiceDetails.mockResolvedValue(mockMetadata);

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);
      
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

  describe('Identify Method', () => {
    beforeEach(() => {
      // Reset mocks for identify-specific tests
      mockFetch.mockClear();
    });

    it('should make identify request with correct parameters', async () => {
      const mockResponse = {
        results: [{
          value: '123.45',
          attributes: { 'Pixel Value': 123.45 }
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);
      const point = { lng: -118.2437, lat: 34.0522 };
      
      const result = await service.identify(point);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/ImageServer/identify'),
        undefined
      );

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('sr=4326');
      expect(callUrl).toContain('geometryType=esriGeometryPoint');
      expect(callUrl).toContain('returnGeometry=false');
      expect(callUrl).toContain('f=json');
      expect(callUrl).toContain(`geometry=${encodeURIComponent(JSON.stringify({
        x: point.lng,
        y: point.lat,
        spatialReference: { wkid: 4326 }
      }))}`);
      
      expect(result).toEqual(mockResponse);
    });

    it('should include returnGeometry parameter when requested', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);
      
      await service.identify({ lng: -118.2437, lat: 34.0522 }, true);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('returnGeometry=true');
    });

    it('should handle identify request errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);

      await expect(
        service.identify({ lng: -118.2437, lat: 34.0522 })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Source Management', () => {
    it('should update source when update() is called', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const mockSource = {
        tiles: ['old-tile-url'],
        setTiles: jest.fn(),
        _options: {},
      };

      mockMap.getSource.mockReturnValue(mockSource as unknown as any);

      const service = new ImageService('test-source', mockMap, options);
      service.update();

      expect(mockMap.getSource).toHaveBeenCalledWith('test-source');
      expect(mockSource.setTiles).toHaveBeenCalled();
    });

    it('should handle update when source does not support setTiles', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const mockSource = {
        tiles: ['old-tile-url'],
        _options: {},
      }; // No setTiles method

      // Mock the map style for fallback update path
      (mockMap as any).style = {
        sourceCaches: {
          'test-source': {
            clearTiles: jest.fn(),
            update: jest.fn(),
          }
        }
      };

      mockMap.getSource.mockReturnValue(mockSource as unknown as any);

      const service = new ImageService('test-source', mockMap, options);
      
      // Should not throw error
      expect(() => service.update()).not.toThrow();
    });

    it('should remove source from map', () => {
      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);
      service.remove();

      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should support NLCD Land Cover service pattern', () => {
      const options: ImageServiceOptions = {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer',
        format: 'png',
        transparent: true,
        getAttributionFromService: false,
      };

      new ImageService('nlcd-source', mockMap, options);

      expect(mockMap.addSource).toHaveBeenCalledWith('nlcd-source', expect.objectContaining({
        type: 'raster',
        tiles: expect.arrayContaining([expect.stringContaining('format=png')])
      }));
    });

    it('should support elevation service with rendering rules', () => {
      const renderingRule = {
        rasterFunction: 'Stretch',
        arguments: {
          StretchType: 0,
          Statistics: [[0, 255, 128, 50]]
        }
      };

      const options: ImageServiceOptions = {
        url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
        renderingRule,
        format: 'lerc',
        getAttributionFromService: false,
      };

      new ImageService('elevation-source', mockMap, options);

      expect(mockMap.addSource).toHaveBeenCalledWith('elevation-source', expect.objectContaining({
        tiles: expect.arrayContaining([
          expect.stringMatching(/renderingRule=.*Stretch/)
        ])
      }));
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL with trailing slash', () => {
      mockCleanTrailingSlash.mockReturnValue('https://example.com/ImageServer');

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer/',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);

      expect(mockCleanTrailingSlash).toHaveBeenCalledWith('https://example.com/ImageServer/');
      expect(service.options.url).toBe('https://example.com/ImageServer');
    });

    it('should handle extreme coordinate values in identify', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const options: ImageServiceOptions = {
        url: 'https://example.com/ImageServer',
        getAttributionFromService: false,
      };

      const service = new ImageService('test-source', mockMap, options);
      
      await service.identify({ lng: -180, lat: 85 });

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('x%22%3A-180');
      expect(callUrl).toContain('y%22%3A85');
    });
  });
});