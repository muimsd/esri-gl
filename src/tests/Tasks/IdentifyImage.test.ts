import { IdentifyImage } from '@/Tasks/IdentifyImage';
import { Task } from '@/Tasks/Task';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Type assertion helper for protected properties
type IdentifyImageInternal = {
  options: { url: string };
  params: Record<string, unknown>;
};

function getInternal(identifyImage: IdentifyImage): IdentifyImageInternal {
  return identifyImage as unknown as IdentifyImageInternal;
}

describe('IdentifyImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with URL string', () => {
      const identify = new IdentifyImage('https://example.com/ImageServer');
      expect(identify).toBeInstanceOf(IdentifyImage);
      expect(identify).toBeInstanceOf(Task);
      expect(getInternal(identify).options.url).toBe('https://example.com/ImageServer');
    });

    it('should create instance with options object', () => {
      const options = {
        url: 'https://example.com/ImageServer',
        returnGeometry: true,
        returnCatalogItems: true,
        sr: 3857,
      };

      const identify = new IdentifyImage(options);
      expect(identify).toBeInstanceOf(IdentifyImage);
      expect(getInternal(identify).options.url).toBe('https://example.com/ImageServer');

      const params = getInternal(identify).params;
      expect(params.returnGeometry).toBe(true);
      expect(params.returnCatalogItems).toBe(true);
      expect(params.sr).toBe(3857);
    });

    it('should have default parameters', () => {
      const identify = new IdentifyImage('https://example.com/ImageServer');
      const params = getInternal(identify).params;

      expect(params.sr).toBe(4326);
      expect(params.returnGeometry).toBe(false);
      expect(params.returnCatalogItems).toBe(false);
      expect(params.f).toBe('json');
    });

    it('should merge options into params correctly', () => {
      const options = {
        url: 'https://example.com/ImageServer',
        geometry: { x: 100, y: 200 },
        geometryType: 'esriGeometryPoint',
        mosaic: true,
        pixelSize: [30, 30] as [number, number],
        token: 'test-token',
      };

      const identify = new IdentifyImage(options);
      const params = getInternal(identify).params;

      expect(params.geometry).toEqual(options.geometry);
      expect(params.geometryType).toBe('esriGeometryPoint');
      expect(params.mosaic).toBe(true);
      expect(params.pixelSize).toEqual([30, 30]);
      expect(params.token).toBe('test-token');
    });
  });

  describe('Chainable Methods', () => {
    let identify: IdentifyImage;

    beforeEach(() => {
      identify = new IdentifyImage('https://example.com/ImageServer');
    });

    describe('at() method', () => {
      it('should set point location with lng/lat object', () => {
        const point = { lng: -118.2437, lat: 34.0522 };
        const result = identify.at(point);

        expect(result).toBe(identify); // chainable
        expect(getInternal(identify).params.geometryType).toBe('esriGeometryPoint');
        expect(getInternal(identify).params.sr).toBe(4326);

        const geometry = JSON.parse(getInternal(identify).params.geometry as string);
        expect(geometry.x).toBe(point.lng);
        expect(geometry.y).toBe(point.lat);
        expect(geometry.spatialReference.wkid).toBe(4326);
      });

      it('should set point location with coordinate array', () => {
        const point: [number, number] = [-118.2437, 34.0522];
        const result = identify.at(point);

        expect(result).toBe(identify);

        const geometry = JSON.parse(getInternal(identify).params.geometry as string);
        expect(geometry.x).toBe(point[0]);
        expect(geometry.y).toBe(point[1]);
        expect(geometry.spatialReference.wkid).toBe(4326);
      });
    });

    describe('geometry() method', () => {
      it('should set custom geometry with default type', () => {
        const customGeometry = { x: 100, y: 200, spatialReference: { wkid: 3857 } };
        const result = identify.geometry(customGeometry);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.geometry).toBe(JSON.stringify(customGeometry));
        expect(getInternal(identify).params.geometryType).toBe('esriGeometryPoint');
      });

      it('should set custom geometry with specific type', () => {
        const customGeometry = {
          rings: [
            [0, 0],
            [0, 100],
            [100, 100],
            [100, 0],
            [0, 0],
          ],
        };
        const result = identify.geometry(customGeometry, 'esriGeometryPolygon');

        expect(result).toBe(identify);
        expect(getInternal(identify).params.geometry).toBe(JSON.stringify(customGeometry));
        expect(getInternal(identify).params.geometryType).toBe('esriGeometryPolygon');
      });
    });

    describe('pixelSize() method', () => {
      it('should set pixel size with array format', () => {
        const size: [number, number] = [30, 30];
        const result = identify.pixelSize(size);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.pixelSize).toBe('30,30');
      });

      it('should set pixel size with object format', () => {
        const size = { x: 50, y: 25 };
        const result = identify.pixelSize(size);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.pixelSize).toBe('50,25');
      });
    });

    describe('returnGeometry() method', () => {
      it('should set returnGeometry to true', () => {
        const result = identify.returnGeometry(true);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.returnGeometry).toBe(true);
      });

      it('should set returnGeometry to false', () => {
        const result = identify.returnGeometry(false);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.returnGeometry).toBe(false);
      });
    });

    describe('returnCatalogItems() method', () => {
      it('should set returnCatalogItems to true', () => {
        const result = identify.returnCatalogItems(true);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.returnCatalogItems).toBe(true);
      });

      it('should set returnCatalogItems to false', () => {
        const result = identify.returnCatalogItems(false);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.returnCatalogItems).toBe(false);
      });
    });

    describe('mosaicRule() method', () => {
      it('should set mosaic rule', () => {
        const rule = { mosaicMethod: 'esriMosaicNorthwest', ascending: true };
        const result = identify.mosaicRule(rule);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.mosaicRule).toBe(JSON.stringify(rule));
      });
    });

    describe('renderingRule() method', () => {
      it('should set rendering rule', () => {
        const rule = { rasterFunction: 'Stretch', arguments: { StretchType: 0 } };
        const result = identify.renderingRule(rule);

        expect(result).toBe(identify);
        expect(getInternal(identify).params.renderingRule).toBe(JSON.stringify(rule));
      });
    });
  });

  describe('Method Chaining', () => {
    it('should chain multiple methods together', () => {
      const identify = new IdentifyImage('https://example.com/ImageServer');

      const result = identify
        .at({ lng: -118.2437, lat: 34.0522 })
        .pixelSize([30, 30])
        .returnGeometry(true)
        .returnCatalogItems(false);

      expect(result).toBe(identify);

      const params = getInternal(identify).params;
      expect(params.pixelSize).toBe('30,30');
      expect(params.returnGeometry).toBe(true);
      expect(params.returnCatalogItems).toBe(false);
      expect(params.geometryType).toBe('esriGeometryPoint');
    });
  });

  describe('run() method', () => {
    let identify: IdentifyImage;

    beforeEach(() => {
      identify = new IdentifyImage('https://example.com/ImageServer');
    });

    it('should execute identify and return structured results', async () => {
      const mockResponse = {
        results: [
          {
            objectId: 1,
            name: 'Pixel Value',
            value: '125.5',
            location: {
              x: -118.2437,
              y: 34.0522,
              spatialReference: { wkid: 4326 },
            },
            attributes: {
              'Pixel Value': 125.5,
              Band_1: 125.5,
            },
          },
        ],
        location: {
          x: -118.2437,
          y: 34.0522,
          spatialReference: { wkid: 4326 },
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify.at({ lng: -118.2437, lat: 34.0522 }).run();

      expect(result.results).toHaveLength(1);
      expect(result.results[0].value).toBe('125.5');
      expect(result.results[0].attributes).toEqual({
        'Pixel Value': 125.5,
        Band_1: 125.5,
      });
      expect(result.location).toEqual(mockResponse.location);
    });

    it('should handle simple value response format', async () => {
      const mockResponse = {
        value: '89.25',
        properties: {
          elevation: 89.25,
          source: 'DEM',
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify.at({ lng: -118.2437, lat: 34.0522 }).run();

      expect(result.results).toHaveLength(1);
      expect(result.results[0].value).toBe('89.25');
      expect(result.results[0].attributes).toEqual({
        elevation: 89.25,
        source: 'DEM',
      });
    });

    it('should handle values array response format', async () => {
      const mockResponse = {
        values: ['125.5', '89.25', '156.0'],
        properties: {
          bands: ['Red', 'Green', 'Blue'],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify.at({ lng: -118.2437, lat: 34.0522 }).run();

      expect(result.results).toHaveLength(1);
      expect(result.results[0].value).toBe('125.5'); // First value
      expect(result.results[0].attributes).toEqual({
        bands: ['Red', 'Green', 'Blue'],
      });
    });

    it('should handle empty results', async () => {
      const mockResponse = {};

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await identify.at({ lng: -118.2437, lat: 34.0522 }).run();

      expect(result.results).toHaveLength(0);
      expect(result.location).toBeUndefined();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(identify.at({ lng: -118.2437, lat: 34.0522 }).run()).rejects.toThrow(
        'Network error'
      );
    });

    it('should make request with correct parameters', async () => {
      const mockResponse = { results: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await identify
        .at({ lng: -118.2437, lat: 34.0522 })
        .pixelSize([30, 30])
        .returnGeometry(true)
        .run();

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/ImageServer/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.stringContaining('f=json'),
      });

      const callBody = mockFetch.mock.calls[0][1]?.body as string;
      expect(callBody).toContain('f=json');
      expect(callBody).toContain('sr=4326');
      expect(callBody).toContain('returnGeometry=true');
      expect(callBody).toContain('pixelSize=30%2C30');
      expect(callBody).toContain('geometryType=esriGeometryPoint');
    });
  });

  describe('getPixelValues() method', () => {
    let identify: IdentifyImage;

    beforeEach(() => {
      identify = new IdentifyImage('https://example.com/ImageServer');
    });

    it('should return array of numeric pixel values', async () => {
      const mockResponse = {
        results: [{ value: '125.5' }, { value: '89.25' }, { value: '156.0' }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const values = await identify.at({ lng: -118.2437, lat: 34.0522 }).getPixelValues();

      expect(values).toEqual([125.5, 89.25, 156.0]);
    });

    it('should return string values when not numeric', async () => {
      const mockResponse = {
        results: [{ value: 'Water' }, { value: 'Forest' }, { value: 'Urban' }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const values = await identify.at({ lng: -118.2437, lat: 34.0522 }).getPixelValues();

      expect(values).toEqual(['Water', 'Forest', 'Urban']);
    });

    it('should return null for missing values', async () => {
      const mockResponse = {
        results: [
          { value: '125.5' },
          { attributes: {} }, // No value property
          { value: undefined },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const values = await identify.at({ lng: -118.2437, lat: 34.0522 }).getPixelValues();

      expect(values).toEqual([125.5, null, null]);
    });
  });

  describe('getPixelData() method', () => {
    let identify: IdentifyImage;

    beforeEach(() => {
      identify = new IdentifyImage('https://example.com/ImageServer');
    });

    it('should return detailed pixel information', async () => {
      const mockResponse = {
        results: [
          {
            objectId: 1,
            name: 'Elevation',
            value: '125.5',
            attributes: {
              elevation: 125.5,
              units: 'meters',
            },
            catalogItems: [
              {
                id: 'item1',
                name: 'DEM_2020',
              },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const data = await identify
        .at({ lng: -118.2437, lat: 34.0522 })
        .returnCatalogItems(true)
        .getPixelData();

      expect(data).toHaveLength(1);
      expect(data[0].objectId).toBe(1);
      expect(data[0].name).toBe('Elevation');
      expect(data[0].value).toBe('125.5');
      expect(data[0].attributes).toEqual({
        elevation: 125.5,
        units: 'meters',
      });
      expect(data[0].catalogItems).toEqual([
        {
          id: 'item1',
          name: 'DEM_2020',
        },
      ]);
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should support demo component usage pattern', async () => {
      const mockResponse = {
        results: [
          {
            value: '1234.5',
            attributes: {
              'Pixel Value': 1234.5,
              'Cell Size X': 30,
              'Cell Size Y': 30,
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      // Simulate demo usage pattern
      const identifyTask = new IdentifyImage({
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer',
      });

      const results = await identifyTask.at({ lng: -118.2437, lat: 34.0522 }).run();

      expect(results.results).toHaveLength(1);
      expect(results.results[0].value).toBe('1234.5');
      expect(results.results[0].attributes).toEqual({
        'Pixel Value': 1234.5,
        'Cell Size X': 30,
        'Cell Size Y': 30,
      });
    });

    it('should support elevation service pattern', async () => {
      const mockResponse = {
        results: [
          {
            value: '1247.832',
            location: {
              x: -118.2437,
              y: 34.0522,
              spatialReference: { wkid: 4326 },
            },
            attributes: {
              elevation: 1247.832,
              units: 'Meters',
              resolution: 10,
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const identify = new IdentifyImage(
        'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
      );

      const values = await identify.at([-118.2437, 34.0522]).returnGeometry(false).getPixelValues();

      expect(values).toEqual([1247.832]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme coordinate values', () => {
      const identify = new IdentifyImage('https://example.com/ImageServer');

      identify.at({ lng: -180, lat: 85 });

      const geometry = JSON.parse(getInternal(identify).params.geometry as string);
      expect(geometry.x).toBe(-180);
      expect(geometry.y).toBe(85);
    });

    it('should handle zero pixel size', () => {
      const identify = new IdentifyImage('https://example.com/ImageServer');
      identify.pixelSize([0, 0]);

      expect(getInternal(identify).params.pixelSize).toBe('0,0');
    });

    it('should handle large pixel size values', () => {
      const identify = new IdentifyImage('https://example.com/ImageServer');
      identify.pixelSize([1000000, 500000]);

      expect(getInternal(identify).params.pixelSize).toBe('1000000,500000');
    });

    it('should handle complex rendering rules', () => {
      const identify = new IdentifyImage('https://example.com/ImageServer');
      const complexRule = {
        rasterFunction: 'Composite',
        arguments: {
          Rasters: [
            { rasterFunction: 'Stretch', arguments: { StretchType: 0 } },
            { rasterFunction: 'Colormap', arguments: { Colormap: [[0, 255, 0, 0]] } },
          ],
        },
      };

      identify.renderingRule(complexRule);

      expect(getInternal(identify).params.renderingRule).toBe(JSON.stringify(complexRule));
    });

    it('should handle malformed response gracefully', async () => {
      const malformedResponse = {
        someUnexpectedProperty: 'value',
        notResults: [],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(malformedResponse),
      } as Response);

      const identify = new IdentifyImage('https://example.com/ImageServer');
      const result = await identify.at([0, 0]).run();

      expect(result.results).toHaveLength(0);
      expect(result.location).toBeUndefined();
    });
  });
});
