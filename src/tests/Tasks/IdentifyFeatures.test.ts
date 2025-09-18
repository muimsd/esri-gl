import { IdentifyFeatures } from '@/Tasks/IdentifyFeatures';
import { Service } from '@/Services/Service';
import type { Map } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Type assertion helpers for protected properties
type IdentifyFeaturesInternal = {
  options: { url: string };
  params: Record<string, unknown>;
};

function getInternal(identify: IdentifyFeatures): IdentifyFeaturesInternal {
  return identify as unknown as IdentifyFeaturesInternal;
}

// Mock map interface for testing
const mockMap = {
  getBounds: jest.fn(() => ({
    toArray: jest.fn(() => [[-180, -90], [180, 90]]),
    getWest: jest.fn(() => -180),
    getEast: jest.fn(() => 180),
  })),
  getCanvas: jest.fn(() => ({
    width: 800,
    height: 600,
  })),
  getSize: jest.fn(() => ({ x: 800, y: 600 })),
} as unknown as Map;

describe('IdentifyFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with URL string', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      expect(identify).toBeInstanceOf(IdentifyFeatures);
      expect(getInternal(identify).options.url).toBe('https://example.com/MapServer');
    });

    it('should create instance with options object', () => {
      const options = {
        url: 'https://example.com/MapServer',
        tolerance: 5,
        returnGeometry: false,
      };
      
      const identify = new IdentifyFeatures(options);
      expect(identify).toBeInstanceOf(IdentifyFeatures);
      expect(getInternal(identify).options.url).toBe(options.url);
    });

    it('should create instance with Service object', () => {
      // Create a mock service instance that properly implements the interface
      const mockService = new Service({ url: 'https://example.com/MapServer' });
      
      const identify = new IdentifyFeatures(mockService);
      expect(identify).toBeInstanceOf(IdentifyFeatures);
      expect(getInternal(identify).options.url).toBe('https://example.com/MapServer');
    });

    it('should have default parameters', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      const params = getInternal(identify).params;
      
      expect(params.sr).toBe(4326);
      expect(params.layers).toBe('all');
      expect(params.tolerance).toBe(3);
      expect(params.returnGeometry).toBe(true);
      expect(params.f).toBe('json');
    });
  });

  describe('Chainable Methods', () => {
    let identify: IdentifyFeatures;

    beforeEach(() => {
      identify = new IdentifyFeatures('https://example.com/MapServer');
    });

    it('should set point location with lng/lat object', () => {
      const point = { lng: -95.7, lat: 37.1 };
      const result = identify.at(point);
      
      expect(result).toBe(identify); // chainable
      expect(getInternal(identify).params.geometryType).toBe('esriGeometryPoint');
      
      const geometry = JSON.parse(getInternal(identify).params.geometry as string);
      expect(geometry.x).toBe(point.lng);
      expect(geometry.y).toBe(point.lat);
      expect(geometry.spatialReference.wkid).toBe(4326);
    });

    it('should set point location with coordinate array', () => {
      const point: [number, number] = [-95.7, 37.1];
      const result = identify.at(point);
      
      expect(result).toBe(identify);
      
      const geometry = JSON.parse(getInternal(identify).params.geometry as string);
      expect(geometry.x).toBe(point[0]);
      expect(geometry.y).toBe(point[1]);
      expect(geometry.spatialReference.wkid).toBe(4326);
    });

    it('should set layers parameter with number', () => {
      const result = identify.layers(5);
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.layers).toBe(5);
    });

    it('should set layers parameter with array', () => {
      const layerArray = [0, 1, 2];
      const result = identify.layers(layerArray);
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.layers).toEqual(layerArray);
    });

    it('should set layers parameter with string', () => {
      const layerString = 'visible:0,1,2';
      const result = identify.layers(layerString);
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.layers).toBe(layerString);
    });

    it('should set tolerance', () => {
      const result = identify.tolerance(10);
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.tolerance).toBe(10);
    });

    it('should set returnGeometry', () => {
      const result = identify.returnGeometry(false);
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.returnGeometry).toBe(false);
    });

    it('should set geometry precision', () => {
      const result = identify.precision(5);
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.geometryPrecision).toBe(5);
    });

    it('should set map extent and image display with on() method', () => {
      const result = identify.on(mockMap);
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.mapExtent).toBe('-180,-90,180,90');
      expect(getInternal(identify).params.imageDisplay).toBe('800,600,96');
      expect(mockMap.getBounds).toHaveBeenCalled();
      expect(mockMap.getCanvas).toHaveBeenCalled();
    });

    it('should handle map getBounds error gracefully', () => {
      const errorMap = {
        getBounds: jest.fn(() => { throw new Error('Bounds error'); }),
        getCanvas: jest.fn(() => ({ width: 800, height: 600 })),
      } as unknown as Map;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = identify.on(errorMap);
      
      expect(result).toBe(identify);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not extract map extent and display info:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should set single layer definition', () => {
      const result = identify.layerDef(0, "STATE_NAME='California'");
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.layerDefs).toBe("0:STATE_NAME='California'");
    });

    it('should append multiple layer definitions', () => {
      identify.layerDef(0, "STATE_NAME='California'");
      const result = identify.layerDef(1, "POP2000>100000");
      
      expect(result).toBe(identify);
      expect(getInternal(identify).params.layerDefs).toBe("0:STATE_NAME='California';1:POP2000>100000");
    });

    it('should set maxAllowableOffset with simplify method', () => {
      const simplifyMap = {
        getBounds: () => ({
          getWest: () => -100,
          getEast: () => -90,
        }),
        getSize: () => ({ x: 1000, y: 600 }),
      };

      const result = identify.simplify(simplifyMap, 2);
      
      expect(result).toBe(identify);
      // mapWidth = 10, factor = 2, mapSize.x = 1000
      // maxAllowableOffset = (10 / 1000) * 2 = 0.02
      expect(getInternal(identify).params.maxAllowableOffset).toBe(0.02);
    });
  });

  describe('Method Chaining Integration', () => {
    it('should chain multiple methods together', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      
      const result = identify
        .at({ lng: -95.7, lat: 37.1 })
        .layers([0, 1, 2])
        .tolerance(5)
        .returnGeometry(true)
        .precision(3)
        .on(mockMap)
        .layerDef(0, "POP2000>50000");

      expect(result).toBe(identify);
      
      const params = getInternal(identify).params;
      expect(params.tolerance).toBe(5);
      expect(params.layers).toEqual([0, 1, 2]);
      expect(params.returnGeometry).toBe(true);
      expect(params.geometryPrecision).toBe(3);
      expect(params.mapExtent).toBe('-180,-90,180,90');
      expect(params.layerDefs).toBe('0:POP2000>50000');
    });
  });

  describe('run() method', () => {
    let identify: IdentifyFeatures;

    beforeEach(() => {
      identify = new IdentifyFeatures('https://example.com/MapServer');
    });

    it('should execute identify request and convert to GeoJSON', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'Cities',
            value: 'San Francisco',
            displayFieldName: 'CITY_NAME',
            attributes: {
              CITY_NAME: 'San Francisco',
              STATE_NAME: 'California',
              POP2000: 776733,
            },
            geometry: {
              x: -122.4194,
              y: 37.7749,
              spatialReference: { wkid: 4326 }
            }
          },
          {
            layerId: 1,
            layerName: 'Counties',
            value: 'San Francisco County',
            displayFieldName: 'COUNTY_NAME',
            attributes: {
              COUNTY_NAME: 'San Francisco County',
              STATE_NAME: 'California',
            },
            geometry: null
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(2);

      // Check first feature
      const feature1 = result.features[0];
      expect(feature1.type).toBe('Feature');
      expect(feature1.properties).toEqual({
        CITY_NAME: 'San Francisco',
        STATE_NAME: 'California',
        POP2000: 776733,
        layerId: 0,
        layerName: 'Cities',
        displayFieldName: 'CITY_NAME',
        value: 'San Francisco',
      });
      expect(feature1.geometry).toEqual(mockResponse.results[0].geometry);
      expect((feature1 as unknown as { layerId: number }).layerId).toBe(0);

      // Check second feature (null geometry)
      const feature2 = result.features[1];
      expect(feature2.geometry).toBeNull();
      expect(feature2.properties).toEqual({
        COUNTY_NAME: 'San Francisco County',
        STATE_NAME: 'California',
        layerId: 1,
        layerName: 'Counties',
        displayFieldName: 'COUNTY_NAME',
        value: 'San Francisco County',
      });
    });

    it('should handle empty results', async () => {
      const mockResponse = { results: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle missing results property', async () => {
      const mockResponse = {}; // No results property

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        identify.at({ lng: -122.4194, lat: 37.7749 }).run()
      ).rejects.toThrow('Network error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'IdentifyFeatures error:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Service not found' }),
      } as Response);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        identify.at({ lng: -122.4194, lat: 37.7749 }).run()
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'IdentifyFeatures error:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should make request with correct parameters', async () => {
      const mockResponse = { results: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .layers('visible:0,1,2')
        .tolerance(5)
        .on(mockMap)
        .run();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/MapServer/identify')
      );

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('f=json');
      expect(callUrl).toContain('tolerance=5');
      expect(callUrl).toContain('layers=visible%3A0%2C1%2C2');
      expect(callUrl).toContain('geometryType=esriGeometryPoint');
      expect(callUrl).toContain('mapExtent=-180%2C-90%2C180%2C90');
      expect(callUrl).toContain('imageDisplay=800%2C600%2C96');
    });
  });

  describe('Parameter Building', () => {
    it('should build complex parameter combinations correctly', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      
      identify
        .at([-95.7129, 37.0902])
        .layers([0, 1, 2])
        .tolerance(10)
        .returnGeometry(false)
        .precision(2)
        .layerDef(0, "STATE_NAME='Texas'")
        .layerDef(1, "POP2000>100000");

      const params = getInternal(identify).params;
      
      expect(params.layers).toEqual([0, 1, 2]);
      expect(params.tolerance).toBe(10);
      expect(params.returnGeometry).toBe(false);
      expect(params.geometryPrecision).toBe(2);
      expect(params.layerDefs).toBe("0:STATE_NAME='Texas';1:POP2000>100000");
      expect(params.geometryType).toBe('esriGeometryPoint');
      expect(JSON.parse(params.geometry as string)).toEqual({
        x: -95.7129,
        y: 37.0902,
        spatialReference: { wkid: 4326 }
      });
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should support demo component usage pattern', async () => {
      const mockResponse = {
        results: [{
          layerId: 0,
          layerName: 'Cities',
          value: 'Los Angeles',
          displayFieldName: 'CITY_NAME',
          attributes: {
            CITY_NAME: 'Los Angeles',
            STATE_NAME: 'California',
            POP2000: 3694820
          },
          geometry: {
            x: -118.2437,
            y: 34.0522,
            spatialReference: { wkid: 4326 }
          }
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const url = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
      const identify = new IdentifyFeatures(url);
      
      // Simulate demo usage pattern
      const fc = await identify
        .at({ lng: -118.2437, lat: 34.0522 })
        .on(mockMap)
        .layers('visible:0,1,2')
        .tolerance(5)
        .run();

      expect(fc.features).toHaveLength(1);
      expect(fc.features[0].properties?.CITY_NAME).toBe('Los Angeles');
    });
  });

  describe('Edge Cases', () => {
    it('should handle point at coordinate boundaries', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      
      // Test extreme coordinates
      identify.at({ lng: -180, lat: 85 });
      
      const geometry = JSON.parse(getInternal(identify).params.geometry as string);
      expect(geometry.x).toBe(-180);
      expect(geometry.y).toBe(85);
    });

    it('should handle zero tolerance', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      identify.tolerance(0);
      
      expect(getInternal(identify).params.tolerance).toBe(0);
    });

    it('should handle empty layer array', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      identify.layers([]);
      
      expect(getInternal(identify).params.layers).toEqual([]);
    });

    it('should handle complex layer definition strings', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      identify.layerDef(0, "STATE_NAME='New York' AND POP2000>500000");
      
      expect(getInternal(identify).params.layerDefs).toBe("0:STATE_NAME='New York' AND POP2000>500000");
    });
  });
});

