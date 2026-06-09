/**
 * Portal item resolution.
 *
 * Turns an ArcGIS portal item id into ready-to-render esri-gl services using
 * `@esri/arcgis-rest-portal`. Two entry points are provided:
 *
 * - {@link serviceFromPortalItem} — resolve a single-layer item (Feature / Map /
 *   Image / Vector Tile service) to the matching esri-gl service.
 * - {@link servicesFromWebMap} — read a Web Map item's `operationalLayers`
 *   (and optionally its basemap) and instantiate a service per layer.
 */
import { getItem, getItemData, searchItems, SearchQueryBuilder } from '@esri/arcgis-rest-portal';
import type {
  IItem,
  ISearchResult,
  ISearchOptions,
  IGroup,
  IUser,
  IPagingParams,
} from '@esri/arcgis-rest-portal';
import { resolveAuthentication, type EsriAuthOptions } from '@/request';

export { SearchQueryBuilder };
export type { ISearchResult, ISearchOptions, IItem, IGroup, IUser, IPagingParams };
import { cleanTrailingSlash } from '@/utils';
import type { Map } from '@/types';

import { DynamicMapService } from '@/Services/DynamicMapService';
import { TiledMapService } from '@/Services/TiledMapService';
import { ImageService } from '@/Services/ImageService';
import { VectorTileService } from '@/Services/VectorTileService';
import { FeatureService } from '@/Services/FeatureService';

/** Any esri-gl service instance a portal item can resolve to. */
export type PortalResolvedService =
  | DynamicMapService
  | TiledMapService
  | ImageService
  | VectorTileService
  | FeatureService;

/** esri-gl service kinds, used to label resolution results. */
export type PortalServiceKind = 'dynamic' | 'tiled' | 'image' | 'vector-tile' | 'feature';

export interface PortalRequestOptions extends EsriAuthOptions {
  /** Portal sharing REST URL. Defaults to ArcGIS Online. */
  portal?: string;
}

export interface PortalItemServiceOptions extends PortalRequestOptions {
  /** For multi-layer Feature Services, which sublayer to load (default 0). */
  layerId?: number;
  /** Extra options merged into the constructed service's options object. */
  serviceOptions?: Record<string, unknown>;
  /** Raster source options (Dynamic / Tiled / Image services). */
  rasterSrcOptions?: Record<string, unknown>;
  /** Vector source options (Vector Tile service). */
  vectorSrcOptions?: Record<string, unknown>;
  /** GeoJSON source options (Feature service). */
  geojsonSourceOptions?: Record<string, unknown>;
}

export interface PortalServiceResult {
  /** The instantiated esri-gl service. */
  service: PortalResolvedService;
  /** Which kind of service was created. */
  kind: PortalServiceKind;
  /** The source id registered on the map. */
  sourceId: string;
  /** The service URL the item resolved to. */
  url: string;
  /** The portal item (single-item resolution only). */
  item?: IItem;
  /** Human-readable title (item title or web map layer title). */
  title?: string;
}

function requestOptions(options: PortalRequestOptions | undefined) {
  const authentication = resolveAuthentication(options);
  const opts: { authentication?: ReturnType<typeof resolveAuthentication>; portal?: string } = {};
  if (authentication) opts.authentication = authentication;
  if (options?.portal) opts.portal = options.portal;
  return opts;
}

/** Shared auth fields forwarded into a constructed service's options. */
function authServiceFields(options: EsriAuthOptions | undefined) {
  const fields: Record<string, unknown> = {};
  if (options?.authentication !== undefined) fields.authentication = options.authentication;
  if (options?.apiKey !== undefined) fields.apiKey = options.apiKey;
  if (options?.token !== undefined) fields.token = options.token;
  return fields;
}

/** True when a Feature Service url already points at a specific sublayer. */
function urlHasLayerIndex(url: string): boolean {
  return /\/\d+$/.test(cleanTrailingSlash(url));
}

/**
 * Construct an esri-gl service for a known ArcGIS service `url` and a
 * normalized service `kind`. Shared by single-item and web map resolution.
 */
function constructService(
  kind: PortalServiceKind,
  sourceId: string,
  map: Map,
  url: string,
  options: PortalItemServiceOptions | undefined
): PortalResolvedService {
  const auth = authServiceFields(options);
  const serviceOptions = options?.serviceOptions ?? {};
  const baseOptions = { url, ...auth, ...serviceOptions };

  switch (kind) {
    case 'tiled':
      return new TiledMapService(
        sourceId,
        map,
        baseOptions as never,
        options?.rasterSrcOptions as never
      );
    case 'image':
      return new ImageService(
        sourceId,
        map,
        baseOptions as never,
        options?.rasterSrcOptions as never
      );
    case 'vector-tile':
      return new VectorTileService(
        sourceId,
        map,
        baseOptions as never,
        options?.vectorSrcOptions as never
      );
    case 'feature': {
      let layerUrl = cleanTrailingSlash(url);
      if (!urlHasLayerIndex(layerUrl)) {
        layerUrl = `${layerUrl}/${options?.layerId ?? 0}`;
      }
      return new FeatureService(
        sourceId,
        map,
        { ...baseOptions, url: layerUrl } as never,
        options?.geojsonSourceOptions as never
      );
    }
    case 'dynamic':
    default:
      return new DynamicMapService(
        sourceId,
        map,
        baseOptions as never,
        options?.rasterSrcOptions as never
      );
  }
}

