import { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils';
import { Map, ImageServiceOptions, RasterSourceOptions, ServiceMetadata } from '@/types/types';

interface ImageServiceExtendedOptions extends ImageServiceOptions {
  from?: Date | number
  to?: Date | number
  fetchOptions?: RequestInit
}

export class ImageService {
  private _sourceId: string;
  private _map: Map;
  private _defaultEsriOptions: Omit<
    Required<ImageServiceOptions>,
    'url' | 'renderingRule' | 'mosaicRule' | 'bbox' | 'size' | 'bboxSR' | 'imageSR'
  >;
  private _serviceMetadata: ServiceMetadata | null = null;

  public rasterSrcOptions?: RasterSourceOptions;
  public esriServiceOptions: ImageServiceExtendedOptions;

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: ImageServiceExtendedOptions,
    rasterSrcOptions?: RasterSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.');
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url);

    this._sourceId = sourceId;
    this._map = map;

    this._defaultEsriOptions = {
      layers: false,
      layerDefs: false,
      format: 'jpgpng',
      dpi: 96,
      transparent: true,
      getAttributionFromService: true,
      time: false,
    };

    this.rasterSrcOptions = rasterSrcOptions;
    this.esriServiceOptions = esriServiceOptions;
    this._createSource();

    if (this.options.getAttributionFromService) this.setAttributionFromService();
  }

  get options(): Required<ImageServiceExtendedOptions> {
    return {
      ...this._defaultEsriOptions,
      ...this.esriServiceOptions,
    } as Required<ImageServiceExtendedOptions>;
  }

  get _time(): string | false {
    if (!this.options.to) return false;
    let from = this.options.from;
    let to = this.options.to;
    if (from instanceof Date) from = from.valueOf();
    if (to instanceof Date) to = to.valueOf();

    return `${from},${to}`;
  }

  get _source(): any {
    const tileSize = this.rasterSrcOptions?.tileSize ?? 256;
    // These are the bare minimum parameters
    const params = new URLSearchParams({
      bboxSR: '3857',
      imageSR: '3857',
      format: this.options.format,
      size: `${tileSize},${tileSize}`,
      f: 'image',
    });

    // These are optional params
    if (this._time) params.append('time', this._time);
    if (this.options.mosaicRule)
      params.append('mosaicRule', JSON.stringify(this.options.mosaicRule));
    if (this.options.renderingRule)
      params.append('renderingRule', JSON.stringify(this.options.renderingRule));

    return {
      type: 'raster',
      tiles: [`${this.options.url}/exportImage?bbox={bbox-epsg-3857}&${params.toString()}`],
      tileSize,
      ...this.rasterSrcOptions,
    };
  }

  private _createSource(): void {
    this._map.addSource(this._sourceId, this._source);
  }

  // This requires hooking into some undocumented methods
  private _updateSource(): void {
    const src = this._map.getSource(this._sourceId) as any;
    src.tiles[0] = this._source.tiles[0];
    src._options = this._source;

    if (src.setTiles) {
      // New MapboxGL >= 2.13.0
      src.setTiles(this._source.tiles);
    } else if ((this._map as any).style.sourceCaches) {
      // Old MapboxGL and MaplibreGL
      (this._map as any).style.sourceCaches[this._sourceId].clearTiles()
      ;(this._map as any).style.sourceCaches[this._sourceId].update((this._map as any).transform);
    } else if ((this._map as any).style._otherSourceCaches) {
      (this._map as any).style.sourceCaches[this._sourceId].clearTiles()
      ;(this._map as any).style.sourceCaches[this._sourceId].update((this._map as any).transform);
    }
  }

  setDate(from: Date | number, to: Date | number): void {
    this.esriServiceOptions.from = from;
    this.esriServiceOptions.to = to;
    this._updateSource();
  }

  setRenderingRule(rule: Record<string, any>): void {
    this.esriServiceOptions.renderingRule = rule;
    this._updateSource();
  }

  setMosaicRule(rule: Record<string, any>): void {
    this.esriServiceOptions.mosaicRule = rule;
    this._updateSource();
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
      getServiceDetails(this.esriServiceOptions.url, this.esriServiceOptions.fetchOptions)
        .then(data => {
          this._serviceMetadata = data;
          resolve(this._serviceMetadata);
        })
        .catch(err => reject(err));
    });
  }

  identify(lnglat: { lng: number; lat: number }, returnGeometry: boolean = false): Promise<any> {
    const canvas = (this._map as any).getCanvas();
    const bounds = (this._map as any).getBounds().toArray();

    const params = new URLSearchParams({
      sr: '4326',
      geometryType: 'esriGeometryPoint',
      geometry: JSON.stringify({
        x: lnglat.lng,
        y: lnglat.lat,
        spatialReference: {
          wkid: 4326,
        },
      }),
      tolerance: '3',
      returnGeometry: returnGeometry.toString(),
      imageDisplay: `${canvas.width},${canvas.height},96`,
      mapExtent: `${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`,
      f: 'json',
    });

    if (this._time) params.append('time', this._time);

    return new Promise((resolve, reject) => {
      fetch(
        `${this.esriServiceOptions.url}/identify?${params.toString()}`,
        this.esriServiceOptions.fetchOptions
      )
        .then(response => response.json())
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  update(): void {
    this._updateSource();
  }

  remove(): void {
    this._map.removeSource(this._sourceId);
  }
}