describe('IdentifyFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with URL string', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      expect(identify).toBeInstanceOf(IdentifyFeatures);
      expect((identify as unknown as { options: { url: string } }).options.url).toBe('https://example.com/MapServer');
    });

    it('should create instance with options object', () => {
      const options = {
        url: 'https://example.com/MapServer',
        tolerance: 5,
        returnGeometry: false,
      };
      
      const identify = new IdentifyFeatures(options);
      expect(identify).toBeInstanceOf(IdentifyFeatures);
      expect((identify as unknown as { options: { url: string } }).options.url).toBe(options.url);
    });

    it('should create instance with Service object', () => {
      const mockService = {
        options: { url: 'https://example.com/MapServer' }
      } as Service & { options: { url: string } };
      
      const identify = new IdentifyFeatures(mockService);
      expect(identify).toBeInstanceOf(IdentifyFeatures);
      expect((identify as unknown as { options: { url: string } }).options.url).toBe('https://example.com/MapServer');
    });

    it('should have default parameters', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      const params = (identify as unknown as { params: Record<string, unknown> }).params;
      
      expect(params.sr).toBe(4326);
      expect(params.layers).toBe('all');
      expect(params.tolerance).toBe(3);
      expect(params.returnGeometry).toBe(true);
      expect(params.f).toBe('json');
    });
  });

  describe('Chainable Methods', () => {
    let identify: IdentifyFeatures;

    beforeEach(() => {
      identify = new IdentifyFeatures('https://example.com/MapServer');
    });

    it('should set point location with lng/lat object', () => {
      const point = { lng: -95.7, lat: 37.1 };
      const result = identify.at(point);
      
      expect(result).toBe(identify); // chainable
      expect((identify as any).params.geometryType).toBe('esriGeometryPoint');
      
      const geometry = JSON.parse((identify as any).params.geometry);
      expect(geometry.x).toBe(point.lng);
      expect(geometry.y).toBe(point.lat);
      expect(geometry.spatialReference.wkid).toBe(4326);
    });

    it('should set point location with coordinate array', () => {
      const point: [number, number] = [-95.7, 37.1];
      const result = identify.at(point);
      
      expect(result).toBe(identify);
      
      const geometry = JSON.parse((identify as any).params.geometry);
      expect(geometry.x).toBe(point[0]);
      expect(geometry.y).toBe(point[1]);
      expect(geometry.spatialReference.wkid).toBe(4326);
    });

    it('should set layers parameter with number', () => {
      const result = identify.layers(5);
      
      expect(result).toBe(identify);
      expect((identify as any).params.layers).toBe(5);
    });

    it('should set layers parameter with array', () => {
      const layerArray = [0, 1, 2];
      const result = identify.layers(layerArray);
      
      expect(result).toBe(identify);
      expect((identify as any).params.layers).toEqual(layerArray);
    });

    it('should set layers parameter with string', () => {
      const layerString = 'visible:0,1,2';
      const result = identify.layers(layerString);
      
      expect(result).toBe(identify);
      expect((identify as any).params.layers).toBe(layerString);
    });

    it('should set tolerance', () => {
      const result = identify.tolerance(10);
      
      expect(result).toBe(identify);
      expect((identify as any).params.tolerance).toBe(10);
    });

    it('should set returnGeometry', () => {
      const result = identify.returnGeometry(false);
      
      expect(result).toBe(identify);
      expect((identify as any).params.returnGeometry).toBe(false);
    });

    it('should set geometry precision', () => {
      const result = identify.precision(5);
      
      expect(result).toBe(identify);
      expect((identify as any).params.geometryPrecision).toBe(5);
    });

    it('should set map extent and image display with on() method', () => {
      const result = identify.on(mockMap as Map);
      
      expect(result).toBe(identify);
      expect((identify as any).params.mapExtent).toBe('-180,-90,180,90');
      expect((identify as any).params.imageDisplay).toBe('800,600,96');
      expect(mockMap.getBounds).toHaveBeenCalled();
      expect(mockMap.getCanvas).toHaveBeenCalled();
    });

    it('should handle map getBounds error gracefully', () => {
      const errorMap = {
        getBounds: jest.fn(() => { throw new Error('Bounds error'); }),
        getCanvas: jest.fn(() => ({ width: 800, height: 600 })),
      } as unknown as Map;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = identify.on(errorMap as Map);
      
      expect(result).toBe(identify);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not extract map extent and display info:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should set single layer definition', () => {
      const result = identify.layerDef(0, "STATE_NAME='California'");
      
      expect(result).toBe(identify);
      expect((identify as any).params.layerDefs).toBe("0:STATE_NAME='California'");
    });

    it('should append multiple layer definitions', () => {
      identify.layerDef(0, "STATE_NAME='California'");
      const result = identify.layerDef(1, "POP2000>100000");
      
      expect(result).toBe(identify);
      expect((identify as any).params.layerDefs).toBe("0:STATE_NAME='California';1:POP2000>100000");
    });

    it('should set maxAllowableOffset with simplify method', () => {
      const simplifyMap = {
        getBounds: () => ({
          getWest: () => -100,
          getEast: () => -90,
        }),
        getSize: () => ({ x: 1000, y: 600 }),
      };

      const result = identify.simplify(simplifyMap, 2);
      
      expect(result).toBe(identify);
      // mapWidth = 10, factor = 2, mapSize.x = 1000
      // maxAllowableOffset = (10 / 1000) * 2 = 0.02
      expect((identify as any).params.maxAllowableOffset).toBe(0.02);
    });
  });

  describe('Method Chaining Integration', () => {
    it('should chain multiple methods together', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      
      const result = identify
        .at({ lng: -95.7, lat: 37.1 })
        .layers([0, 1, 2])
        .tolerance(5)
        .returnGeometry(true)
        .precision(3)
        .on(mockMap as Map)
        .layerDef(0, "POP2000>50000");

      expect(result).toBe(identify);
      
      const params = (identify as any).params;
      expect(params.tolerance).toBe(5);
      expect(params.layers).toEqual([0, 1, 2]);
      expect(params.returnGeometry).toBe(true);
      expect(params.geometryPrecision).toBe(3);
      expect(params.mapExtent).toBe('-180,-90,180,90');
      expect(params.layerDefs).toBe('0:POP2000>50000');
    });
  });

  describe('run() method', () => {
    let identify: IdentifyFeatures;

    beforeEach(() => {
      identify = new IdentifyFeatures('https://example.com/MapServer');
    });

    it('should execute identify request and convert to GeoJSON', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'Cities',
            value: 'San Francisco',
            displayFieldName: 'CITY_NAME',
            attributes: {
              CITY_NAME: 'San Francisco',
              STATE_NAME: 'California',
              POP2000: 776733,
            },
            geometry: {
              x: -122.4194,
              y: 37.7749,
              spatialReference: { wkid: 4326 }
            }
          },
          {
            layerId: 1,
            layerName: 'Counties',
            value: 'San Francisco County',
            displayFieldName: 'COUNTY_NAME',
            attributes: {
              COUNTY_NAME: 'San Francisco County',
              STATE_NAME: 'California',
            },
            geometry: null
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(2);

      // Check first feature
      const feature1 = result.features[0];
      expect(feature1.type).toBe('Feature');
      expect(feature1.properties).toEqual({
        CITY_NAME: 'San Francisco',
        STATE_NAME: 'California',
        POP2000: 776733,
        layerId: 0,
        layerName: 'Cities',
        displayFieldName: 'CITY_NAME',
        value: 'San Francisco',
      });
      expect(feature1.geometry).toEqual(mockResponse.results[0].geometry);
      expect((feature1 as any).layerId).toBe(0);

      // Check second feature (null geometry)
      const feature2 = result.features[1];
      expect(feature2.geometry).toBeNull();
      expect(feature2.properties).toEqual({
        COUNTY_NAME: 'San Francisco County',
        STATE_NAME: 'California',
        layerId: 1,
        layerName: 'Counties',
        displayFieldName: 'COUNTY_NAME',
        value: 'San Francisco County',
      });
    });

    it('should handle empty results', async () => {
      const mockResponse = { results: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle missing results property', async () => {
      const mockResponse = {}; // No results property

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        identify.at({ lng: -122.4194, lat: 37.7749 }).run()
      ).rejects.toThrow('Network error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'IdentifyFeatures error:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Service not found' }),
      } as Response);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        identify.at({ lng: -122.4194, lat: 37.7749 }).run()
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'IdentifyFeatures error:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should make request with correct parameters', async () => {
      const mockResponse = { results: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await identify
        .at({ lng: -122.4194, lat: 37.7749 })
        .layers('visible:0,1,2')
        .tolerance(5)
        .on(mockMap as Map)
        .run();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/MapServer/identify')
      );

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('f=json');
      expect(callUrl).toContain('tolerance=5');
      expect(callUrl).toContain('layers=visible%3A0%2C1%2C2');
      expect(callUrl).toContain('geometryType=esriGeometryPoint');
      expect(callUrl).toContain('mapExtent=-180%2C-90%2C180%2C90');
      expect(callUrl).toContain('imageDisplay=800%2C600%2C96');
    });
  });

  describe('Parameter Building', () => {
    it('should build complex parameter combinations correctly', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      
      identify
        .at([-95.7129, 37.0902])
        .layers([0, 1, 2])
        .tolerance(10)
        .returnGeometry(false)
        .precision(2)
        .layerDef(0, "STATE_NAME='Texas'")
        .layerDef(1, "POP2000>100000");

      const params = (identify as any).params;
      
      expect(params.layers).toEqual([0, 1, 2]);
      expect(params.tolerance).toBe(10);
      expect(params.returnGeometry).toBe(false);
      expect(params.geometryPrecision).toBe(2);
      expect(params.layerDefs).toBe("0:STATE_NAME='Texas';1:POP2000>100000");
      expect(params.geometryType).toBe('esriGeometryPoint');
      expect(JSON.parse(params.geometry)).toEqual({
        x: -95.7129,
        y: 37.0902,
        spatialReference: { wkid: 4326 }
      });
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should support demo component usage pattern', async () => {
      const mockResponse = {
        results: [{
          layerId: 0,
          layerName: 'Cities',
          value: 'Los Angeles',
          displayFieldName: 'CITY_NAME',
          attributes: {
            CITY_NAME: 'Los Angeles',
            STATE_NAME: 'California',
            POP2000: 3694820
          },
          geometry: {
            x: -118.2437,
            y: 34.0522,
            spatialReference: { wkid: 4326 }
          }
        }]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const url = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer';
      const identify = new IdentifyFeatures(url);
      
      // Simulate demo usage pattern
      const fc = await identify
        .at({ lng: -118.2437, lat: 34.0522 })
        .on(mockMap as Map)
        .layers('visible:0,1,2')
        .tolerance(5)
        .run();

      expect(fc.features).toHaveLength(1);
      expect(fc.features[0].properties?.CITY_NAME).toBe('Los Angeles');
    });
  });

  describe('Edge Cases', () => {
    it('should handle point at coordinate boundaries', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      
      // Test extreme coordinates
      identify.at({ lng: -180, lat: 85 });
      
      const geometry = JSON.parse((identify as any).params.geometry);
      expect(geometry.x).toBe(-180);
      expect(geometry.y).toBe(85);
    });

    it('should handle zero tolerance', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      identify.tolerance(0);
      
      expect((identify as any).params.tolerance).toBe(0);
    });

    it('should handle empty layer array', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      identify.layers([]);
      
      expect((identify as any).params.layers).toEqual([]);
    });

    it('should handle complex layer definition strings', () => {
      const identify = new IdentifyFeatures('https://example.com/MapServer');
      identify.layerDef(0, "STATE_NAME='New York' AND POP2000>500000");
      
      expect((identify as any).params.layerDefs).toBe("0:STATE_NAME='New York' AND POP2000>500000");
    });
  });
});