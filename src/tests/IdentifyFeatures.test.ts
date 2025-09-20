import { IdentifyFeatures } from '@/IdentifyFeatures';
import type { IdentifyFeaturesOptions, GeometryInput } from '@/IdentifyFeatures';

// Mock utils
jest.mock('@/utils', () => ({
  cleanTrailingSlash: jest.fn((url: string) => url.replace(/\/$/, '')),
}));

describe('IdentifyFeatures', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    global.fetch = jest.fn();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create IdentifyFeatures instance with required options', () => {
      const options: IdentifyFeaturesOptions = {
        url: 'https://example.com/MapServer',
      };

      const service = new IdentifyFeatures(options);
      expect(service).toBeInstanceOf(IdentifyFeatures);
    });

    it('should throw error when url is not provided', () => {
      expect(() => {
        new IdentifyFeatures({} as IdentifyFeaturesOptions);
      }).toThrow('A url must be supplied for IdentifyFeatures service');
    });

    it('should clean trailing slash from URL', () => {
      const service = new IdentifyFeatures({
        url: 'https://example.com/MapServer/',
      });

      expect(service['_baseUrl']).toBe('https://example.com/MapServer');
    });

    it('should set default options', () => {
      const service = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });

      expect(service['_defaultOptions'].layers).toBe('all');
      expect(service['_defaultOptions'].tolerance).toBe(3);
      expect(service['_defaultOptions'].returnGeometry).toBe(false);
      expect(service['_defaultOptions'].sr).toBe(4326);
    });

    it('should merge custom options with defaults', () => {
      const options: IdentifyFeaturesOptions = {
        url: 'https://example.com/MapServer',
        tolerance: 5,
        returnGeometry: true,
        layers: [0, 1],
      };

      const service = new IdentifyFeatures(options);

      expect(service['_defaultOptions'].tolerance).toBe(5);
      expect(service['_defaultOptions'].returnGeometry).toBe(true);
      expect(service['_defaultOptions'].layers).toEqual([0, 1]);
    });
  });

  describe('at method', () => {
    let service: IdentifyFeatures;

    beforeEach(() => {
      service = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                layerId: 0,
                layerName: 'Test Layer',
                value: 'Test Value',
                displayFieldName: 'NAME',
                attributes: { NAME: 'Test Feature' },
              },
            ],
          }),
      } as Response);
    });

    it('should perform identify at point location', async () => {
      const point = { lng: -95, lat: 40 };
      const result = await service.at(point);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].layerName).toBe('Test Layer');
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/identify?'), undefined);
    });

    it('should extract map extent and display info when map is provided', async () => {
      const mockMap = {
        getBounds: jest.fn().mockReturnValue({
          toArray: jest.fn().mockReturnValue([
            [-100, 35],
            [-90, 45],
          ]),
        }),
        getCanvas: jest.fn().mockReturnValue({
          width: 800,
          height: 600,
        }),
      };

      const point = { lng: -95, lat: 40 };
      await service.at(point, mockMap);

      // Check that the URL contains mapExtent and imageDisplay parameters
      const callArgs = mockFetch.mock.calls[0][0] as string;
      expect(callArgs).toContain('mapExtent=-100%2C35%2C-90%2C45'); // URL encoded comma
      expect(callArgs).toContain('imageDisplay=800%2C600%2C96'); // URL encoded comma
    });

    it('should handle map without bounds or canvas gracefully', async () => {
      const mockMap = {
        getBounds: jest.fn().mockReturnValue(null),
        getCanvas: jest.fn().mockReturnValue(null),
      };

      const point = { lng: -95, lat: 40 };
      const result = await service.at(point, mockMap);

      expect(result.results).toHaveLength(1);
    });

    it('should handle map.getBounds errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockMap = {
        getBounds: jest.fn().mockImplementation(() => {
          throw new Error('Bounds error');
        }),
        getCanvas: jest.fn().mockReturnValue({ width: 800, height: 600 }),
      };

      const point = { lng: -95, lat: 40 };
      await service.at(point, mockMap);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not extract map extent and display info:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('identify method', () => {
    let service: IdentifyFeatures;

    beforeEach(() => {
      service = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });
    });

    it('should perform identify with custom geometry', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'Test Layer',
            value: 'Test Value',
            displayFieldName: 'NAME',
            attributes: { NAME: 'Test Feature' },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const geometry: GeometryInput = {
        x: -95,
        y: 40,
        spatialReference: { wkid: 4326 },
      };

      const result = await service.identify({
        geometry,
        geometryType: 'esriGeometryPoint',
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].layerName).toBe('Test Layer');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const geometry: GeometryInput = { x: -95, y: 40 };

      await expect(service.identify({ geometry })).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const geometry: GeometryInput = { x: -95, y: 40 };

      await expect(service.identify({ geometry })).rejects.toThrow('Network error');
    });

    it('should use custom fetchOptions', async () => {
      const customOptions: IdentifyFeaturesOptions = {
        url: 'https://example.com/MapServer',
        fetchOptions: {
          headers: { Authorization: 'Bearer token' },
        },
      };

      service = new IdentifyFeatures(customOptions);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      } as Response);

      const geometry: GeometryInput = { x: -95, y: 40 };
      await service.identify({ geometry });

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/identify?'), {
        headers: { Authorization: 'Bearer token' },
      });
    });
  });

  describe('chainable setter methods', () => {
    let service: IdentifyFeatures;

    beforeEach(() => {
      service = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });
    });

    it('should set layer definitions', () => {
      const layerDefs = { '0': 'STATE_NAME=California', '1': 'POP2000 > 100000' };
      const result = service.setLayerDefs(layerDefs);

      expect(result).toBe(service);
      expect(service['_defaultOptions'].layerDefs).toEqual(layerDefs);
    });

    it('should set layers with array', () => {
      const result = service.setLayers([0, 1, 2]);

      expect(result).toBe(service);
      expect(service['_defaultOptions'].layers).toEqual([0, 1, 2]);
    });

    it('should set layers with number', () => {
      const result = service.setLayers(5);

      expect(result).toBe(service);
      expect(service['_defaultOptions'].layers).toBe(5);
    });

    it('should set layers with string', () => {
      const result = service.setLayers('visible');

      expect(result).toBe(service);
      expect(service['_defaultOptions'].layers).toBe('visible');
    });

    it('should set tolerance', () => {
      const result = service.setTolerance(10);

      expect(result).toBe(service);
      expect(service['_defaultOptions'].tolerance).toBe(10);
    });

    it('should set return geometry', () => {
      const result = service.setReturnGeometry(true);

      expect(result).toBe(service);
      expect(service['_defaultOptions'].returnGeometry).toBe(true);
    });

    it('should set time with from and to', () => {
      const from = new Date('2020-01-01');
      const to = new Date('2020-12-31');
      const result = service.setTime(from, to);

      expect(result).toBe(service);
      expect(service['_defaultOptions'].time).toEqual([from, to]);
    });

    it('should set time with only from date', () => {
      const from = 1577836800000; // timestamp
      const result = service.setTime(from);

      expect(result).toBe(service);
      expect(service['_defaultOptions'].time).toEqual([from]);
    });
  });

  describe('_buildIdentifyParams method', () => {
    let service: IdentifyFeatures;

    beforeEach(() => {
      service = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
        tolerance: 5,
        returnGeometry: true,
      });
    });

    it('should build basic parameters', () => {
      const options = {
        geometry: { x: -95, y: 40 },
        geometryType: 'esriGeometryPoint',
      };

      const params = service['_buildIdentifyParams'](options);

      expect(params.get('f')).toBe('json');
      expect(params.get('geometry')).toBe(JSON.stringify(options.geometry));
      expect(params.get('geometryType')).toBe('esriGeometryPoint');
      expect(params.get('tolerance')).toBe('5');
      expect(params.get('returnGeometry')).toBe('true');
    });

    it('should handle layers parameter as array', () => {
      const options = {
        geometry: { x: -95, y: 40 },
        layers: [0, 1, 2],
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('layers')).toBe('visible:0,1,2');
    });

    it('should handle layers parameter as number', () => {
      const options = {
        geometry: { x: -95, y: 40 },
        layers: 5,
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('layers')).toBe('visible:5');
    });

    it('should handle layers parameter as "all"', () => {
      const options = {
        geometry: { x: -95, y: 40 },
      };

      // Set default layers to "all"
      service['_defaultOptions'].layers = 'all';
      const params = service['_buildIdentifyParams'](options);
      expect(params.get('layers')).toBe('all');
    });

    it('should add mapExtent when provided', () => {
      const options = {
        geometry: { x: -95, y: 40 },
        mapExtent: [-100, 35, -90, 45] as [number, number, number, number],
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('mapExtent')).toBe('-100,35,-90,45');
    });

    it('should add imageDisplay when provided', () => {
      const options = {
        geometry: { x: -95, y: 40 },
        imageDisplay: [800, 600, 96] as [number, number, number],
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('imageDisplay')).toBe('800,600,96');
    });

    it('should add layerDefs when set', () => {
      service.setLayerDefs({ '0': 'STATE_NAME=California' });

      const options = {
        geometry: { x: -95, y: 40 },
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('layerDefs')).toBe(JSON.stringify({ '0': 'STATE_NAME=California' }));
    });

    it('should add time parameters with Date objects', () => {
      const from = new Date('2020-01-01');
      const to = new Date('2020-12-31');
      service.setTime(from, to);

      const options = {
        geometry: { x: -95, y: 40 },
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('time')).toBe(`${from.valueOf()},${to.valueOf()}`);
    });

    it('should add time parameters with timestamps', () => {
      const from = 1577836800000;
      const to = 1609459200000;
      service.setTime(from, to);

      const options = {
        geometry: { x: -95, y: 40 },
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('time')).toBe('1577836800000,1609459200000');
    });

    it('should add optional parameters when set', () => {
      service = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
        maxAllowableOffset: 10,
        geometryPrecision: 3,
        dynamicLayers: [{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }],
      });

      const options = {
        geometry: { x: -95, y: 40 },
      };

      const params = service['_buildIdentifyParams'](options);
      expect(params.get('maxAllowableOffset')).toBe('10');
      expect(params.get('geometryPrecision')).toBe('3');
      expect(params.get('dynamicLayers')).toBe(
        JSON.stringify([{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }])
      );
    });
  });

  describe('_processResponse method', () => {
    let service: IdentifyFeatures;

    beforeEach(() => {
      service = new IdentifyFeatures({
        url: 'https://example.com/MapServer',
      });
    });

    it('should process valid response', () => {
      const mockData = {
        results: [
          {
            layerId: 0,
            layerName: 'Test Layer',
            value: 'Test Value',
            displayFieldName: 'NAME',
            attributes: { NAME: 'Feature 1' },
            geometry: { type: 'Point', coordinates: [-95, 40] },
            geometryType: 'esriGeometryPoint',
          },
          {
            layerId: 1,
            layerName: 'Another Layer',
            attributes: { ID: 123 },
            // Missing some optional fields
          },
        ],
      };

      const result = service['_processResponse'](mockData);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].layerId).toBe(0);
      expect(result.results[0].layerName).toBe('Test Layer');
      expect(result.results[0].value).toBe('Test Value');
      expect(result.results[0].displayFieldName).toBe('NAME');
      expect(result.results[0].attributes).toEqual({ NAME: 'Feature 1' });
      expect(result.results[0].geometry).toEqual({ type: 'Point', coordinates: [-95, 40] });

      // Check defaults for missing fields
      expect(result.results[1].layerId).toBe(1);
      expect(result.results[1].layerName).toBe('Another Layer');
      expect(result.results[1].value).toBe('');
      expect(result.results[1].displayFieldName).toBe('');
      expect(result.results[1].attributes).toEqual({ ID: 123 });
    });

    it('should handle null or undefined data', () => {
      let result = service['_processResponse'](null);
      expect(result.results).toEqual([]);

      result = service['_processResponse'](undefined);
      expect(result.results).toEqual([]);
    });

    it('should handle data without results', () => {
      const mockData = { message: 'No results found' };
      const result = service['_processResponse'](mockData);
      expect(result.results).toEqual([]);
    });

    it('should handle empty results array', () => {
      const mockData = { results: [] };
      const result = service['_processResponse'](mockData);
      expect(result.results).toEqual([]);
    });
  });
});
