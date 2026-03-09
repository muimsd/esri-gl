import { Task, type TaskOptions } from '@/Tasks/Task';
import { Service } from '@/Services/Service';
import type { Map } from '@/types';

export interface LayerScaleRange {
  minScale?: number;
  maxScale?: number;
}

export interface IdentifyFeaturesOptions {
  url: string;
  layers?: number[] | number | string;
  layerDefs?: Record<string, string>;
  tolerance?: number;
  returnGeometry?: boolean;
  maxAllowableOffset?: number;
  geometryPrecision?: number;
  dynamicLayers?: unknown[];
  mapExtent?: [number, number, number, number];
  imageDisplay?: [number, number, number];
  dpi?: number;
  sr?: string | number;
  layerTimeOptions?: Record<string, unknown>;
  time?: number[] | Date[];
  fetchOptions?: RequestInit;
}

export interface IdentifyResult {
  layerId: number;
  layerName: string;
  value: string;
  displayFieldName: string;
  attributes: Record<string, unknown>;
  geometry?: unknown;
  geometryType?: string;
}

export interface IdentifyResponse {
  results: IdentifyResult[];
}

export interface GeometryInput {
  x: number;
  y: number;
  spatialReference?: {
    wkid: number;
    latestWkid?: number;
  };
}

/**
 * IdentifyFeatures task for performing identify operations against ArcGIS Map Services
 * Similar to Esri Leaflet's identifyFeatures functionality
 */
// Scale constant: at zoom 0 and 96 DPI, the Web Mercator scale denominator
const SCALE_AT_ZOOM_0 = 559082264.028;

export class IdentifyFeatures extends Task {
  protected setters = {
    layers: 'layers',
    precision: 'geometryPrecision',
    tolerance: 'tolerance',
    returnGeometry: 'returnGeometry',
  };

  protected path = '/identify';

  protected params: Record<string, unknown> = {
    sr: 4326,
    layers: 'all',
    tolerance: 3,
    returnGeometry: true,
    f: 'json',
  };

  private _map: Map | null = null;
  private _layerScaleRanges: Record<number, LayerScaleRange> = {};

  constructor(options: string | IdentifyFeaturesOptions | Service) {
    // Handle different input types and convert to TaskOptions format
    let taskOptions: string | TaskOptions;

    if (typeof options === 'string') {
      taskOptions = options;
    } else if (options instanceof Service) {
      // Extract URL from Service instance
      taskOptions = { url: (options as Service & { options: { url: string } }).options.url };
    } else {
      // It's IdentifyFeaturesOptions, use as TaskOptions
      taskOptions = options;
    }

    super(taskOptions);
    this.path = '/identify';

    // Ensure dynamic setters are available even though subclass fields
    // are initialized after super() runs. This rebinds setter methods.
    if (this.setters) {
      for (const [method, param] of Object.entries(this.setters)) {
        (this as unknown as Record<string, unknown>)[method] = this.generateSetter(param, this);
      }
    }
  }

  /**
   * Perform identify operation at a point location
   */
  at(point: { lng: number; lat: number } | [number, number]): IdentifyFeatures {
    let geometry: GeometryInput;

    if (Array.isArray(point)) {
      geometry = {
        x: point[0],
        y: point[1],
        spatialReference: { wkid: 4326 },
      };
    } else {
      geometry = {
        x: point.lng,
        y: point.lat,
        spatialReference: { wkid: 4326 },
      };
    }

    this.params.geometry = JSON.stringify(geometry);
    this.params.geometryType = 'esriGeometryPoint';
    return this;
  }

  // Strongly-typed chainable setters for common Identify params
  layers(value: number[] | number | string): IdentifyFeatures {
    this.params.layers = value;
    return this;
  }

  tolerance(value: number): IdentifyFeatures {
    this.params.tolerance = value;
    return this;
  }

  returnGeometry(value: boolean): IdentifyFeatures {
    this.params.returnGeometry = value;
    return this;
  }

  precision(value: number): IdentifyFeatures {
    this.params.geometryPrecision = value;
    return this;
  }

