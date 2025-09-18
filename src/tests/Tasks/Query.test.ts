import { Query } from '@/Tasks/Query';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Query Task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create query with URL string', () => {
      const query = new Query('https://example.com/FeatureServer/0');
      
      expect(query).toBeDefined();
    });

    it('should create query with options object', () => {
      const query = new Query({
        url: 'https://example.com/FeatureServer/0',
        where: 'POPULATION > 100000',
        outFields: ['NAME', 'POPULATION'],
        returnGeometry: false,
        orderByFields: 'POPULATION DESC'
      });
      
      expect(query).toBeDefined();
    });
  });

  describe('Chainable Methods', () => {
    let query: Query;

    beforeEach(() => {
      query = new Query('https://example.com/FeatureServer/0');
    });

    it('should set where clause', () => {
      const result = query.where('POPULATION > 50000');
      
      expect(result).toBe(query); // Should return this for chaining
    });

    it('should set order by', () => {
      const result = query.orderBy('NAME', 'ASC');
      expect(result).toBe(query);
    });

    it('should set layer ID', () => {
      const result = query.layer(2);
      expect(result).toBe(query);
    });

    it('should set distinct', () => {
      const result = query.distinct();
      expect(result).toBe(query);
    });

    it('should set between dates', () => {
      const result = query.between(new Date('2020-01-01'), new Date('2020-12-31'));
      expect(result).toBe(query);
    });

    it('should set nearby geometry', () => {
      const result = query.nearby({ lat: 37, lng: -122 }, 1000);
      expect(result).toBe(query);
    });

    it('should set intersects geometry', () => {
      const result = query.intersects({ lng: -122, lat: 37 });
      expect(result).toBe(query);
    });

    it('should set within geometry', () => {
      const result = query.within({
        xmin: -180, ymin: -90, xmax: 180, ymax: 90,
        spatialReference: { wkid: 4326 }
      });
      expect(result).toBe(query);
    });

    it('should set contains geometry', () => {
      const result = query.contains({ lng: -122, lat: 37 });
      expect(result).toBe(query);
    });

    it('should allow method chaining', () => {
      const result = query
        .where('TYPE = "City"')
        .layer(1)
        .orderBy('POPULATION', 'DESC')
        .intersects({ lng: -122, lat: 37 });
        
      expect(result).toBe(query);
    });
  });

  describe('Query Execution', () => {
    let query: Query;

    beforeEach(() => {
      query = new Query('https://example.com/FeatureServer/0');
    });

    it('should execute query and return GeoJSON', async () => {
      const mockResponse = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { OBJECTID: 1, NAME: 'Test City' },
            geometry: { type: 'Point', coordinates: [-122, 37] }
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await query.run();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/query'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded'
          })
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle JSON response and convert to GeoJSON', async () => {
      const jsonResponse = {
        features: [
          {
            attributes: { OBJECTID: 1, NAME: 'Test City' },
            geometry: { x: -122, y: 37, spatialReference: { wkid: 4326 } }
          }
        ]
      };

      // First call with f=geojson fails, second with f=json succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(jsonResponse)
        } as Response);

      const result = await query.run();
      
      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      if (result.features[0]?.properties) {
        expect(result.features[0].properties.NAME).toBe('Test City');
      }
    });

    it('should handle empty results', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false } as Response) // First request (geojson) fails
        .mockResolvedValueOnce({                         // Second request (json) succeeds  
          ok: true,
          json: () => Promise.resolve({ features: [] })
        } as Response);

      const result = await query.run();

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(query.run()).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      await expect(query.run()).rejects.toThrow();
    });
  });

  describe('Spatial Relationships', () => {
    let query: Query;

    beforeEach(() => {
      query = new Query('https://example.com/FeatureServer/0');
    });

    it('should set intersects relationship', async () => {
      query.intersects({ lng: -122, lat: 37 });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      } as Response);

      await query.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('spatialRel')).toBe('esriSpatialRelIntersects');
      expect(params.get('geometryType')).toBe('esriGeometryPoint');
    });

    it('should set within relationship', async () => {
      query.within({
        xmin: -180, ymin: -90, xmax: 180, ymax: 90,
        spatialReference: { wkid: 4326 }
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      } as Response);

      await query.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('spatialRel')).toBe('esriSpatialRelContains');
      expect(params.get('geometryType')).toBe('esriGeometryEnvelope');
    });

    it('should set contains relationship', async () => {
      query.contains({ lng: -122, lat: 37 });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      } as Response);

      await query.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('spatialRel')).toBe('esriSpatialRelWithin');
    });
  });

  describe('Parameter Building', () => {
    let query: Query;

    beforeEach(() => {
      query = new Query('https://example.com/FeatureServer/0');
    });

    it('should build query with where clause', async () => {
      query.where('POPULATION > 100000');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      } as Response);

      await query.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('where')).toBe('POPULATION > 100000');
      expect(params.get('f')).toBe('geojson');
    });

    it('should build query with orderBy', async () => {
      query.orderBy('NAME', 'DESC');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      } as Response);

      await query.run();

      const fetchCall = mockFetch.mock.calls[0];
      const body = fetchCall[1]?.body as string;
      const params = new URLSearchParams(body);

      expect(params.get('orderByFields')).toBe('NAME DESC');
    });
  });

  describe('GeoJSON Conversion', () => {
    let query: Query;

    beforeEach(() => {
      query = new Query('https://example.com/FeatureServer/0');
    });

    it('should convert Esri JSON point to GeoJSON', async () => {
      const esriResponse = {
        features: [
          {
            attributes: { ID: 1, NAME: 'Point Feature' },
            geometry: { x: -122, y: 37, spatialReference: { wkid: 4326 } }
          }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({ ok: false } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(esriResponse)
        } as Response);

      const result = await query.run();

      expect((result.features[0].geometry as unknown as { x: number; y: number; spatialReference: unknown })).toEqual({
        x: -122, 
        y: 37, 
        spatialReference: { wkid: 4326 }
      });
    });

    it('should convert Esri JSON polygon to GeoJSON', async () => {
      const esriResponse = {
        features: [
          {
            attributes: { ID: 1, NAME: 'Polygon Feature' },
            geometry: {
              rings: [[[-122, 37], [-121, 37], [-121, 38], [-122, 38], [-122, 37]]],
              spatialReference: { wkid: 4326 }
            }
          }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({ ok: false } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(esriResponse)
        } as Response);

      const result = await query.run();

      expect((result.features[0].geometry as unknown as { rings: unknown }).rings).toBeDefined();
      expect((result.features[0].geometry as unknown as { spatialReference: unknown }).spatialReference).toEqual({ wkid: 4326 });
    });
  });

  describe('Layer-specific Queries', () => {
    let query: Query;

    beforeEach(() => {
      query = new Query('https://example.com/MapServer');
    });

    it('should query specific layer', async () => {
      query.layer(2).where('TYPE = "City"');

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
      } as Response);

      await query.run();

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain('/MapServer/2/query');
    });
  });
});