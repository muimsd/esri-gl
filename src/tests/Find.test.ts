import { Find, find, FindOptions } from '@/Find';

// Mock the Task base class
jest.mock('@/Task');

describe('Find', () => {
  beforeEach(() => {
    // Mock global fetch
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create Find instance with string URL', () => {
      const find = new Find('https://example.com/MapServer');
      expect(find).toBeInstanceOf(Find);
    });

    it('should create Find instance with options object', () => {
      const options: FindOptions = {
        url: 'https://example.com/MapServer',
        searchText: 'test',
        contains: true,
      };
      const find = new Find(options);
      expect(find).toBeInstanceOf(Find);
    });
  });

  describe('chainable methods', () => {
    let findTask: Find;

    beforeEach(() => {
      findTask = new Find('https://example.com/MapServer');
    });

    it('should set text and return Find instance', () => {
      const result = findTask.text('California');
      expect(result).toBe(findTask);
      expect((findTask as any).params.searchText).toBe('California');
    });

    it('should set fields with string and return Find instance', () => {
      const result = findTask.fields('STATE_NAME');
      expect(result).toBe(findTask);
      expect((findTask as any).params.searchFields).toBe('STATE_NAME');
    });

    it('should set fields with array and return Find instance', () => {
      const result = findTask.fields(['STATE_NAME', 'CITY_NAME']);
      expect(result).toBe(findTask);
      expect((findTask as any).params.searchFields).toBe('STATE_NAME,CITY_NAME');
    });

    it('should set contains and return Find instance', () => {
      const result = findTask.contains(false);
      expect(result).toBe(findTask);
      expect((findTask as any).params.contains).toBe(false);
    });

    it('should set layers with number and return Find instance', () => {
      const result = findTask.layers(0);
      expect(result).toBe(findTask);
      expect((findTask as any).params.layers).toBe(0);
    });

    it('should set layers with array and return Find instance', () => {
      const result = findTask.layers([0, 1, 2]);
      expect(result).toBe(findTask);
      expect((findTask as any).params.layers).toBe('0,1,2');
    });

    it('should set layers with string and return Find instance', () => {
      const result = findTask.layers('visible');
      expect(result).toBe(findTask);
      expect((findTask as any).params.layers).toBe('visible');
    });

    it('should add layer definitions', () => {
      const result = findTask.layerDefs(0, 'STATE_NAME=California');
      expect(result).toBe(findTask);
      expect((findTask as any).params.layerDefs).toBe('0:STATE_NAME=California');

      // Add another layer def
      findTask.layerDefs(1, 'POP2000 > 100000');
      expect((findTask as any).params.layerDefs).toBe('0:STATE_NAME=California;1:POP2000 > 100000');
    });

    it('should set simplification parameters', () => {
      const mockMap = {
        getBounds: () => ({
          getWest: () => -180,
          getEast: () => 180,
        }),
        getSize: () => ({ x: 800, y: 600 }),
      };

      const result = findTask.simplify(mockMap, 0.5);
      expect(result).toBe(findTask);
      expect((findTask as any).params.maxAllowableOffset).toBe((360 / 800) * 0.5);
    });
  });

  describe('run method', () => {
    let findTask: Find;

    beforeEach(() => {
      findTask = new Find('https://example.com/MapServer');
      findTask.text('California');
    });

    it('should execute find with GeoJSON format first', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { STATE_NAME: 'California' },
            geometry: { type: 'Point', coordinates: [-120, 35] },
          },
        ],
      };

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGeoJSON),
      } as Response);

      // Mock the request method from the base Task class
      jest.spyOn(findTask, 'request' as any).mockResolvedValueOnce(mockGeoJSON);

      const result = await findTask.run();

      expect(result).toEqual(mockGeoJSON);
      expect((findTask as any).params.f).toBe('geojson');
    });

    it('should fallback to JSON format and convert when GeoJSON fails', async () => {
      const mockJSONResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'States',
            foundFieldName: 'STATE_NAME',
            value: 'California',
            attributes: {
              STATE_NAME: 'California',
              POP2000: 33871648,
            },
            geometry: {
              type: 'Point',
              coordinates: [-120, 35],
            },
          },
        ],
      };

      // Mock first call to fail (GeoJSON), second to succeed (JSON)
      jest
        .spyOn(findTask, 'request' as any)
        .mockRejectedValueOnce(new Error('GeoJSON not supported'))
        .mockResolvedValueOnce(mockJSONResponse);

      const result = await findTask.run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      expect(result.features[0].properties.STATE_NAME).toBe('California');
      expect(result.features[0].properties.layerId).toBe(0);
      expect(result.features[0].properties.foundFieldName).toBe('STATE_NAME');
      expect((findTask as any).params.f).toBe('json');
    });

    it('should handle empty results', async () => {
      const mockJSONResponse = { results: [] };

      jest
        .spyOn(findTask, 'request' as any)
        .mockRejectedValueOnce(new Error('GeoJSON not supported'))
        .mockResolvedValueOnce(mockJSONResponse);

      const result = await findTask.run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle results without geometry', async () => {
      const mockJSONResponse = {
        results: [
          {
            layerId: 0,
            layerName: 'States',
            foundFieldName: 'STATE_NAME',
            value: 'California',
            attributes: {
              STATE_NAME: 'California',
            },
            // no geometry
          },
        ],
      };

      jest
        .spyOn(findTask, 'request' as any)
        .mockRejectedValueOnce(new Error('GeoJSON not supported'))
        .mockResolvedValueOnce(mockJSONResponse);

      const result = await findTask.run();

      expect(result.features[0].geometry).toBeNull();
    });
  });

  describe('factory function', () => {
    it('should create Find instance with string', () => {
      const findTask = find('https://example.com/MapServer');
      expect(findTask).toBeInstanceOf(Find);
    });

    it('should create Find instance with options', () => {
      const options: FindOptions = {
        url: 'https://example.com/MapServer',
        searchText: 'test',
      };
      const findTask = find(options);
      expect(findTask).toBeInstanceOf(Find);
    });
  });

  describe('default parameters', () => {
    it('should have correct default parameters', () => {
      const findTask = new Find('https://example.com/MapServer');

      expect((findTask as any).params.sr).toBe(4326);
      expect((findTask as any).params.contains).toBe(true);
      expect((findTask as any).params.returnGeometry).toBe(true);
      expect((findTask as any).params.returnZ).toBe(true);
      expect((findTask as any).params.returnM).toBe(false);
      expect((findTask as any).params.f).toBe('json');
    });
  });

  describe('setters configuration', () => {
    it('should have correct setters mapping', () => {
      const findTask = new Find('https://example.com/MapServer');

      expect(findTask['setters']).toEqual({
        contains: 'contains',
        text: 'searchText',
        fields: 'searchFields',
        spatialReference: 'sr',
        sr: 'sr',
        layers: 'layers',
        returnGeometry: 'returnGeometry',
        maxAllowableOffset: 'maxAllowableOffset',
        precision: 'geometryPrecision',
        dynamicLayers: 'dynamicLayers',
        returnZ: 'returnZ',
        returnM: 'returnM',
        gdbVersion: 'gdbVersion',
        token: 'token',
      });
    });

    it('should have correct path', () => {
      const findTask = new Find('https://example.com/MapServer');
      expect(findTask['path']).toBe('find');
    });
  });
});
