import { RasterLayer, RasterLayerOptions } from './RasterLayer';
import { MapService } from '../Services/MapService';

export interface DynamicMapLayerOptions extends RasterLayerOptions {
  url: string
  layers?: number[] | false
  layerDefs?: Record<string, string> | false
  timeOptions?: Record<string, unknown> | false
  dynamicLayers?: unknown[] | false
}

/**
 * DynamicMapLayer - Displays ArcGIS Server Map Services as raster layers
 * Equivalent to Esri Leaflet's DynamicMapLayer but adapted for MapLibre GL JS
 */
export class DynamicMapLayer extends RasterLayer {
  protected service: MapService;

  constructor(options: DynamicMapLayerOptions) {
    super({
      updateInterval: 150,
      layers: false,
      layerDefs: false,
      timeOptions: false,
      format: 'png32',
      transparent: true,
      f: 'json',
      ...options,
    });

    // Create the map service
    this.service = new MapService(options);
  }

  /**
   * Get dynamic layers
   */
  getDynamicLayers(): unknown[] | false {
    return (this.options as DynamicMapLayerOptions).dynamicLayers || false;
  }

  /**
   * Set dynamic layers
   */
  setDynamicLayers(dynamicLayers: unknown[]): DynamicMapLayer {
    (this.options as DynamicMapLayerOptions).dynamicLayers = dynamicLayers;
    this._update();
    return this;
  }

  /**
   * Get layers
   */
  getLayers(): number[] | false {
    return (this.options as DynamicMapLayerOptions).layers || false;
  }

  /**
   * Set layers
   */
  setLayers(layers: number[] | false): DynamicMapLayer {
    (this.options as DynamicMapLayerOptions).layers = layers;
    this._update();
    return this;
  }

  /**
   * Get layer definitions
   */
  getLayerDefs(): Record<string, string> | false {
    return (this.options as DynamicMapLayerOptions).layerDefs || false;
  }

  /**
   * Set layer definitions
   */
  setLayerDefs(layerDefs: Record<string, string> | false): DynamicMapLayer {
    (this.options as DynamicMapLayerOptions).layerDefs = layerDefs;
    this._update();
    return this;
  }

  /**
   * Get time options
   */
  getTimeOptions(): Record<string, unknown> | false {
    return (this.options as DynamicMapLayerOptions).timeOptions || false;
  }

  /**
   * Set time options
   */
  setTimeOptions(timeOptions: Record<string, unknown> | false): DynamicMapLayer {
    (this.options as DynamicMapLayerOptions).timeOptions = timeOptions;
    this._update();
    return this;
  }

  /**
   * Create a query task
   */
  query() {
    return this.service.query();
  }

  /**
   * Create an identify task
   */
  identify() {
    return this.service.identify();
  }

  /**
   * Create a find task
   */
  find() {
    return this.service.find();
  }

  /**
   * Build export parameters for the service
   */
  protected _buildExportParams(): Record<string, unknown> {
    const options = this.options as DynamicMapLayerOptions;

    const params: Record<string, unknown> = {
      bbox: this._calculateBbox(),
      size: this._calculateImageSize(),
      dpi: 96,
      format: options.format,
      transparent: options.transparent,
      bboxSR: 4326,
      imageSR: 4326,
    };

    if (options.dynamicLayers) {
      params.dynamicLayers = options.dynamicLayers;
    }

    if (options.layers) {
      if (Array.isArray(options.layers) && options.layers.length === 0) {
        return {};
      }
      params.layers = Array.isArray(options.layers)
        ? `show:${options.layers.join(',')}`
        : options.layers;
    }

    if (options.layerDefs) {
      params.layerDefs =
        typeof options.layerDefs === 'string'
          ? options.layerDefs
          : JSON.stringify(options.layerDefs);
    }

    if (options.timeOptions) {
      params.timeOptions = JSON.stringify(options.timeOptions);
    }

    if (options.from && options.to) {
      params.time = `${options.from.valueOf()},${options.to.valueOf()}`;
    }

    return params;
  }

  /**
   * Request export from the service
   */
  protected async _requestExport(
    params: Record<string, unknown>,
    bounds: [number, number, number, number]
  ): Promise<void> {
    if (!this.service) return;

    const options = this.options as DynamicMapLayerOptions;

    if (options.f === 'json') {
      try {
        const response = await this.service.export(params);
        let imageUrl = response?.href;
        if (imageUrl && options.url.includes('token=')) {
          // Add token if needed
          imageUrl += imageUrl.includes('?') ? '&' : '?';
          imageUrl += options.url.split('token=')[1];
        }

        if (imageUrl) {
          this._renderImage(imageUrl, bounds);
        }
      } catch (error) {
        console.error('Export request failed:', error);
      }
    } else {
      // Direct image request
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const imageUrl = `${options.url}/export?${queryString}`;
      this._renderImage(imageUrl, bounds);
    }
  }

  /**
   * Update the layer
   */
  protected _update(): void {
    if (!this._map) return;

    const params = this._buildExportParams();
    if (Object.keys(params).length > 0) {
      // Calculate current map bounds
      const bounds: [number, number, number, number] = [0, 0, 0, 0]; // This should be calculated from map
      this._requestExport(params, bounds);
    }
  }
}

export function dynamicMapLayer(options: DynamicMapLayerOptions): DynamicMapLayer {
  return new DynamicMapLayer(options);
}

export default dynamicMapLayer;
