import { Find } from '@/Tasks/Find';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Find Task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create Find with URL string', () => {
      const find = new Find('https://example.com/MapServer');

      expect(find).toBeDefined();
    });

    it('should create Find with options object', () => {
      const find = new Find({
        url: 'https://example.com/MapServer',
        searchText: 'California',
        searchFields: 'STATE_NAME',
        contains: true,
        layers: [0, 1, 2],
        returnGeometry: true,
      });

      expect(find).toBeDefined();
    });
  });

  describe('Chainable Methods', () => {
    let find: Find;

    beforeEach(() => {
      find = new Find('https://example.com/MapServer');
    });

    it('should set search text', () => {
      const result = find.text('California');

      expect(result).toBe(find); // Should return this for chaining
    });

    it('should set search fields', () => {
      const result = find.fields(['STATE_NAME', 'CITY_NAME']);
      expect(result).toBe(find);
    });

    it('should set single search field', () => {
      const result = find.fields('STATE_ABBR');
      expect(result).toBe(find);
    });

    it('should set layers', () => {
      const result = find.layers([0, 1, 2]);
      expect(result).toBe(find);
    });

    it('should set contains mode', () => {
      const result = find.contains(true);
      expect(result).toBe(find);
    });

    it('should allow method chaining', () => {
      const result = find.text('CA').fields('STATE_ABBR').layers([2]).contains(true);

      expect(result).toBe(find);
    });
  });

  describe('Find Execution', () => {
    let find: Find;

    beforeEach(() => {
      find = new Find('https://example.com/MapServer');
    });

    it('should execute find and return GeoJSON', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 2,
            layerName: 'States',
            foundFieldName: 'STATE_ABBR',
            value: 'CA',
            attributes: { OBJECTID: 1, STATE_NAME: 'California', STATE_ABBR: 'CA' },
            geometry: {
              rings: [
                [
                  [-124, 32],
                  [-114, 32],
                  [-114, 42],
                  [-124, 42],
                  [-124, 32],
                ],
              ],
              spatialReference: { wkid: 4326 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('CA').fields('STATE_ABBR').run();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/find'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      if (result.features[0]?.properties) {
        expect(result.features[0].properties.layerId).toBe(2);
        expect(result.features[0].properties.STATE_ABBR).toBe('CA');
      }
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      } as Response);

      const result = await find.text('NONEXISTENT').run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(find.text('CA').run()).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      await expect(find.text('CA').run()).rejects.toThrow();
    });
  });

  describe('Parameter Building', () => {
    let find: Find;

    beforeEach(() => {
      find = new Find('https://example.com/MapServer');
    });

    it('should build correct find parameters', async () => {
      find.text('California').fields(['STATE_NAME', 'CITY_NAME']).layers([0, 1, 2]).contains(true);

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      } as Response);

      await find.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('searchText')).toBe('California');
      expect(params.get('searchFields')).toBe('STATE_NAME,CITY_NAME');
      expect(params.get('layers')).toBe('0,1,2');
      expect(params.get('contains')).toBe('true');
      expect(params.get('f')).toBe('json');
    });

    it('should handle single search field', async () => {
      find.text('CA').fields('STATE_ABBR');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      } as Response);

      await find.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('searchFields')).toBe('STATE_ABBR');
    });

    it('should handle "all" layers', async () => {
      find.text('test').layers('all');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      } as Response);

      await find.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('layers')).toBe('all');
    });
  });

  describe('Result Conversion', () => {
    let find: Find;

    beforeEach(() => {
      find = new Find('https://example.com/MapServer');
    });

    it('should convert find results to GeoJSON features', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'Cities',
            foundFieldName: 'CITY_NAME',
            value: 'Los Angeles',
            attributes: {
              OBJECTID: 1,
              CITY_NAME: 'Los Angeles',
              STATE: 'CA',
              POPULATION: 4000000,
            },
            geometry: { x: -118.2437, y: 34.0522, spatialReference: { wkid: 4326 } },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('Los Angeles').run();

      expect(result.features[0]).toEqual({
        type: 'Feature',
        properties: expect.objectContaining({
          OBJECTID: 1,
          CITY_NAME: 'Los Angeles',
          STATE: 'CA',
          POPULATION: 4000000,
          layerId: 0,
          layerName: 'Cities',
          foundFieldName: 'CITY_NAME',
          value: 'Los Angeles',
        }),
        geometry: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522],
        },
      });
    });

    it('should handle results without geometry', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'Data Table',
            foundFieldName: 'NAME',
            value: 'Test Value',
            attributes: { OBJECTID: 1, NAME: 'Test Value' },
            // No geometry property
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('Test Value').run();

      expect(result.features[0]).toEqual({
        type: 'Feature',
        properties: expect.objectContaining({
          OBJECTID: 1,
          NAME: 'Test Value',
          layerId: 0,
          layerName: 'Data Table',
        }),
        geometry: null,
      });
    });

    it('should handle polygon geometry conversion', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 2,
            layerName: 'States',
            foundFieldName: 'STATE_NAME',
            value: 'California',
            attributes: { OBJECTID: 1, STATE_NAME: 'California' },
            geometry: {
              rings: [
                [
                  [-124, 32],
                  [-114, 32],
                  [-114, 42],
                  [-124, 42],
                  [-124, 32],
                ],
              ],
              spatialReference: { wkid: 4326 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('California').run();

      expect(result.features[0].geometry).toEqual({
        type: 'Polygon',
        coordinates: [
          [
            [-124, 32],
            [-114, 32],
            [-114, 42],
            [-124, 42],
            [-124, 32],
          ],
        ],
      });
    });
  });

  describe('Error Handling', () => {
    let find: Find;

    beforeEach(() => {
      find = new Find('https://example.com/MapServer');
    });

    it('should handle undefined results array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}), // No results property
      } as Response);

      const result = await find.text('test').run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle malformed response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null),
      } as Response);

      const result = await find.text('test').run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(find.text('test').run()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Missing Coverage Areas', () => {
    let find: Find;

    beforeEach(() => {
      find = new Find('https://example.com/MapServer');
    });

    it('should handle layers as string in constructor', () => {
      const findWithStringLayers = new Find({
        url: 'https://example.com/MapServer',
        layers: '0,1,2',
      });
      expect((findWithStringLayers as any).params.layers).toBe('0,1,2');
    });

    it('should handle layers as number in constructor', () => {
      const findWithNumberLayers = new Find({
        url: 'https://example.com/MapServer',
        layers: 5,
      });
      expect((findWithNumberLayers as any).params.layers).toBe('5');
    });

    it('should set maxAllowableOffset parameter in constructor', () => {
      const findWithOffset = new Find({
        url: 'https://example.com/MapServer',
        maxAllowableOffset: 10,
      });
      expect((findWithOffset as any).params.maxAllowableOffset).toBe(10);
    });

    // Test subclass to expose params for testing
    class TestFind extends Find {
      public getParams() {
        // @ts-expect-error: Accessing protected/private member for testing
        return this.params;
      }
    }

    it('should set geometryPrecision parameter in constructor', () => {
      const findWithPrecision = new TestFind({
        url: 'https://example.com/MapServer',
        geometryPrecision: 3,
      });
      expect(findWithPrecision.getParams().geometryPrecision).toBe(3);
    });

    it('should set dynamicLayers parameter in constructor', () => {
      const dynamicLayers = [{ id: 0, source: { mapLayerId: 1 } }];
      const findWithDynamic = new TestFind({
        url: 'https://example.com/MapServer',
        dynamicLayers,
      });
      expect(findWithDynamic.getParams().dynamicLayers).toEqual(dynamicLayers);
    });

    it('should set returnZ parameter in constructor', () => {
      const findWithZ = new TestFind({
        url: 'https://example.com/MapServer',
        returnZ: true,
      });
      expect(findWithZ.getParams().returnZ).toBe(true);
    });

    it('should set returnM parameter in constructor', () => {
      const findWithM = new TestFind({
        url: 'https://example.com/MapServer',
        returnM: false,
      });
      expect(findWithM.getParams().returnM).toBe(false);
    });

    it('should handle different geometry types in conversion', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 1,
            layerName: 'Lines',
            foundFieldName: 'NAME',
            value: 'Highway',
            attributes: { OBJECTID: 1, NAME: 'Highway' },
            geometry: {
              paths: [
                [
                  [-118, 34],
                  [-117, 35],
                ],
              ],
              spatialReference: { wkid: 4326 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('Highway').run();

      expect(result.features[0].geometry).toEqual({
        type: 'LineString',
        coordinates: [
          [-118, 34],
          [-117, 35],
        ],
      });
    });

    it('should handle multipath geometry', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 1,
            layerName: 'Roads',
            foundFieldName: 'NAME',
            value: 'Interstate',
            attributes: { OBJECTID: 1, NAME: 'Interstate' },
            geometry: {
              paths: [
                [
                  [-118, 34],
                  [-117, 35],
                ],
                [
                  [-116, 36],
                  [-115, 37],
                ],
              ],
              spatialReference: { wkid: 4326 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('Interstate').run();

      expect(result.features[0].geometry).toEqual({
        type: 'MultiLineString',
        coordinates: [
          [
            [-118, 34],
            [-117, 35],
          ],
          [
            [-116, 36],
            [-115, 37],
          ],
        ],
      });
    });

    it('should handle multipolygon geometry', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 2,
            layerName: 'Islands',
            foundFieldName: 'NAME',
            value: 'Chain',
            attributes: { OBJECTID: 1, NAME: 'Chain' },
            geometry: {
              rings: [
                [
                  [-118, 34],
                  [-117, 34],
                  [-117, 35],
                  [-118, 35],
                  [-118, 34],
                ],
                [
                  [-116, 33],
                  [-115, 33],
                  [-115, 34],
                  [-116, 34],
                  [-116, 33],
                ],
              ],
              spatialReference: { wkid: 4326 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('Chain').run();

      expect(result.features[0].geometry.type).toBe('Polygon');
      expect((result.features[0].geometry as any).coordinates).toHaveLength(2);
    });

    it('should handle unknown geometry types by defaulting to null', async () => {
      const mockResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'Unknown',
            foundFieldName: 'NAME',
            value: 'Test',
            attributes: { OBJECTID: 1, NAME: 'Test' },
            geometry: {
              unknownType: 'something',
              spatialReference: { wkid: 4326 },
            },
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await find.text('Test').run();

      expect(result.features[0].geometry).toBeNull();
    });
  });
});
