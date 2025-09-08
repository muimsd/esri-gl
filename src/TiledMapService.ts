import { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils'
import { Map, EsriServiceOptions, RasterSourceOptions, ServiceMetadata } from '@/types/types'

interface TiledMapServiceOptions extends EsriServiceOptions {
  fetchOptions?: RequestInit
}

export class TiledMapService {
  private _sourceId: string
  private _map: Map
  private _serviceMetadata: ServiceMetadata | null = null
  
  public rasterSrcOptions?: RasterSourceOptions
  public esriServiceOptions: TiledMapServiceOptions

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: TiledMapServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.')
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url)

    this._sourceId = sourceId
    this._map = map

    this.rasterSrcOptions = rasterSrcOptions
    this.esriServiceOptions = esriServiceOptions
    this._createSource()

    if (esriServiceOptions.getAttributionFromService) this.setAttributionFromService()
  }

  get _source(): any {
    return {
      ...this.rasterSrcOptions,
      type: 'raster',
      tiles: [
        `${this.esriServiceOptions.url}/tile/{z}/{y}/{x}`
      ],
      tileSize: 256
    }
  }

  private _createSource(): void {
    this._map.addSource(this._sourceId, this._source)
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
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  update(): void {
    // Tiled services don't need dynamic updates like dynamic services
  }

  remove(): void {
    this._map.removeSource(this._sourceId)
  }
}
