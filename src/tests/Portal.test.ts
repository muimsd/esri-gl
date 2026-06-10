import {
  serviceFromPortalItem,
  servicesFromWebMap,
  searchPortalItems,
  SearchQueryBuilder,
} from '@/Portal';
import { getItem, getItemData, searchItems } from '@esri/arcgis-rest-portal';
import { DynamicMapService } from '@/Services/DynamicMapService';
import { TiledMapService } from '@/Services/TiledMapService';
import { ImageService } from '@/Services/ImageService';
import { VectorTileService } from '@/Services/VectorTileService';
import { FeatureService } from '@/Services/FeatureService';
import type { Map } from '@/types';

jest.mock('@esri/arcgis-rest-portal', () => ({
  ...jest.requireActual('@esri/arcgis-rest-portal'),
  getItem: jest.fn(),
  getItemData: jest.fn(),
  searchItems: jest.fn(),
}));
jest.mock('@/Services/DynamicMapService');
jest.mock('@/Services/TiledMapService');
jest.mock('@/Services/ImageService');
jest.mock('@/Services/VectorTileService');
jest.mock('@/Services/FeatureService');

const mockGetItem = getItem as jest.MockedFunction<typeof getItem>;
const mockGetItemData = getItemData as jest.MockedFunction<typeof getItemData>;
const mockSearchItems = searchItems as jest.MockedFunction<typeof searchItems>;

const mockMap = {} as unknown as Map;

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item1',
    title: 'Test Item',
    type: 'Feature Service',
    typeKeywords: [],
    url: 'https://example.com/arcgis/rest/services/Test/FeatureServer',
    ...overrides,
  } as never;
}

