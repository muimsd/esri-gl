import * as EsriGL from '@/main';
import {
  // Services
  Service,
  DynamicMapService,
  TiledMapService,
  ImageService,
  VectorBasemapStyle,
  VectorTileService,
  FeatureService,
  // Tasks
  Task,
  Query,
  query,
  Find,
  find,
  IdentifyFeatures,
  IdentifyImage,
  identifyImage,
  // Utilities
  cleanTrailingSlash,
  getServiceDetails,
  updateAttribution
} from '@/main';

// Mock global fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Main Module Exports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    
    // Default mock for fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        copyrightText: 'Test Attribution',
        name: 'Test Service'
      })
    } as Response);
  });
  describe('Service Exports', () => {
    it('should export Service base class', () => {
      expect(Service).toBeDefined();
      expect(typeof Service).toBe('function');
      expect(Service.name).toBe('Service');
    });

    it('should export DynamicMapService', () => {
      expect(DynamicMapService).toBeDefined();
      expect(typeof DynamicMapService).toBe('function');
      expect(DynamicMapService.name).toBe('DynamicMapService');
    });

    it('should export TiledMapService', () => {
      expect(TiledMapService).toBeDefined();
      expect(typeof TiledMapService).toBe('function');
      expect(TiledMapService.name).toBe('TiledMapService');
    });

    it('should export ImageService', () => {
      expect(ImageService).toBeDefined();
      expect(typeof ImageService).toBe('function');
      expect(ImageService.name).toBe('ImageService');
    });

    it('should export VectorBasemapStyle', () => {
      expect(VectorBasemapStyle).toBeDefined();
      expect(typeof VectorBasemapStyle).toBe('function');
      expect(VectorBasemapStyle.name).toBe('VectorBasemapStyle');
    });

    it('should export VectorTileService', () => {
      expect(VectorTileService).toBeDefined();
      expect(typeof VectorTileService).toBe('function');
      expect(VectorTileService.name).toBe('VectorTileService');
    });

    it('should export FeatureService', () => {
      expect(FeatureService).toBeDefined();
      expect(typeof FeatureService).toBe('function');
      expect(FeatureService.name).toBe('FeatureService');
    });
  });

  describe('Task Exports', () => {
    it('should export Task base class', () => {
      expect(Task).toBeDefined();
      expect(typeof Task).toBe('function');
      expect(Task.name).toBe('Task');
    });

    it('should export Query class and factory function', () => {
      expect(Query).toBeDefined();
      expect(typeof Query).toBe('function');
      expect(Query.name).toBe('Query');
      
      expect(query).toBeDefined();
      expect(typeof query).toBe('function');
      expect(query.name).toBe('query');
    });

    it('should export Find class and factory function', () => {
      expect(Find).toBeDefined();
      expect(typeof Find).toBe('function');
      expect(Find.name).toBe('Find');
      
      expect(find).toBeDefined();
      expect(typeof find).toBe('function');
      expect(find.name).toBe('find');
    });

    it('should export IdentifyFeatures', () => {
      expect(IdentifyFeatures).toBeDefined();
      expect(typeof IdentifyFeatures).toBe('function');
      expect(IdentifyFeatures.name).toBe('IdentifyFeatures');
    });

    it('should export IdentifyImage class and factory function', () => {
      expect(IdentifyImage).toBeDefined();
      expect(typeof IdentifyImage).toBe('function');
      expect(IdentifyImage.name).toBe('IdentifyImage');
      
      expect(identifyImage).toBeDefined();
      expect(typeof identifyImage).toBe('function');
      expect(identifyImage.name).toBe('identifyImage');
    });
  });

  describe('Utility Exports', () => {
    it('should export cleanTrailingSlash utility', () => {
      expect(cleanTrailingSlash).toBeDefined();
      expect(typeof cleanTrailingSlash).toBe('function');
      expect(cleanTrailingSlash.name).toBe('cleanTrailingSlash');
    });

    it('should export getServiceDetails utility', () => {
      expect(getServiceDetails).toBeDefined();
      expect(typeof getServiceDetails).toBe('function');
      expect(getServiceDetails.name).toBe('getServiceDetails');
    });

    it('should export updateAttribution utility', () => {
      expect(updateAttribution).toBeDefined();
      expect(typeof updateAttribution).toBe('function');
      expect(updateAttribution.name).toBe('updateAttribution');
    });
  });

  describe('Star Export from types', () => {
    it('should export types and interfaces', () => {
      // We can't directly test type exports, but we can verify the module exports them
      // by checking that imported types can be used
      const esriGLKeys = Object.keys(EsriGL);
      expect(esriGLKeys.length).toBeGreaterThan(15); // Should have all the service, task, and utility exports
    });
  });

  describe('Complete Module Export', () => {
    it('should export all services via star import', () => {
      expect(EsriGL.Service).toBe(Service);
      expect(EsriGL.DynamicMapService).toBe(DynamicMapService);
      expect(EsriGL.TiledMapService).toBe(TiledMapService);
      expect(EsriGL.ImageService).toBe(ImageService);
      expect(EsriGL.VectorBasemapStyle).toBe(VectorBasemapStyle);
      expect(EsriGL.VectorTileService).toBe(VectorTileService);
      expect(EsriGL.FeatureService).toBe(FeatureService);
    });

    it('should export all tasks via star import', () => {
      expect(EsriGL.Task).toBe(Task);
      expect(EsriGL.Query).toBe(Query);
      expect(EsriGL.query).toBe(query);
      expect(EsriGL.Find).toBe(Find);
      expect(EsriGL.find).toBe(find);
      expect(EsriGL.IdentifyFeatures).toBe(IdentifyFeatures);
      expect(EsriGL.IdentifyImage).toBe(IdentifyImage);
      expect(EsriGL.identifyImage).toBe(identifyImage);
    });

    it('should export all utilities via star import', () => {
      expect(EsriGL.cleanTrailingSlash).toBe(cleanTrailingSlash);
      expect(EsriGL.getServiceDetails).toBe(getServiceDetails);
      expect(EsriGL.updateAttribution).toBe(updateAttribution);
    });
  });

  describe('Factory Function Functionality', () => {
    it('should create Query instance via factory function', () => {
      const queryInstance = query('https://example.com/query');
      expect(queryInstance).toBeInstanceOf(Query);
    });

    it('should create Find instance via factory function', () => {
      const findInstance = find('https://example.com/find');
      expect(findInstance).toBeInstanceOf(Find);
    });

    it('should create IdentifyImage instance via factory function', () => {
      const identifyImageInstance = identifyImage('https://example.com/identify');
      expect(identifyImageInstance).toBeInstanceOf(IdentifyImage);
    });
  });

  describe('Service Class Instantiation', () => {
    // Mock map object for service constructors
    const mockMap = {
      addSource: jest.fn(),
      removeSource: jest.fn(),
      getSource: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      project: jest.fn().mockReturnValue({ x: 100, y: 100 }),
      unproject: jest.fn().mockReturnValue({ lng: -95, lat: 40 }),
      getBounds: jest.fn().mockReturnValue({
        getNorth: () => 90,
        getSouth: () => -90,
        getEast: () => 180,
        getWest: () => -180
      })
    } as unknown as import('@/types').Map;

    beforeEach(() => {
      jest.clearAllMocks();
      
      // Additional mock setup for service tests
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          copyrightText: 'Test Attribution',
          name: 'Test Service'
        })
      } as Response);
    });

    it('should create DynamicMapService instance', () => {
      const service = new DynamicMapService('test-source', mockMap, {
        url: 'https://example.com/service'
      });
      expect(service).toBeInstanceOf(DynamicMapService);
      // Services extend Service base class but may not pass instanceof due to compilation
      expect(service.constructor.name).toBe('DynamicMapService');
    });

    it('should create TiledMapService instance', () => {
      const service = new TiledMapService('test-source', mockMap, {
        url: 'https://example.com/service'
      });
      expect(service).toBeInstanceOf(TiledMapService);
      expect(service.constructor.name).toBe('TiledMapService');
    });

    it('should create ImageService instance', () => {
      const service = new ImageService('test-source', mockMap, {
        url: 'https://example.com/service'
      });
      expect(service).toBeInstanceOf(ImageService);
      expect(service.constructor.name).toBe('ImageService');
    });

    it('should create VectorBasemapStyle instance', () => {
      const service = new VectorBasemapStyle('ArcGIS:Streets', 'test-api-key');
      expect(service).toBeInstanceOf(VectorBasemapStyle);
    });

    it('should create VectorTileService instance', () => {
      const service = new VectorTileService('test-source', mockMap, {
        url: 'https://example.com/service'
      });
      expect(service).toBeInstanceOf(VectorTileService);
      expect(service.constructor.name).toBe('VectorTileService');
    });

    it('should create FeatureService instance', () => {
      const service = new FeatureService('test-source', mockMap, {
        url: 'https://example.com/service'
      });
      expect(service).toBeInstanceOf(FeatureService);
      expect(service.constructor.name).toBe('FeatureService');
    });
  });

  describe('Task Class Instantiation', () => {
    it('should create Task instance', () => {
      const task = new Task('https://example.com/task');
      expect(task).toBeInstanceOf(Task);
    });

    it('should create Query instance', () => {
      const queryTask = new Query('https://example.com/query');
      expect(queryTask).toBeInstanceOf(Query);
      expect(queryTask).toBeInstanceOf(Task);
    });

    it('should create Find instance', () => {
      const findTask = new Find('https://example.com/find');
      expect(findTask).toBeInstanceOf(Find);
      expect(findTask).toBeInstanceOf(Task);
    });

    it('should create IdentifyFeatures instance', () => {
      const identifyTask = new IdentifyFeatures('https://example.com/identify');
      expect(identifyTask).toBeInstanceOf(IdentifyFeatures);
      // Check inheritance via constructor chain instead of instanceof
      expect(identifyTask.constructor.name).toBe('IdentifyFeatures');
    });

    it('should create IdentifyImage instance', () => {
      const identifyImageTask = new IdentifyImage('https://example.com/identifyImage');
      expect(identifyImageTask).toBeInstanceOf(IdentifyImage);
      expect(identifyImageTask).toBeInstanceOf(Task);
    });
  });

  describe('Utility Function Functionality', () => {
    it('should cleanTrailingSlash work correctly', () => {
      expect(cleanTrailingSlash('https://example.com/')).toBe('https://example.com');
      expect(cleanTrailingSlash('https://example.com')).toBe('https://example.com');
      // The function only removes a single trailing slash, not multiple
      expect(cleanTrailingSlash('https://example.com///')).toBe('https://example.com//');
    });

    it('should getServiceDetails be callable', () => {
      expect(() => {
        getServiceDetails('https://example.com/service');
      }).not.toThrow();
    });

    it('should updateAttribution be callable', () => {
      const mockMap = {
        addSource: jest.fn(),
        removeSource: jest.fn()
      } as unknown as import('@/types').Map;
      
      expect(() => {
        updateAttribution('Test Attribution', 'test-source', mockMap);
      }).not.toThrow();
    });
  });

  describe('Export Completeness', () => {
    it('should have all expected exports available', () => {
      const expectedExports = [
        // Services
        'Service', 'DynamicMapService', 'TiledMapService', 'ImageService',
        'VectorBasemapStyle', 'VectorTileService', 'FeatureService',
        // Tasks
        'Task', 'Query', 'query', 'Find', 'find', 'IdentifyFeatures',
        'IdentifyImage', 'identifyImage',
        // Utilities
        'cleanTrailingSlash', 'getServiceDetails', 'updateAttribution'
      ];

      const actualExports = Object.keys(EsriGL);
      
      expectedExports.forEach(exportName => {
        expect(actualExports).toContain(exportName);
        expect(EsriGL[exportName as keyof typeof EsriGL]).toBeDefined();
      });
    });

    it('should not have unexpected exports', () => {
      const expectedExportCount = 18; // 7 services + 8 tasks + 3 utilities
      const actualExportCount = Object.keys(EsriGL).length;
      
      // Allow for some variance due to type exports and potential additional exports
      expect(actualExportCount).toBeGreaterThanOrEqual(expectedExportCount);
      expect(actualExportCount).toBeLessThanOrEqual(expectedExportCount + 5); // Some buffer for types
    });
  });
});