  /**
   * Set the map extent and image display for the identify operation.
   * Also stores the map reference for zoom-based scale filtering.
   */
  on(map: Map): IdentifyFeatures {
    this._map = map;
    try {
      const bounds = map.getBounds().toArray();
      this.params.mapExtent = [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]].join(',');

      const canvas = map.getCanvas();
      const dpi = (this.options as IdentifyFeaturesOptions)?.dpi ?? 96;
      this.params.imageDisplay = [canvas.width, canvas.height, dpi].join(',');
    } catch (error) {
      console.warn('Could not extract map extent and display info:', error);
    }
    return this;
  }

  /**
   * Set scale ranges for layers so the identify can skip layers not visible at the current zoom.
   * ArcGIS uses minScale (zoomed out limit) and maxScale (zoomed in limit).
   * A value of 0 means no limit.
   *
   * @example
   * identify.layerScales({
   *   0: { minScale: 1000000, maxScale: 0 },     // Cities: visible below 1:1M
   *   1: { minScale: 5000000, maxScale: 500000 }, // Highways: visible between 1:5M and 1:500K
   *   2: { minScale: 0, maxScale: 0 },            // States: always visible
   * });
   */
  layerScales(scales: Record<number, LayerScaleRange>): IdentifyFeatures {
    this._layerScaleRanges = scales;
    return this;
  }

  /**
   * Set layer definitions for filtering specific layers
   */
  layerDef(layerId: number | string, whereClause: string): IdentifyFeatures {
    const currentLayerDefs = (this.params.layerDefs as string) || '';
    this.params.layerDefs = currentLayerDefs
      ? `${currentLayerDefs};${layerId}:${whereClause}`
      : `${layerId}:${whereClause}`;
    return this;
  }

  /**
   * Simplify geometries based on map resolution
   */
  simplify(
    map: {
      getBounds(): {
        getWest(): number;
        getEast(): number;
      };
      getSize(): { x: number; y: number };
    },
    factor: number
  ): IdentifyFeatures {
    const bounds = map.getBounds();
    const mapWidth = Math.abs(bounds.getWest() - bounds.getEast());
    this.params.maxAllowableOffset = (mapWidth / map.getSize().x) * factor;
    return this;
  }

  /**
   * Get the current map scale from zoom level.
   * Uses the standard Web Mercator scale formula at 96 DPI.
   */
  private _getMapScale(): number | null {
    if (!this._map || typeof this._map.getZoom !== 'function') return null;
    const zoom = this._map.getZoom();
    return SCALE_AT_ZOOM_0 / Math.pow(2, zoom);
  }

  /**
   * Check if a layer is visible at the given scale.
   * ArcGIS convention: minScale = most zoomed out (largest number), maxScale = most zoomed in (smallest number).
   * A value of 0 means no limit in that direction.
   */
  private _isLayerVisibleAtScale(layerId: number, scale: number): boolean {
    const range = this._layerScaleRanges[layerId];
    if (!range) return true; // No scale info means always visible
    if (range.minScale && scale > range.minScale) return false; // Too zoomed out
    if (range.maxScale && scale < range.maxScale) return false; // Too zoomed in
    return true;
  }

  /**
   * Filter the layers parameter to only include layers visible at the current scale.
   * Returns false if no layers are visible (request should be skipped).
   */
  private _filterLayersByScale(): boolean {
    const scale = this._getMapScale();
    if (scale === null || Object.keys(this._layerScaleRanges).length === 0) return true;

    const layersParam = this.params.layers;
    if (typeof layersParam !== 'string') return true;

    // Parse layers string: "all", "visible:0,1,2", "top", "visible", "0,1,2"
    const match = layersParam.match(/^(all|top|visible)(?::(.+))?$/);
    if (!match) return true;

    const prefix = match[1];
    const idsPart = match[2];

    // If no specific IDs, filter all known layer IDs from scale ranges
    let layerIds: number[];
    if (idsPart) {
      layerIds = idsPart
        .split(',')
        .map(Number)
        .filter(n => !isNaN(n));
    } else {
      layerIds = Object.keys(this._layerScaleRanges).map(Number);
    }

    const visibleIds = layerIds.filter(id => this._isLayerVisibleAtScale(id, scale));

    if (visibleIds.length === 0) return false;

    // Update layers param with only visible IDs
    this.params.layers = `${prefix}:${visibleIds.join(',')}`;
    return true;
  }

  /**
   * Execute the identify operation.
   * If layer scale ranges are set via `layerScales()` and a map is provided via `on()`,
   * layers not visible at the current zoom level will be excluded. If no layers are visible,
   * an empty FeatureCollection is returned without making a network request.
   */
  async run(): Promise<GeoJSON.FeatureCollection> {
    // Skip request entirely if no layers are visible at the current scale
    if (!this._filterLayersByScale()) {
      return { type: 'FeatureCollection', features: [] };
    }

    try {
      const response = await this.request<{
        results: Array<{
          layerId: number;
          layerName: string;
          value: string;
          displayFieldName: string;
          attributes: Record<string, unknown>;
          geometry?: unknown;
        }>;
      }>();

      return this._convertToGeoJSON(response);
    } catch (error) {
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('IdentifyFeatures error:', error);
      }
      throw error;
    }
  }

  private _convertToGeoJSON(response: {
    results: Array<{
      layerId: number;
      layerName: string;
      value: string;
      displayFieldName: string;
      attributes: Record<string, unknown>;
      geometry?: unknown;
    }>;
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
      };

      // Add layerId as a custom property for easier identification
      const featureWithLayerId = feature as GeoJSON.Feature & { layerId: number };
      featureWithLayerId.layerId = result.layerId;

      return feature;
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