describe('Portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('serviceFromPortalItem', () => {
    it('resolves a Feature Service item and appends the default layer index', async () => {
      mockGetItem.mockResolvedValue(makeItem());

      const result = await serviceFromPortalItem('src', mockMap, 'item1');

      expect(result.kind).toBe('feature');
      expect(result.sourceId).toBe('src');
      expect(result.title).toBe('Test Item');
      expect(result.url).toBe('https://example.com/arcgis/rest/services/Test/FeatureServer');
      expect(FeatureService).toHaveBeenCalledWith(
        'src',
        mockMap,
        expect.objectContaining({
          url: 'https://example.com/arcgis/rest/services/Test/FeatureServer/0',
        }),
        undefined
      );
    });

    it('uses the layerId option for multi-layer Feature Services', async () => {
      mockGetItem.mockResolvedValue(makeItem());

      await serviceFromPortalItem('src', mockMap, 'item1', { layerId: 3 });

      expect(FeatureService).toHaveBeenCalledWith(
        'src',
        mockMap,
        expect.objectContaining({ url: expect.stringMatching(/\/FeatureServer\/3$/) }),
        undefined
      );
    });

    it('keeps an explicit sublayer index already present in the item url', async () => {
      mockGetItem.mockResolvedValue(
        makeItem({ url: 'https://example.com/arcgis/rest/services/Test/FeatureServer/5/' })
      );

      await serviceFromPortalItem('src', mockMap, 'item1');

      expect(FeatureService).toHaveBeenCalledWith(
        'src',
        mockMap,
        expect.objectContaining({ url: expect.stringMatching(/\/FeatureServer\/5$/) }),
        undefined
      );
    });

    it('resolves an untiled Map Service to a DynamicMapService', async () => {
      mockGetItem.mockResolvedValue(
        makeItem({ type: 'Map Service', url: 'https://example.com/rest/services/Test/MapServer' })
      );

      const result = await serviceFromPortalItem('src', mockMap, 'item1');

      expect(result.kind).toBe('dynamic');
      expect(DynamicMapService).toHaveBeenCalled();
    });

    it('resolves a tiled Map Service (by typeKeywords) to a TiledMapService', async () => {
      mockGetItem.mockResolvedValue(
        makeItem({
          type: 'Map Service',
          typeKeywords: ['Tiled', 'Map Service'],
          url: 'https://example.com/rest/services/Test/MapServer',
        })
      );

      const result = await serviceFromPortalItem('src', mockMap, 'item1');

      expect(result.kind).toBe('tiled');
      expect(TiledMapService).toHaveBeenCalled();
    });

    it('resolves Image and Vector Tile services', async () => {
      mockGetItem.mockResolvedValue(
        makeItem({ type: 'Image Service', url: 'https://example.com/rest/services/I/ImageServer' })
      );
      const image = await serviceFromPortalItem('img', mockMap, 'item1');
      expect(image.kind).toBe('image');
      expect(ImageService).toHaveBeenCalled();

      mockGetItem.mockResolvedValue(
        makeItem({
          type: 'Vector Tile Service',
          url: 'https://example.com/rest/services/V/VectorTileServer',
        })
      );
      const vector = await serviceFromPortalItem('vt', mockMap, 'item2', {
        vectorSrcOptions: { maxzoom: 14 },
      });
      expect(vector.kind).toBe('vector-tile');
      expect(VectorTileService).toHaveBeenCalledWith('vt', mockMap, expect.anything(), {
        maxzoom: 14,
      });
    });

    it('forwards auth fields into the constructed service options', async () => {
      mockGetItem.mockResolvedValue(makeItem());

      await serviceFromPortalItem('src', mockMap, 'item1', {
        token: 'abc',
        serviceOptions: { where: '1=1' },
      });

      expect(FeatureService).toHaveBeenCalledWith(
        'src',
        mockMap,
        expect.objectContaining({ token: 'abc', where: '1=1' }),
        undefined
      );
    });

    it('passes resolved authentication and portal to getItem', async () => {
      mockGetItem.mockResolvedValue(makeItem());

      await serviceFromPortalItem('src', mockMap, 'item1', {
        token: 'abc',
        portal: 'https://my-portal.com/sharing/rest',
      });

      expect(mockGetItem).toHaveBeenCalledWith('item1', {
        authentication: expect.objectContaining({ key: 'abc' }),
        portal: 'https://my-portal.com/sharing/rest',
      });
    });

    it('throws when the item has no service url', async () => {
      mockGetItem.mockResolvedValue(makeItem({ url: undefined }));

      await expect(serviceFromPortalItem('src', mockMap, 'item1')).rejects.toThrow(
        'has no service url'
      );
    });

    it('throws for unsupported item types', async () => {
      mockGetItem.mockResolvedValue(makeItem({ type: 'Web Mapping Application' }));

      await expect(serviceFromPortalItem('src', mockMap, 'item1')).rejects.toThrow(
        'unsupported type "Web Mapping Application"'
      );
    });
  });

  describe('servicesFromWebMap', () => {
    const webMapData = {
      operationalLayers: [
        {
          id: 'layerA',
          title: 'Features',
          layerType: 'ArcGISFeatureLayer',
          url: 'https://example.com/rest/services/A/FeatureServer/0',
        },
        {
          id: 'layerB',
          title: 'Dynamic',
          layerType: 'ArcGISMapServiceLayer',
          url: 'https://example.com/rest/services/B/MapServer',
        },
        {
          id: 'layerC',
          title: 'Unsupported',
          layerType: 'KML',
          url: 'https://example.com/some.kml',
        },
        { id: 'layerD', title: 'No URL', layerType: 'ArcGISFeatureLayer' },
      ],
      baseMap: {
        baseMapLayers: [
          {
            id: 'base',
            title: 'Basemap',
            layerType: 'VectorTileLayer',
            styleUrl: 'https://example.com/rest/services/Base/VectorTileServer',
          },
        ],
      },
    };

    it('instantiates a service per supported operational layer and skips the rest', async () => {
      mockGetItemData.mockResolvedValue(webMapData as never);

      const results = await servicesFromWebMap(mockMap, 'webmap1');

      expect(results).toHaveLength(2);
      expect(results.map(r => r.kind)).toEqual(['feature', 'dynamic']);
      expect(results.map(r => r.sourceId)).toEqual(['webmap1-layerA', 'webmap1-layerB']);
      expect(results.map(r => r.title)).toEqual(['Features', 'Dynamic']);
    });

    it('includes basemap layers when includeBasemap is set', async () => {
      mockGetItemData.mockResolvedValue(webMapData as never);

      const results = await servicesFromWebMap(mockMap, 'webmap1', { includeBasemap: true });

      expect(results).toHaveLength(3);
      expect(results[2].kind).toBe('vector-tile');
      expect(results[2].url).toBe('https://example.com/rest/services/Base/VectorTileServer');
    });

    it('honours a custom sourceIdPrefix and falls back to the layer index', async () => {
      mockGetItemData.mockResolvedValue({
        operationalLayers: [
          {
            title: 'No id',
            layerType: 'ArcGISTiledMapServiceLayer',
            url: 'https://example.com/rest/services/T/MapServer',
          },
        ],
      } as never);

      const results = await servicesFromWebMap(mockMap, 'webmap1', { sourceIdPrefix: 'wm' });

      expect(results[0].sourceId).toBe('wm-0');
      expect(results[0].kind).toBe('tiled');
    });

    it('skips layers whose service constructor throws', async () => {
      mockGetItemData.mockResolvedValue(webMapData as never);
      (FeatureService as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('bad source');
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const results = await servicesFromWebMap(mockMap, 'webmap1');

      expect(results).toHaveLength(1);
      expect(results[0].kind).toBe('dynamic');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping web map layer "Features"'),
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it('throws when the item has no data', async () => {
      mockGetItemData.mockResolvedValue(null as never);

      await expect(servicesFromWebMap(mockMap, 'webmap1')).rejects.toThrow('has no item data');
    });
  });

  describe('searchPortalItems', () => {
    const searchResult = { results: [], total: 0 } as never;

    it('wraps a string query and passes resolved auth', async () => {
      mockSearchItems.mockResolvedValue(searchResult);

      await searchPortalItems('type:"Feature Service"', { token: 'abc' });

      expect(mockSearchItems).toHaveBeenCalledWith({
        q: 'type:"Feature Service"',
        authentication: expect.objectContaining({ key: 'abc' }),
      });
    });

    it('accepts a SearchQueryBuilder', async () => {
      mockSearchItems.mockResolvedValue(searchResult);
      const query = new SearchQueryBuilder().match('Feature Service').in('type');

      await searchPortalItems(query);

      expect(mockSearchItems).toHaveBeenCalledWith({ q: query, authentication: undefined });
    });

    it('merges resolved auth into full ISearchOptions without clobbering explicit auth', async () => {
      mockSearchItems.mockResolvedValue(searchResult);
      const explicitAuth = { getToken: () => Promise.resolve('explicit') };

      await searchPortalItems(
        { q: 'wildfire', num: 20, authentication: explicitAuth as never },
        { token: 'fallback' }
      );

      expect(mockSearchItems).toHaveBeenCalledWith({
        q: 'wildfire',
        num: 20,
        authentication: explicitAuth,
      });
    });
  });
});
