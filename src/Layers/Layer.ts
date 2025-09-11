import { Map } from '../types'

export interface LayerOptions {
  url?: string
  opacity?: number
  attribution?: string
  interactive?: boolean
  zIndex?: number
  className?: string
}

/**
 * Base Layer class for MapLibre GL JS layers
 * Similar to Esri Leaflet's layer functionality but adapted for MapLibre
 * 
 * This is equivalent to Leaflet's Layer class but for MapLibre GL JS
 */
export class Layer {
  public options: LayerOptions
  protected _map?: Map
  protected _sourceId: string
  protected _layerId: string

  constructor(options: LayerOptions = {}) {
    this.options = {
      opacity: 1,
      interactive: false,
      zIndex: 0,
      ...options
    }
    
    // Generate unique IDs
    this._sourceId = `layer-source-${Math.random().toString(36).substr(2, 9)}`
    this._layerId = `layer-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Add layer to map
   */
  addTo(map: Map): Layer {
    this._map = map
    this._createSource()
    this._createLayer()
    return this
  }

  /**
   * Remove layer from map
   */
  remove(): Layer {
    if (this._map) {
      if (this._map.getLayer(this._layerId)) {
        this._map.removeLayer(this._layerId)
      }
      if (this._map.getSource(this._sourceId)) {
        this._map.removeSource(this._sourceId)
      }
      this._map = undefined
    }
    return this
  }

  /**
   * Set layer opacity
   */
  setOpacity(opacity: number): Layer {
    this.options.opacity = opacity
    if (this._map && this._map.getLayer(this._layerId)) {
      this._map.setPaintProperty(this._layerId, 'raster-opacity', opacity)
    }
    return this
  }

  /**
   * Get layer opacity
   */
  getOpacity(): number {
    return this.options.opacity || 1
  }

  /**
   * Set layer z-index
   */
  setZIndex(zIndex: number): Layer {
    this.options.zIndex = zIndex
    // MapLibre doesn't have direct z-index, but we can move layers
    if (this._map && this._map.getLayer(this._layerId)) {
      // Implementation would depend on specific layer ordering needs
      // this._map.moveLayer(this._layerId, beforeId)
    }
    return this
  }

  /**
   * Get the source ID
   */
  getSourceId(): string {
    return this._sourceId
  }

  /**
   * Get the layer ID
   */
  getLayerId(): string {
    return this._layerId
  }

  /**
   * Get attribution text
   */
  getAttribution(): string | undefined {
    return this.options.attribution
  }

  // Protected methods to be overridden by subclasses

  /**
   * Create the source - to be implemented by subclasses
   */
  protected _createSource(): void {
    // Override in subclasses
  }

  /**
   * Create the layer - to be implemented by subclasses
   */
  protected _createLayer(): void {
    // Override in subclasses
  }

  /**
   * Update the source - to be implemented by subclasses
   */
  protected _updateSource(): void {
    // Override in subclasses
  }
}

export default Layer
