import { cleanTrailingSlash, getServiceDetails, updateAttribution } from './utils'
import { Map, EsriServiceOptions, RasterSourceOptions, ServiceMetadata } from './types'

interface DynamicMapServiceOptions extends EsriServiceOptions {
  from?: Date | number
  to?: Date | number
  fetchOptions?: RequestInit
}

export class DynamicMapService {
  private _sourceId: string
  private _map: Map
  private _defaultEsriOptions: Omit<Required<EsriServiceOptions>, 'url' | 'time'>
  private _serviceMetadata: ServiceMetadata | null = null
  
  public rasterSrcOptions?: RasterSourceOptions
  public esriServiceOptions: DynamicMapServiceOptions

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: DynamicMapServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.')
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url)

    this._sourceId = sourceId
    this._map = map

    this._defaultEsriOptions = {
      layers: false,
      layerDefs: false,
      format: 'png24',
      dpi: 96,
      transparent: true,
      getAttributionFromService: true
    }

    this.rasterSrcOptions = rasterSrcOptions
    this.esriServiceOptions = esriServiceOptions
    this._createSource()

    if (this.options.getAttributionFromService) this.setAttributionFromService()
  }

  get options(): Required<DynamicMapServiceOptions> {
    return {
      ...this._defaultEsriOptions,
      ...this.esriServiceOptions
    } as Required<DynamicMapServiceOptions>
  }

  get _layersStr(): string | false {
    let lyrs = this.options.layers
    if (!lyrs) return false
    if (!Array.isArray(lyrs)) lyrs = [lyrs]
    return `show:${lyrs.join(',')}`
  }

  get _layerDefs(): string | false {
    if (this.options.layerDefs !== false) return JSON.stringify(this.options.layerDefs)
    return false
  }

  get _time(): string | false {
    if (!this.options.to) return false
    let from = this.options.from
    let to = this.options.to
    if (from instanceof Date) from = from.valueOf()
    if (to instanceof Date) to = to.valueOf()

    return `${from},${to}`
  }

  get _source(): any {
    const tileSize = this.rasterSrcOptions?.tileSize ?? 256
    // These are the bare minimum parameters
    const params = new URLSearchParams({
      bboxSR: '3857',
      imageSR: '3857',
      format: this.options.format,
      layers: this._layersStr || '',
      transparent: this.options.transparent.toString(),
      size: `${tileSize},${tileSize}`,
      f: 'image'
    })

    // These are optional params
    if (this._time) params.append('time', this._time)
    if (this._layerDefs) params.append('layerDefs', this._layerDefs)

    return {
      type: 'raster',
      tiles: [
        `${this.options.url}/export?bbox={bbox-epsg-3857}&${params.toString()}`
      ],
      tileSize,
      ...this.rasterSrcOptions
    }
  }

  private _createSource(): void {
    this._map.addSource(this._sourceId, this._source)
  }

  // This requires hooking into some undocumented methods
  private _updateSource(): void {
    const src = this._map.getSource(this._sourceId) as any
    src.tiles[0] = this._source.tiles[0]
    src._options = this._source

    if (src.setTiles) {
      // New MapboxGL >= 2.13.0
      src.setTiles(this._source.tiles)
    } else if ((this._map as any).style.sourceCaches) {
      // Old MapboxGL and MaplibreGL
      (this._map as any).style.sourceCaches[this._sourceId].clearTiles()
      ;(this._map as any).style.sourceCaches[this._sourceId].update((this._map as any).transform)
    } else if ((this._map as any).style._otherSourceCaches) {
      (this._map as any).style.sourceCaches[this._sourceId].clearTiles()
      ;(this._map as any).style.sourceCaches[this._sourceId].update((this._map as any).transform)
    }
  }

  setLayerDefs(obj: Record<string, string>): void {
    this.esriServiceOptions.layerDefs = obj
    this._updateSource()
  }

  setLayers(arr: number[] | number): void {
    this.esriServiceOptions.layers = arr
    this._updateSource()
  }

  setDate(from: Date | number, to: Date | number): void {
    this.esriServiceOptions.from = from
    this.esriServiceOptions.to = to
    this._updateSource()
  }

  setAttributionFromService(): Promise<void> {
    if (this._serviceMetadata) {
      updateAttribution(this._serviceMetadata.copyrightText || '', this._sourceId, this._map)
      return Promise.resolve()
    } else {
      return this.getMetadata().then(() => {
        updateAttribution(this._serviceMetadata?.copyrightText || '', this._sourceId, this._map)
      })
    }
  }

  getMetadata(): Promise<ServiceMetadata> {
    if (this._serviceMetadata !== null) return Promise.resolve(this._serviceMetadata)
    return new Promise((resolve, reject) => {
      getServiceDetails(this.esriServiceOptions.url, this.esriServiceOptions.fetchOptions)
        .then((data) => {
          this._serviceMetadata = data
          resolve(this._serviceMetadata)
        })
        .catch(err => reject(err))
    })
  }

  get _layersStrIdentify(): string | false {
    const layersStr = this._layersStr
    return layersStr ? layersStr.replace('show', 'visible') : false
  }

  identify(lnglat: { lng: number; lat: number }, returnGeometry: boolean = false): Promise<any> {
    const canvas = (this._map as any).getCanvas()
    const bounds = (this._map as any).getBounds().toArray()
    
    const params = new URLSearchParams({
      sr: '4326',
      geometryType: 'esriGeometryPoint',
      geometry: JSON.stringify({
        x: lnglat.lng,
        y: lnglat.lat,
        spatialReference: {
          wkid: 4326
        }
      }),
      tolerance: '3',
      returnGeometry: returnGeometry.toString(),
      imageDisplay: `${canvas.width},${canvas.height},96`,
      mapExtent: `${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`,
      layers: this._layersStrIdentify || '',
      f: 'json'
    })

    if (this._layerDefs) params.append('layerDefs', this._layerDefs)
    if (this._time) params.append('time', this._time)

    return new Promise((resolve, reject) => {
      fetch(`${this.esriServiceOptions.url}/identify?${params.toString()}`, this.esriServiceOptions.fetchOptions)
        .then(response => response.json())
        .then(data => resolve(data))
        .catch(error => reject(error))
    })
  }

  update(): void {
    this._updateSource()
  }

  remove(): void {
    this._map.removeSource(this._sourceId)
  }
}
