import { Task, TaskOptions } from '@/Task'
import { Service } from '@/Services/Service'

export interface IdentifyFeaturesOptions {
  url: string
  layers?: number[] | number | string
  layerDefs?: Record<string, string>
  tolerance?: number
  returnGeometry?: boolean
  maxAllowableOffset?: number
  geometryPrecision?: number
  dynamicLayers?: unknown[]
  mapExtent?: [number, number, number, number]
  imageDisplay?: [number, number, number]
  sr?: string | number
  layerTimeOptions?: Record<string, unknown>
  time?: number[] | Date[]
  fetchOptions?: RequestInit
}

export interface IdentifyResult {
  layerId: number
  layerName: string
  value: string
  displayFieldName: string
  attributes: Record<string, unknown>
  geometry?: unknown
  geometryType?: string
}

export interface IdentifyResponse {
  results: IdentifyResult[]
}

export interface GeometryInput {
  x: number
  y: number
  spatialReference?: {
    wkid: number
    latestWkid?: number
  }
}

/**
 * IdentifyFeatures task for performing identify operations against ArcGIS Map Services
 * Similar to Esri Leaflet's identifyFeatures functionality
 */
export class IdentifyFeatures extends Task {
  protected setters = {
    layers: 'layers',
    precision: 'geometryPrecision',
    tolerance: 'tolerance',
    returnGeometry: 'returnGeometry',
  }

  protected path = '/identify'

  protected params: Record<string, unknown> = {
    sr: 4326,
    layers: 'all',
    tolerance: 3,
    returnGeometry: true,
    f: 'json',
  }

  constructor(options: string | IdentifyFeaturesOptions | Service) {
    // Handle different input types and convert to TaskOptions format
    let taskOptions: string | TaskOptions

    if (typeof options === 'string') {
      taskOptions = options
    } else if (options instanceof Service) {
      // Extract URL from Service instance
      taskOptions = { url: (options as Service & { options: { url: string } }).options.url }
    } else {
      // It's IdentifyFeaturesOptions, use as TaskOptions
      taskOptions = options
    }

    super(taskOptions)
    this.path = '/identify'

    // Ensure dynamic setters are available even though subclass fields
    // are initialized after super() runs. This rebinds setter methods.
    if (this.setters) {
      for (const [method, param] of Object.entries(this.setters)) {
        ;(this as unknown as Record<string, unknown>)[method] = this.generateSetter(param, this)
      }
    }
  }

  /**
   * Perform identify operation at a point location
   */
  at(point: { lng: number; lat: number } | [number, number]): IdentifyFeatures {
    let geometry: GeometryInput

    if (Array.isArray(point)) {
      geometry = {
        x: point[0],
        y: point[1],
        spatialReference: { wkid: 4326 },
      }
    } else {
      geometry = {
        x: point.lng,
        y: point.lat,
        spatialReference: { wkid: 4326 },
      }
    }

    this.params.geometry = JSON.stringify(geometry)
    this.params.geometryType = 'esriGeometryPoint'
    return this
  }

  // Strongly-typed chainable setters for common Identify params
  layers(value: number[] | number | string): IdentifyFeatures {
    this.params.layers = value
    return this
  }

  tolerance(value: number): IdentifyFeatures {
    this.params.tolerance = value
    return this
  }

  returnGeometry(value: boolean): IdentifyFeatures {
    this.params.returnGeometry = value
    return this
  }

  precision(value: number): IdentifyFeatures {
    this.params.geometryPrecision = value
    return this
  }

  /**
   * Set the map extent and image display for the identify operation
   */
  on(map: {
    getBounds(): {
      toArray(): [[number, number], [number, number]]
    }
    getCanvas(): { width: number; height: number }
  }): IdentifyFeatures {
    try {
      const bounds = map.getBounds().toArray()
      this.params.mapExtent = [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]].join(',')

      const canvas = map.getCanvas()
      this.params.imageDisplay = [canvas.width, canvas.height, 96].join(',')
    } catch (error) {
      console.warn('Could not extract map extent and display info:', error)
    }
    return this
  }

  /**
   * Set layer definitions for filtering specific layers
   */
  layerDef(layerId: number | string, whereClause: string): IdentifyFeatures {
    const currentLayerDefs = (this.params.layerDefs as string) || ''
    this.params.layerDefs = currentLayerDefs
      ? `${currentLayerDefs};${layerId}:${whereClause}`
      : `${layerId}:${whereClause}`
    return this
  }

  /**
   * Simplify geometries based on map resolution
   */
  simplify(
    map: {
      getBounds(): {
        getWest(): number
        getEast(): number
      }
      getSize(): { x: number; y: number }
    },
    factor: number
  ): IdentifyFeatures {
    const bounds = map.getBounds()
    const mapWidth = Math.abs(bounds.getWest() - bounds.getEast())
    this.params.maxAllowableOffset = (mapWidth / map.getSize().x) * factor
    return this
  }

  /**
   * Execute the identify operation
   */
  async run(): Promise<GeoJSON.FeatureCollection> {
    try {
      const response = await this.request<{
        results: Array<{
          layerId: number
          layerName: string
          value: string
          displayFieldName: string
          attributes: Record<string, unknown>
          geometry?: unknown
        }>
      }>()

      return this._convertToGeoJSON(response)
    } catch (error) {
      console.error('IdentifyFeatures error:', error)
      throw error
    }
  }

  private _convertToGeoJSON(response: {
    results: Array<{
      layerId: number
      layerName: string
      value: string
      displayFieldName: string
      attributes: Record<string, unknown>
      geometry?: unknown
    }>
  }): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = (response.results || []).map(result => {
      const feature: GeoJSON.Feature = {
        type: 'Feature',
        properties: {
          ...result.attributes,
          layerId: result.layerId,
          layerName: result.layerName,
          displayFieldName: result.displayFieldName,
          value: result.value,
        },
        geometry: (result.geometry as GeoJSON.Geometry) || null,
      }

      // Add layerId as a custom property for easier identification
      const featureWithLayerId = feature as GeoJSON.Feature & { layerId: number }
      featureWithLayerId.layerId = result.layerId

      return feature
    })

    return {
      type: 'FeatureCollection',
      features,
    }
  }
}
