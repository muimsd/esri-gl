import { MapService, mapService } from '@/Services/SimpleMapService';
import { Service } from '@/Services/Service';
import { IdentifyFeatures } from '@/Tasks/IdentifyFeatures';
import { Query } from '@/Tasks/Query';
import { Find } from '@/Tasks/Find';

// Mock the dependencies
jest.mock('@/Services/Service');
jest.mock('@/Tasks/IdentifyFeatures');
jest.mock('@/Tasks/Query'); 
jest.mock('@/Tasks/Find');

describe('SimpleMapService', () => {
  let mapServiceInstance: MapService;
  const mockOptions = {
    url: 'https://example.com/arcgis/rest/services/TestService/MapServer'
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
  });

  describe('query', () => {
    it('should return Query instance', () => {
      const result = mapServiceInstance.query();
      
      expect(Query).toHaveBeenCalledWith(mapServiceInstance);
      expect(result).toBeInstanceOf(Query);
    });
  });

  describe('find', () => {
    it('should return Find instance', () => {
      const result = mapServiceInstance.find();
      
      expect(Find).toHaveBeenCalledWith(mapServiceInstance);
      expect(result).toBeInstanceOf(Find);
    });
  });

  describe('export', () => {
    it('should call request method with export path and params', async () => {
      const mockParams = { 
        bbox: '-180,-90,180,90',
        format: 'png'
      };
      const mockResponse = { href: 'https://example.com/export.png' };
      
      const requestSpy = jest.spyOn(mapServiceInstance, 'request');
      requestSpy.mockResolvedValue(mockResponse);
      
      const result = await mapServiceInstance.export(mockParams);
      
      expect(requestSpy).toHaveBeenCalledWith('export', mockParams);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('mapService factory function', () => {
    it('should create MapService instance', () => {
      const options = { url: 'https://example.com/MapServer' };
      const result = mapService(options);
      
      expect(result).toBeInstanceOf(MapService);
      expect(Service).toHaveBeenCalledWith(options);
    });
  });
});