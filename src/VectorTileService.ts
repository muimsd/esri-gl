import { cleanTrailingSlash, getServiceDetails } from './utils'
import { Map, VectorTileServiceOptions, VectorSourceOptions, ServiceMetadata } from './types'

interface VectorTileServiceExtendedOptions extends VectorTileServiceOptions {
  useDefaultStyle?: boolean
  fetchOptions?: RequestInit
}

interface StyleData {
  type: string
  'source-layer': string
  layout?: Record<string, any>
  paint?: Record<string, any>
}

export class VectorTileService {
  private _sourceId: string
  private _map: Map
  private _defaultEsriOptions: { useDefaultStyle: boolean }
  private _serviceMetadata: ServiceMetadata | null = null
  private _defaultStyleData: StyleData | null = null
  
  public vectorSrcOptions?: VectorSourceOptions
  public esriServiceOptions: VectorTileServiceExtendedOptions

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: VectorTileServiceExtendedOptions,
    vectorSrcOptions?: VectorSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.')
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url)

    this._sourceId = sourceId
    this._map = map

    this._defaultEsriOptions = {
      useDefaultStyle: true
    }

    this.vectorSrcOptions = vectorSrcOptions
    this.esriServiceOptions = esriServiceOptions

    this._createSource()
  }

  get options(): Required<VectorTileServiceExtendedOptions> {
    return {
      ...this._defaultEsriOptions,
      ...this.esriServiceOptions
    } as Required<VectorTileServiceExtendedOptions>
  }

  get _tileUrl(): string {
    if (this._serviceMetadata === null) return '/tile/{z}/{y}/{x}.pbf'
    return this._serviceMetadata.tiles?.[0] || '/tile/{z}/{y}/{x}.pbf'
  }

  get _source(): any {
    return {
      ...this.vectorSrcOptions,
      type: 'vector',
      tiles: [
        `${this.options.url}${this._tileUrl}`
      ]
    }
  }

  private _createSource(): void {
    this._map.addSource(this._sourceId, this._source)
  }

  get defaultStyle(): any {
    if (this._defaultStyleData === null) return {}
    return {
      type: this._defaultStyleData.type,
      source: this._sourceId,
      'source-layer': this._defaultStyleData['source-layer'],
      layout: this._defaultStyleData.layout,
      paint: this._defaultStyleData.paint
    }
  }

  get _styleUrl(): string {
    if (this._serviceMetadata === null) return 'resources/styles'
    return `${this.options.url}/${this._serviceMetadata.defaultStyles || 'resources/styles'}`
  }

  getStyle(): Promise<StyleData> {
    if (this._defaultStyleData !== null) return Promise.resolve(this._defaultStyleData)
    return new Promise((resolve, reject) => {
      if (this._serviceMetadata !== null) {
        this.getMetadata()
          .then(() => {
            this._retrieveStyle()
              .then(() => {
                resolve(this._defaultStyleData!)
              })
              .catch(error => reject(error))
          })
          .catch(error => reject(error))
      } else {
        this._retrieveStyle()
          .then(() => {
            resolve(this._defaultStyleData!)
          })
          .catch(error => reject(error))
      }
    })
  }

  private _retrieveStyle(): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch(`${this.options.url}/${this._styleUrl}`, this.esriServiceOptions.fetchOptions)
        .then(response => response.json())
        .then((data) => {
          this._defaultStyleData = data.layers[0]
          resolve()
        })
        .catch(error => reject(error))
    })
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

  update(): void {
    // Vector tile services don't need dynamic updates like dynamic services
  }

  remove(): void {
    this._map.removeSource(this._sourceId)
  }
}
