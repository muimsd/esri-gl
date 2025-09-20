import { MapService, mapService } from '@/Services/MapService';
import { Service } from '@/Services/Service';
import { IdentifyFeatures } from '@/Tasks/IdentifyFeatures';
import { Query } from '@/Tasks/Query';
import { Find } from '@/Tasks/Find';

// Mock the dependencies
jest.mock('@/Services/Service');
jest.mock('@/Tasks/IdentifyFeatures');
jest.mock('@/Tasks/Query');
jest.mock('@/Tasks/Find');

describe('MapService', () => {
  let mapServiceInstance: MapService;
  const mockOptions = {
    url: 'https://example.com/arcgis/rest/services/TestService/MapServer',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mapServiceInstance = new MapService(mockOptions);
  });

  describe('constructor', () => {
    it('should extend Service class', () => {
      expect(mapServiceInstance).toBeInstanceOf(Service);
    });

    it('should call parent constructor with options', () => {
      expect(Service).toHaveBeenCalledWith(mockOptions);
    });
  });

  describe('identify', () => {
    it('should return IdentifyFeatures instance', () => {
      const result = mapServiceInstance.identify();

      expect(IdentifyFeatures).toHaveBeenCalledWith(mapServiceInstance);
      expect(result).toBeInstanceOf(IdentifyFeatures);
    });

    it('should create new instance each time', () => {
      mapServiceInstance.identify();
      mapServiceInstance.identify();

      expect(IdentifyFeatures).toHaveBeenCalledTimes(2);
      expect(IdentifyFeatures).toHaveBeenNthCalledWith(1, mapServiceInstance);
      expect(IdentifyFeatures).toHaveBeenNthCalledWith(2, mapServiceInstance);
    });
  });

  describe('query', () => {
    it('should return Query instance', () => {
      const result = mapServiceInstance.query();

      expect(Query).toHaveBeenCalledWith(mapServiceInstance);
      expect(result).toBeInstanceOf(Query);
    });

    it('should create new instance each time', () => {
      mapServiceInstance.query();
      mapServiceInstance.query();

      expect(Query).toHaveBeenCalledTimes(2);
      expect(Query).toHaveBeenNthCalledWith(1, mapServiceInstance);
      expect(Query).toHaveBeenNthCalledWith(2, mapServiceInstance);
    });
  });

  describe('find', () => {
    it('should return Find instance', () => {
      const result = mapServiceInstance.find();

      expect(Find).toHaveBeenCalledWith(mapServiceInstance);
      expect(result).toBeInstanceOf(Find);
    });

    it('should create new instance each time', () => {
      mapServiceInstance.find();
      mapServiceInstance.find();

      expect(Find).toHaveBeenCalledTimes(2);
      expect(Find).toHaveBeenNthCalledWith(1, mapServiceInstance);
      expect(Find).toHaveBeenNthCalledWith(2, mapServiceInstance);
    });
  });

  describe('export', () => {
    it('should call request method with export path and params', async () => {
      const mockParams = {
        bbox: '-180,-90,180,90',
        size: '400,400',
        format: 'png',
      };
      const mockResponse = { href: 'https://example.com/export.png' };

      // Mock the request method on the instance
      const requestSpy = jest.spyOn(mapServiceInstance, 'request');
      requestSpy.mockResolvedValue(mockResponse);

      const result = await mapServiceInstance.export(mockParams);

      expect(requestSpy).toHaveBeenCalledWith('export', mockParams);
      expect(result).toEqual(mockResponse);
    });

    it('should handle export request with no href', async () => {
      const mockParams = { bbox: '1,2,3,4' };
      const mockResponse = { success: true };

      const requestSpy = jest.spyOn(mapServiceInstance, 'request');
      requestSpy.mockResolvedValue(mockResponse);

      const result = await mapServiceInstance.export(mockParams);

      expect(result).toEqual(mockResponse);
    });

    it('should handle export request errors', async () => {
      const mockParams = { bbox: 'invalid' };
      const error = new Error('Export failed');

      const requestSpy = jest.spyOn(mapServiceInstance, 'request');
      requestSpy.mockRejectedValue(error);

      await expect(mapServiceInstance.export(mockParams)).rejects.toThrow('Export failed');
      expect(requestSpy).toHaveBeenCalledWith('export', mockParams);
    });
  });
});

describe('mapService factory function', () => {
  it('should create MapService instance', () => {
    const options = { url: 'https://example.com/MapServer' };
    const result = mapService(options);

    expect(result).toBeInstanceOf(MapService);
    expect(Service).toHaveBeenCalledWith(options);
  });

  it('should pass all options to MapService constructor', () => {
    const options = {
      url: 'https://example.com/MapServer',
      token: 'test-token',
      proxy: false,
      useCors: true,
    };

    mapService(options);

    expect(Service).toHaveBeenCalledWith(options);
  });
});