/** Map a portal item `type` (+ typeKeywords) to an esri-gl service kind. */
function kindFromItemType(type: string, typeKeywords: string[] = []): PortalServiceKind | null {
  switch (type) {
    case 'Feature Service':
    case 'Feature Layer':
      return 'feature';
    case 'Image Service':
      return 'image';
    case 'Vector Tile Service':
      return 'vector-tile';
    case 'Map Service': {
      const tiled = typeKeywords.some(k => /tiled|cached/i.test(k));
      return tiled ? 'tiled' : 'dynamic';
    }
    default:
      return null;
  }
}

/**
 * Resolve a single-layer portal item to the matching esri-gl service and add
 * its source to the map.
 *
 * @example
 * const { service } = await serviceFromPortalItem('my-source', map, 'a1b2c3', { token });
 */
export async function serviceFromPortalItem(
  sourceId: string,
  map: Map,
  itemId: string,
  options?: PortalItemServiceOptions
): Promise<PortalServiceResult> {
  const item = await getItem(itemId, requestOptions(options));

  if (!item.url) {
    throw new Error(`Portal item ${itemId} ("${item.title}") has no service url.`);
  }

  const kind = kindFromItemType(item.type, item.typeKeywords);
  if (!kind) {
    throw new Error(`Portal item ${itemId} has unsupported type "${item.type}" for esri-gl.`);
  }

  const service = constructService(kind, sourceId, map, item.url, options);

  return { service, kind, sourceId, url: item.url, item, title: item.title };
}

// -----------------------------
// Web Map resolution
// -----------------------------

interface WebMapLayer {
  id?: string;
  title?: string;
  url?: string;
  styleUrl?: string;
  itemId?: string;
  layerType?: string;
  visibility?: boolean;
}

export interface WebMapOptions extends PortalItemServiceOptions {
  /** Also instantiate the web map's basemap layers (default false). */
  includeBasemap?: boolean;
  /** Prefix for generated source ids (default the web map item id). */
  sourceIdPrefix?: string;
}

/** Map a Web Map operationalLayer `layerType` to an esri-gl service kind. */
function kindFromLayerType(layerType: string | undefined): PortalServiceKind | null {
  switch (layerType) {
    case 'ArcGISFeatureLayer':
      return 'feature';
    case 'ArcGISMapServiceLayer':
      return 'dynamic';
    case 'ArcGISTiledMapServiceLayer':
      return 'tiled';
    case 'ArcGISImageServiceLayer':
      return 'image';
    case 'VectorTileLayer':
      return 'vector-tile';
    default:
      return null;
  }
}

/**
 * Read a Web Map item's data and instantiate an esri-gl service for each
 * supported operational layer (optionally including basemap layers).
 * Unsupported layer types are skipped.
 *
 * @example
 * const layers = await servicesFromWebMap(map, 'webmap-item-id', { token });
 * layers.forEach(({ service, title }) => { ... });
 */
export async function servicesFromWebMap(
  map: Map,
  itemId: string,
  options?: WebMapOptions
): Promise<PortalServiceResult[]> {
  const data = (await getItemData(itemId, requestOptions(options))) as {
    operationalLayers?: WebMapLayer[];
    baseMap?: { baseMapLayers?: WebMapLayer[] };
  } | null;

  if (!data) {
    throw new Error(`Web Map ${itemId} has no item data (is it shared / a Web Map?).`);
  }

  const prefix = options?.sourceIdPrefix ?? itemId;
  const results: PortalServiceResult[] = [];

  const layers: WebMapLayer[] = [...(data.operationalLayers ?? [])];
  if (options?.includeBasemap && data.baseMap?.baseMapLayers) {
    layers.push(...data.baseMap.baseMapLayers);
  }

  layers.forEach((layer, index) => {
    const kind = kindFromLayerType(layer.layerType);
    const url = layer.url ?? layer.styleUrl;
    if (!kind || !url) return; // skip unsupported / urlless layers

    const sourceId = layer.id ? `${prefix}-${layer.id}` : `${prefix}-${index}`;
    try {
      const service = constructService(kind, sourceId, map, url, options);
      results.push({ service, kind, sourceId, url, title: layer.title });
    } catch (error) {
      console.warn(`Skipping web map layer "${layer.title ?? sourceId}":`, error);
    }
  });

  return results;
}

// -----------------------------
// Portal item search
// -----------------------------

/**
 * Search an ArcGIS portal for items, e.g. to discover services to load.
 * Thin wrapper over `searchItems` from `@esri/arcgis-rest-portal`; accepts a
 * query string, a {@link SearchQueryBuilder}, or a full `ISearchOptions`.
 *
 * @example
 * const { results } = await searchPortalItems('type:"Feature Service" AND owner:esri');
 * // or with auth / paging:
 * await searchPortalItems({ q: 'wildfire', num: 20, authentication }, { token });
 */
export async function searchPortalItems(
  search: string | SearchQueryBuilder | ISearchOptions,
  options?: PortalRequestOptions
): Promise<ISearchResult<IItem>> {
  if (typeof search === 'string' || search instanceof SearchQueryBuilder) {
    const { authentication } = requestOptions(options);
    return searchItems({ q: search, authentication });
  }
  // Full ISearchOptions: merge in resolved auth/portal unless already provided.
  const { authentication } = requestOptions(options);
  return searchItems({ authentication, ...search });
}
