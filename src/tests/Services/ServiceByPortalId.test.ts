import { getItem } from '@esri/arcgis-rest-portal';
import { DynamicMapService } from '@/Services/DynamicMapService';
import { FeatureService } from '@/Services/FeatureService';
import type { Map } from '@/types';

jest.mock('@esri/arcgis-rest-portal', () => ({
  ...jest.requireActual('@esri/arcgis-rest-portal'),
  getItem: jest.fn(),
}));

const mockGetItem = getItem as jest.MockedFunction<typeof getItem>;

const ITEM_ID = 'd5e02a0c1f2b4ec399823fdd3c2fdebd';
const MAP_SERVICE_URL = 'https://example.com/arcgis/rest/services/Test/MapServer';
const FEATURE_SERVICE_URL = 'https://example.com/arcgis/rest/services/Test/FeatureServer';

const createMockMap = (): Partial<Map> => {
  const sources: Record<string, unknown> = {};
  const mockMap: any = {
    addSource: jest.fn((id: string, source: unknown) => {
      sources[id] = source;
      return mockMap;
    }),
    removeSource: jest.fn((id: string) => {
      delete sources[id];
      return mockMap;
    }),
    getSource: jest.fn((id: string) => sources[id]),
    getStyle: jest.fn().mockReturnValue({ layers: [] }),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    getLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    getZoom: jest.fn().mockReturnValue(0), // below minZoom → no tile queries
    getCanvas: jest.fn().mockReturnValue({ width: 800, height: 600 }),
    getBounds: jest.fn().mockReturnValue({
      toArray: () => [
        [-180, -90],
        [180, 90],
      ],
    }),
  };
  return mockMap;
};

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Services accept a portal item id as their url', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DynamicMapService', () => {
    it('defers source creation until the item id resolves, then uses the service url', async () => {
      mockGetItem.mockResolvedValue({ id: ITEM_ID, url: MAP_SERVICE_URL } as never);
      const map = createMockMap();

      const service = new DynamicMapService('src', map as Map, {
        url: ITEM_ID,
        getAttributionFromService: false,
      });

      // Source creation is deferred while the id resolves.
      expect(map.addSource).not.toHaveBeenCalled();

      await service.sourceReady;

      expect(mockGetItem).toHaveBeenCalledWith(ITEM_ID, expect.any(Object));
      expect(service.esriServiceOptions.url).toBe(MAP_SERVICE_URL);
      expect(map.addSource).toHaveBeenCalledTimes(1);
      const source = (map.addSource as jest.Mock).mock.calls[0][1];
      expect(source.tiles[0]).toContain(`${MAP_SERVICE_URL}/export`);
    });

    it('still creates the source synchronously for a plain url', () => {
      const map = createMockMap();

      const service = new DynamicMapService('src', map as Map, {
        url: `${MAP_SERVICE_URL}/`,
        getAttributionFromService: false,
      });

      expect(map.addSource).toHaveBeenCalledTimes(1);
      expect(service.esriServiceOptions.url).toBe(MAP_SERVICE_URL);
      expect(mockGetItem).not.toHaveBeenCalled();
    });
  });

  describe('FeatureService', () => {
    it('resolves the item id and appends the default sublayer index', async () => {
      mockGetItem.mockResolvedValue({ id: ITEM_ID, url: FEATURE_SERVICE_URL } as never);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            supportedQueryFormats: 'JSON,geoJSON,PBF',
            geometryType: 'esriGeometryPoint',
            uniqueIdField: { name: 'OBJECTID', type: 'esriFieldTypeOID' },
            extent: {
              xmin: -180,
              ymin: -90,
              xmax: 180,
              ymax: 90,
              spatialReference: { wkid: 4326 },
            },
          }),
      } as Response);
      const map = createMockMap();

      const service = new FeatureService('src', map as Map, { url: ITEM_ID });

      // The blank GeoJSON source is added immediately (it does not need the url).
      expect(map.addSource).toHaveBeenCalledTimes(1);

      await service.sourceReady;

      expect(service.esriServiceOptions.url).toBe(`${FEATURE_SERVICE_URL}/0`);
    });
  });
});
