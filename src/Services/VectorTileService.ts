import { cleanTrailingSlash, getServiceDetails } from '@/utils';
import {
  Map,
  VectorTileServiceOptions,
  VectorSourceOptions,
  ServiceMetadata,
  SourceSpecification,
} from '@/types';

interface VectorTileServiceExtendedOptions extends VectorTileServiceOptions {
  useDefaultStyle?: boolean;
  fetchOptions?: RequestInit;
}

interface StyleLayoutPaint {
  [key: string]: unknown;
}

interface StyleData {
  type: string;
  // Mapbox layer definition fields
  source?: string;
  'source-layer': string;
  layout?: StyleLayoutPaint;
  paint?: StyleLayoutPaint;
}

export class VectorTileService {
  private _sourceId: string;
  private _map: Map;
  private _defaultEsriOptions: { useDefaultStyle: boolean };
  private _serviceMetadata: ServiceMetadata | null = null;
  private _defaultStyleData: StyleData | null = null;

  public vectorSrcOptions?: VectorSourceOptions;
  public esriServiceOptions: VectorTileServiceExtendedOptions;

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: VectorTileServiceExtendedOptions,
    vectorSrcOptions?: VectorSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.');
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url);

    this._sourceId = sourceId;
    this._map = map;

    this._defaultEsriOptions = {
      useDefaultStyle: true,
    };

    this.vectorSrcOptions = vectorSrcOptions;
    this.esriServiceOptions = esriServiceOptions;

    this._createSource();
  }

  get options(): Required<VectorTileServiceExtendedOptions> {
    return {
      ...this._defaultEsriOptions,
      ...this.esriServiceOptions,
    } as Required<VectorTileServiceExtendedOptions>;
  }

  get _tileUrl(): string {
    if (this._serviceMetadata === null) return '/tile/{z}/{y}/{x}.pbf';
    return this._serviceMetadata.tiles?.[0] || '/tile/{z}/{y}/{x}.pbf';
  }

  get _source(): VectorSourceOptions & { type: 'vector'; tiles: string[] } {
    return {
      ...(this.vectorSrcOptions || {}),
      type: 'vector',
      tiles: [`${this.options.url}${this._tileUrl}`],
    } as VectorSourceOptions & { type: 'vector'; tiles: string[] };
  }

  private _createSource(): void {
    this._map.addSource(this._sourceId, this._source as unknown as SourceSpecification);
  }

  private _mapToLocalSource(style: StyleData): StyleData {
    return {
      type: style.type,
      source: this._sourceId,
      'source-layer': style['source-layer'],
      layout: style.layout,
      paint: style.paint,
    };
  }

  get defaultStyle(): StyleData {
    // Consumers should only call after getStyle resolves
    return this._mapToLocalSource(this._defaultStyleData!);
  }

  get _styleUrl(): string {
    // Return a RELATIVE path which will be prefixed with options.url during fetch
    // ArcGIS VectorTileServer typically exposes defaultStyles like 'resources/styles/root.json'
    if (this._serviceMetadata === null) return 'resources/styles/root.json';
    return this._serviceMetadata.defaultStyles || 'resources/styles/root.json';
  }

  getStyle(): Promise<StyleData> {
    // Always resolve the mapped defaultStyle so the 'source' equals this._sourceId
    if (this._defaultStyleData !== null) return Promise.resolve(this.defaultStyle);
    return new Promise((resolve, reject) => {
      const load = () =>
        this._retrieveStyle()
          .then(() => resolve(this.defaultStyle))
          .catch(error => reject(error));

      if (this._serviceMetadata === null) {
        this.getMetadata()
          .then(() => load())
          .catch(error => reject(error));
      } else {
        load();
      }
    });
  }

  private _retrieveStyle(): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch(`${this.options.url}/${this._styleUrl}`, this.esriServiceOptions.fetchOptions)
        .then(response => {
          if (!response.ok) throw new Error(`Failed to fetch style: ${response.status}`);
          return response.json();
        })
        .then(data => {
          if (!data || !Array.isArray(data.layers) || data.layers.length === 0) {
            throw new Error('VectorTile style document is missing layers.');
          }
          // Use the first layer as a simple default style for the demo
          this._defaultStyleData = data.layers[0];
          resolve();
        })
        .catch(error => reject(error));
    });
  }

  getMetadata(): Promise<ServiceMetadata> {
    if (this._serviceMetadata !== null) return Promise.resolve(this._serviceMetadata);
    return new Promise((resolve, reject) => {
      getServiceDetails(this.esriServiceOptions.url, this.esriServiceOptions.fetchOptions)
        .then(data => {
          this._serviceMetadata = data;
          resolve(this._serviceMetadata);
        })
        .catch(err => reject(err));
    });
  }

  update(): void {
    // Vector tile services don't need dynamic updates like dynamic services
  }

  remove(): void {
    this._map.removeSource(this._sourceId);
  }
}
