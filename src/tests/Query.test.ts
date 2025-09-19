import { Query, query, QueryOptions, QueryGeometry, Bounds } from '@/Query';

// Mock the Task base class
jest.mock('@/Task');

describe('Query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create Query instance with string URL', () => {
      const queryTask = new Query('https://example.com/FeatureServer/0');
      expect(queryTask).toBeInstanceOf(Query);
    });

    it('should create Query instance with options object', () => {
      const options: QueryOptions = {
        url: 'https://example.com/FeatureServer/0',
        where: 'STATE_NAME=California',
        returnGeometry: true
      };
      const queryTask = new Query(options);
      expect(queryTask).toBeInstanceOf(Query);
    });
  });

  describe('spatial relationship methods', () => {
    let queryTask: Query;
    const testGeometry: QueryGeometry = {
      x: -120,
      y: 35,
      spatialReference: { wkid: 4326 }
    };

    beforeEach(() => {
      queryTask = new Query('https://example.com/FeatureServer/0');
      jest.spyOn(queryTask, '_setGeometryParams' as any).mockImplementation((geom) => {
        (queryTask as any).params.geometry = geom;
        (queryTask as any).params.geometryType = 'esriGeometryPoint';
        (queryTask as any).params.inSR = 4326;
      });
    });

    it('should set within spatial relationship', () => {
      const result = queryTask.within(testGeometry);

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.spatialRel).toBe('esriSpatialRelContains');
      expect((queryTask as any)._setGeometryParams).toHaveBeenCalledWith(testGeometry);
    });

    it('should set intersects spatial relationship', () => {
      const result = queryTask.intersects(testGeometry);

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.spatialRel).toBe('esriSpatialRelIntersects');
    });

    it('should set contains spatial relationship', () => {
      const result = queryTask.contains(testGeometry);

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.spatialRel).toBe('esriSpatialRelWithin');
    });

    it('should set nearby search parameters', () => {
      const latlng = { lat: 35, lng: -120 };
      const radius = 1000;

      const result = queryTask.nearby(latlng, radius);

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.geometry).toEqual([-120, 35]);
      expect((queryTask as any).params.geometryType).toBe('esriGeometryPoint');
      expect((queryTask as any).params.spatialRel).toBe('esriSpatialRelIntersects');
      expect((queryTask as any).params.units).toBe('esriSRUnit_Meter');
      expect((queryTask as any).params.distance).toBe(1000);
      expect((queryTask as any).params.inSR).toBe(4326);
    });
  });

  describe('query methods', () => {
    let queryTask: Query;

    beforeEach(() => {
      queryTask = new Query('https://example.com/FeatureServer/0');
    });

    it('should set WHERE clause', () => {
      const result = queryTask.where('STATE_NAME=California');

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.where).toBe('STATE_NAME=California');
    });

    it('should set time range with Date objects', () => {
      const start = new Date('2020-01-01');
      const end = new Date('2020-12-31');

      const result = queryTask.between(start, end);

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.time).toEqual([start.valueOf(), end.valueOf()]);
    });

    it('should set order by fields with default ASC', () => {
      const result = queryTask.orderBy('STATE_NAME');

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.orderByFields).toBe('STATE_NAME ASC');
    });

    it('should set order by fields with DESC', () => {
      const result = queryTask.orderBy('POP2000', 'DESC');

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.orderByFields).toBe('POP2000 DESC');
    });

    it('should set layer for map services', () => {
      const result = queryTask.layer(5);

      expect(result).toBe(queryTask);
      expect((queryTask as any).path).toBe('5/query');
    });

    it('should set distinct values mode', () => {
      const result = queryTask.distinct();

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.returnGeometry).toBe(false);
      expect((queryTask as any).params.returnDistinctValues).toBe(true);
    });

    it('should set pixel size', () => {
      const pixelSize = { x: 30, y: 30 };

      const result = queryTask.pixelSize(pixelSize);

      expect(result).toBe(queryTask);
      expect((queryTask as any).params.pixelSize).toEqual([30, 30]);
    });
  });

  describe('private methods', () => {
    let queryTask: Query;

    beforeEach(() => {
      queryTask = new Query('https://example.com/FeatureServer/0');
    });

    describe('_setGeometry method', () => {
      it('should handle null geometry', () => {
        const result = (queryTask as any)._setGeometry(null);

        expect(result.geometry).toBeNull();
        expect(result.geometryType).toBe('esriGeometryPoint');
      });

      it('should handle LatLng-like object', () => {
        const latlng = { lat: 35, lng: -120 };

        const result = (queryTask as any)._setGeometry(latlng);

        expect(result.geometry).toEqual({
          x: -120,
          y: 35,
          spatialReference: { wkid: 4326 }
        });
        expect(result.geometryType).toBe('esriGeometryPoint');
      });

      it('should handle Bounds-like object', () => {
        const bounds: Bounds = {
          _southWest: { lat: 32, lng: -125 },
          _northEast: { lat: 42, lng: -114 }
        };

        const result = (queryTask as any)._setGeometry(bounds);

        expect(result.geometry).toEqual({
          xmin: -125,
          ymin: 32,
          xmax: -114,
          ymax: 42,
          spatialReference: { wkid: 4326 }
        });
        expect(result.geometryType).toBe('esriGeometryEnvelope');
      });
    });

    describe('_cleanParams method', () => {
      it('should remove execution-specific parameters', () => {
        (queryTask as any).params.returnIdsOnly = true;
        (queryTask as any).params.returnExtentOnly = true;
        (queryTask as any).params.returnCountOnly = true;
        (queryTask as any).params.returnDistinctValues = true;
        (queryTask as any).params.normalParam = 'keep this';

        (queryTask as any)._cleanParams();

        expect((queryTask as any).params.returnIdsOnly).toBeUndefined();
        expect((queryTask as any).params.returnExtentOnly).toBeUndefined();
        expect((queryTask as any).params.returnCountOnly).toBeUndefined();
        expect((queryTask as any).params.returnDistinctValues).toBeUndefined();
        expect((queryTask as any).params.normalParam).toBe('keep this');
      });
    });
  });

  describe('factory function', () => {
    it('should create Query instance with string', () => {
      const queryTask = query('https://example.com/FeatureServer/0');
      expect(queryTask).toBeInstanceOf(Query);
    });

    it('should create Query instance with options', () => {
      const options: QueryOptions = {
        url: 'https://example.com/FeatureServer/0',
        where: 'STATE_NAME=California'
      };
      const queryTask = query(options);
      expect(queryTask).toBeInstanceOf(Query);
    });
  });

  describe('default parameters', () => {
    it('should have correct default parameters', () => {
      const queryTask = new Query('https://example.com/FeatureServer/0');
      
      expect((queryTask as any).params.returnGeometry).toBe(true);
      expect((queryTask as any).params.where).toBe('1=1');
      expect((queryTask as any).params.outSR).toBe(4326);
      expect((queryTask as any).params.outFields).toBe('*');
      expect((queryTask as any).params.f).toBe('json');
    });
  });

  describe('setters configuration', () => {
    it('should have correct setters mapping', () => {
      const queryTask = new Query('https://example.com/FeatureServer/0');
      
      expect((queryTask as any).setters).toEqual({
        offset: 'resultOffset',
        limit: 'resultRecordCount',
        fields: 'outFields',
        precision: 'geometryPrecision',
        featureIds: 'objectIds',
        returnGeometry: 'returnGeometry',
        returnM: 'returnM',
        transform: 'datumTransformation',
        token: 'token',
      });
    });

    it('should have correct path', () => {
      const queryTask = new Query('https://example.com/FeatureServer/0');
      expect((queryTask as any).path).toBe('query');
    });
  });
});