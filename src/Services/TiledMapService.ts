import { cleanTrailingSlash, getServiceDetails, removeMapSource, updateAttribution } from '@/utils';
import type { EsriAuthentication } from '@/request';
import {
  isPortalItemId,
  resolveServiceUrl,
  type ResolveServiceUrlOptions,
} from '@/Portal/resolveServiceUrl';
import type { Map, EsriServiceOptions, RasterSourceOptions, ServiceMetadata } from '@/types';

interface TiledMapServiceOptions extends EsriServiceOptions {
  fetchOptions?: RequestInit;
}

interface RasterSource {
  type: 'raster';
  tiles: string[];
  tileSize?: number;
  attribution?: string;
  bounds?: number[];
  minzoom?: number;
  maxzoom?: number;
}

export class TiledMapService {
  private _sourceId: string;
  private _map: Map;
  private _serviceMetadata: ServiceMetadata | null = null;

  public rasterSrcOptions?: RasterSourceOptions;
  public esriServiceOptions: TiledMapServiceOptions;

  /**
   * Resolves once the source has been created — synchronously for a plain `url`,
   * or after a portal item id `url` has been resolved to a service url.
   */
  public sourceReady: Promise<void>;

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: TiledMapServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.');
    }

    this._sourceId = sourceId;
    this._map = map;

    this.rasterSrcOptions = rasterSrcOptions;
    this.esriServiceOptions = esriServiceOptions;
    this.sourceReady = this._initSource();
  }

  /** Resolve `url` (service url or portal item id) and add the source. */
  private _initSource(): Promise<void> {
    const url = this.esriServiceOptions.url;
    if (!isPortalItemId(url)) {
      this.esriServiceOptions.url = cleanTrailingSlash(url);
      this._afterUrlResolved();
      return Promise.resolve();
    }
    return resolveServiceUrl(url, this._portalOptions()).then(resolved => {
      this.esriServiceOptions.url = resolved;
      this._afterUrlResolved();
    });
  }

  private _afterUrlResolved(): void {
    this._createSource();
    if (this.esriServiceOptions.getAttributionFromService) {
      this.setAttributionFromService().catch(() => {
        // Silently handle attribution fetch errors to prevent unhandled rejections
      });
    }
  }

  private _portalOptions(): ResolveServiceUrlOptions {
    const o = this.esriServiceOptions as {
      token?: string;
      apiKey?: string;
      authentication?: EsriAuthentication;
      portal?: string;
    };
    return { token: o.token, apiKey: o.apiKey, authentication: o.authentication, portal: o.portal };
  }

  get _source(): RasterSource {
    return {
      ...this.rasterSrcOptions,
      type: 'raster',
      tiles: [
        (this.esriServiceOptions as any).token
          ? `${this.esriServiceOptions.url}/tile/{z}/{y}/{x}?token=${(this.esriServiceOptions as any).token}`
          : `${this.esriServiceOptions.url}/tile/{z}/{y}/{x}`,
      ],
      tileSize: this.rasterSrcOptions?.tileSize || 256,
    };
  }

  private _createSource(): void {
    // Check if source already exists before adding
    if (!this._map.getSource(this._sourceId)) {
      this._map.addSource(
        this._sourceId,
        this._source as unknown as Parameters<Map['addSource']>[1]
      );
    }
  }

  setToken(token: string | null): void {
    (this.esriServiceOptions as any).token = token ?? undefined;
    // Tiled sources need recreation to pick up new URL
    const src = this._map.getSource(this._sourceId) as any;
    if (src && src.setTiles) {
      src.setTiles(this._source.tiles);
    }
  }

  setAttributionFromService(): Promise<void> {
    if (this._serviceMetadata) {
      updateAttribution(this._serviceMetadata.copyrightText || '', this._sourceId, this._map);
      return Promise.resolve();
    } else {
      return this.getMetadata().then(() => {
        updateAttribution(this._serviceMetadata?.copyrightText || '', this._sourceId, this._map);
      });
    }
  }

  getMetadata(): Promise<ServiceMetadata> {
    if (this._serviceMetadata !== null) return Promise.resolve(this._serviceMetadata);
    const { token, apiKey, authentication } = this.esriServiceOptions as {
      token?: string;
      apiKey?: string;
      authentication?: EsriAuthentication;
    };
    return new Promise((resolve, reject) => {
      getServiceDetails(this.esriServiceOptions.url, { token, apiKey, authentication })
        .then(data => {
          this._serviceMetadata = data;
          resolve(data);
        })
        .catch(err => reject(err));
    });
  }

  update(): void {
    // Tiled sources use static tile URLs and don't support hot-updates.
    // This is a no-op to satisfy the common service interface.
  }

  remove(): void {
    removeMapSource(this._map, this._sourceId);
  }
}
