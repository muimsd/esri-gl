import { cleanTrailingSlash, getServiceDetails, removeMapSource, updateAttribution } from '@/utils';
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

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: TiledMapServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.');
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url);

    this._sourceId = sourceId;
    this._map = map;

    this.rasterSrcOptions = rasterSrcOptions;
    this.esriServiceOptions = esriServiceOptions;
    this._createSource();

    if (esriServiceOptions.getAttributionFromService) {
      this.setAttributionFromService().catch(() => {
        // Silently handle attribution fetch errors to prevent unhandled rejections
      });
    }
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
    return new Promise((resolve, reject) => {
      getServiceDetails(
        this.esriServiceOptions.url,
        this.esriServiceOptions.fetchOptions,
        (this.esriServiceOptions as any).token
      )
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
