import { Layer, LayerOptions } from './Layer';
import { Service } from '../Services/Service';

export interface RasterLayerOptions extends LayerOptions {
  service?: Service
  updateInterval?: number
  format?: string
  transparent?: boolean
  f?: string
  useCors?: boolean
  from?: Date
  to?: Date
}

/**
 * RasterLayer - Base class for raster-based layers like DynamicMapLayer and ImageMapLayer
 * Equivalent to Esri Leaflet's RasterLayer but adapted for MapLibre GL JS
 */
export class RasterLayer extends Layer {
  protected service?: Service;
  protected _currentImage?: {
    bounds: [number, number, number, number]
    url: string
  };

  constructor(options: RasterLayerOptions = {}) {
    super({
      opacity: 1,
      updateInterval: 150,
      format: 'png',
      transparent: true,
      f: 'image',
      useCors: true,
      ...options,
    });

    if (options.service) {
      this.service = options.service;
    }
  }

  /**
   * Set time range for temporal data
   */
  setTimeRange(from: Date, to: Date): RasterLayer {
    (this.options as RasterLayerOptions).from = from
    ;(this.options as RasterLayerOptions).to = to;
    this._update();
    return this;
  }

  /**
   * Get time range
   */
  getTimeRange(): [Date?, Date?] {
    const opts = this.options as RasterLayerOptions;
    return [opts.from, opts.to];
  }

  /**
   * Authenticate with token
   */
  authenticate(token: string): RasterLayer {
    if (this.service) {
      this.service.authenticate(token);
    }
    return this;
  }

  /**
   * Get service metadata
   */
  metadata(callback: (error: Error | null, metadata?: any) => void, context?: any): RasterLayer {
    if (this.service) {
      this.service.metadata(callback, context);
    }
    return this;
  }

  /**
   * Redraw the layer
   */
  redraw(): RasterLayer {
    this._update();
    return this;
  }

  protected _createSource(): void {
    if (!this._map) return;

    // Create a raster source that will be updated with image URLs
    const source = {
      type: 'raster',
      tiles: [], // Will be populated by _update
      tileSize: 512,
    };

    this._map.addSource(this._sourceId, source);
  }

  protected _createLayer(): void {
    if (!this._map) return;

    const layer = {
      id: this._layerId,
      type: 'raster',
      source: this._sourceId,
      paint: {
        'raster-opacity': this.options.opacity || 1,
      },
    };

    this._map.addLayer(layer);
  }

  /**
   * Update the layer - to be implemented by subclasses
   */
  protected _update(): void {
    // Override in subclasses like DynamicMapLayer and ImageMapLayer
  }

  /**
   * Build export parameters - to be implemented by subclasses
   */
  protected _buildExportParams(): Record<string, any> {
    // Override in subclasses
    return {};
  }

  /**
   * Request export - to be implemented by subclasses
   */
  protected _requestExport(
    params: Record<string, any>,
    bounds: [number, number, number, number]
  ): void {
    // Override in subclasses
  }

  /**
   * Calculate bounding box for current map view
   */
  protected _calculateBbox(): string {
    if (!this._map) return '';

    // This would need to be implemented based on MapLibre GL JS bounds
    // For now, return empty string
    return '';
  }

  /**
   * Calculate image size for current map view
   */
  protected _calculateImageSize(): string {
    if (!this._map) return '256,256';

    // This would need to be implemented based on MapLibre GL JS size
    // For now, return default size
    return '256,256';
  }

  /**
   * Render image overlay
   */
  protected _renderImage(url: string, bounds: [number, number, number, number]): void {
    if (!this._map) return;

    // Store current image info
    this._currentImage = { url, bounds };

    // Update the raster source with the new image
    // This would need specific MapLibre GL JS implementation
    // For now, just store the reference
  }
}

export default RasterLayer;
