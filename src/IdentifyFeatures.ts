import { cleanTrailingSlash } from '@/utils';

export interface IdentifyFeaturesOptions {
  url: string;
  layers?: number[] | number | string;
  layerDefs?: Record<string, string>;
  tolerance?: number;
  returnGeometry?: boolean;
  maxAllowableOffset?: number;
  geometryPrecision?: number;
  dynamicLayers?: any[];
  mapExtent?: [number, number, number, number];
  imageDisplay?: [number, number, number];
  sr?: string | number;
  layerTimeOptions?: Record<string, any>;
  time?: number[] | Date[];
  fetchOptions?: RequestInit;
}

export interface IdentifyResult {
  layerId: number;
  layerName: string;
  value: string;
  displayFieldName: string;
  attributes: Record<string, any>;
  geometry?: any;
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
 * IdentifyFeatures service for performing identify operations against ArcGIS Map Services
 * Similar to Esri Leaflet's identifyFeatures functionality
 */
export class IdentifyFeatures {
  private _baseUrl: string;
  private _defaultOptions: Partial<IdentifyFeaturesOptions>;

  constructor(options: IdentifyFeaturesOptions) {
    if (!options.url) {
      throw new Error('A url must be supplied for IdentifyFeatures service');
    }

    this._baseUrl = cleanTrailingSlash(options.url);
    this._defaultOptions = {
      layers: 'all',
      tolerance: 3,
      returnGeometry: false,
      maxAllowableOffset: 0,
      geometryPrecision: 0,
      sr: 4326,
      ...options,
    };
  }

  /**
   * Perform identify operation at a point location
   */
  async at(point: { lng: number; lat: number }, map?: any): Promise<IdentifyResponse> {
    const geometry: GeometryInput = {
      x: point.lng,
      y: point.lat,
      spatialReference: {
        wkid: 4326,
      },
    };

    // If map is provided, get current extent and display info
    let mapExtent: [number, number, number, number] | undefined;
    let imageDisplay: [number, number, number] | undefined;

    if (map) {
      try {
        const bounds = map.getBounds();
        if (bounds && bounds.toArray) {
          const boundsArray = bounds.toArray();
          mapExtent = [boundsArray[0][0], boundsArray[0][1], boundsArray[1][0], boundsArray[1][1]];
        }

        const canvas = map.getCanvas();
        if (canvas) {
          imageDisplay = [canvas.width, canvas.height, 96];
        }
      } catch (error) {
        console.warn('Could not extract map extent and display info:', error);
      }
    }

    return this.identify({
      geometry,
      geometryType: 'esriGeometryPoint',
      mapExtent,
      imageDisplay,
    });
  }

  /**
   * Perform identify operation with custom geometry
   */
  async identify(options: {
    geometry: GeometryInput | any;
    geometryType?: string;
    mapExtent?: [number, number, number, number];
    imageDisplay?: [number, number, number];
    layers?: number[] | number | string;
    tolerance?: number;
    returnGeometry?: boolean;
  }): Promise<IdentifyResponse> {
    const params = this._buildIdentifyParams(options);
    const url = `${this._baseUrl}/identify?${params.toString()}`;

    try {
      const response = await fetch(url, this._defaultOptions.fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this._processResponse(data);
    } catch (error) {
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('IdentifyFeatures error:', error);
      }
      throw error;
    }
  }

  /**
   * Set layer definitions for filtering
   */
  setLayerDefs(layerDefs: Record<string, string>): IdentifyFeatures {
    this._defaultOptions.layerDefs = layerDefs;
    return this;
  }

  /**
   * Set which layers to identify
   */
  setLayers(layers: number[] | number | string): IdentifyFeatures {
    this._defaultOptions.layers = layers;
    return this;
  }

  /**
   * Set tolerance for identify operation
   */
  setTolerance(tolerance: number): IdentifyFeatures {
    this._defaultOptions.tolerance = tolerance;
    return this;
  }

  /**
   * Set whether to return geometry with results
   */
  setReturnGeometry(returnGeometry: boolean): IdentifyFeatures {
    this._defaultOptions.returnGeometry = returnGeometry;
    return this;
  }

  /**
   * Set time extent for temporal layers
   */
  setTime(from: Date | number, to?: Date | number): IdentifyFeatures {
    if (to) {
      this._defaultOptions.time = [from, to] as any;
    } else {
      this._defaultOptions.time = [from] as any;
    }
    return this;
  }

  private _buildIdentifyParams(options: {
    geometry: GeometryInput | any;
    geometryType?: string;
    mapExtent?: [number, number, number, number];
    imageDisplay?: [number, number, number];
    layers?: number[] | number | string;
    tolerance?: number;
    returnGeometry?: boolean;
  }): URLSearchParams {
    const mergedOptions = { ...this._defaultOptions, ...options };

    const params = new URLSearchParams({
      f: 'json',
      geometry: JSON.stringify(options.geometry),
      geometryType: options.geometryType || 'esriGeometryPoint',
      sr: mergedOptions.sr?.toString() || '4326',
      tolerance: (mergedOptions.tolerance || 3).toString(),
      returnGeometry: (mergedOptions.returnGeometry || false).toString(),
    });

    // Handle layers parameter
    const layers = mergedOptions.layers;
    if (layers !== undefined && layers !== 'all') {
      let layersStr: string;
      if (Array.isArray(layers)) {
        layersStr = `visible:${layers.join(',')}`;
      } else if (typeof layers === 'number') {
        layersStr = `visible:${layers}`;
      } else {
        layersStr = layers.toString();
      }
      params.append('layers', layersStr);
    } else {
      params.append('layers', 'all');
    }

    // Add map extent if provided
    if (options.mapExtent) {
      params.append('mapExtent', options.mapExtent.join(','));
    }

    // Add image display if provided
    if (options.imageDisplay) {
      params.append('imageDisplay', options.imageDisplay.join(','));
    }

    // Add layer definitions if set
    if (mergedOptions.layerDefs) {
      params.append('layerDefs', JSON.stringify(mergedOptions.layerDefs));
    }

    // Add time if set
    if (mergedOptions.time) {
      const timeArray = mergedOptions.time as any[];
      const timeStr = timeArray
        .map(t => {
          if (t instanceof Date) return t.valueOf();
          return t;
        })
        .join(',');
      params.append('time', timeStr);
    }

    // Add other optional parameters
    if (mergedOptions.maxAllowableOffset) {
      params.append('maxAllowableOffset', mergedOptions.maxAllowableOffset.toString());
    }

    if (mergedOptions.geometryPrecision) {
      params.append('geometryPrecision', mergedOptions.geometryPrecision.toString());
    }

    if (mergedOptions.dynamicLayers) {
      params.append('dynamicLayers', JSON.stringify(mergedOptions.dynamicLayers));
    }

    return params;
  }

  private _processResponse(data: any): IdentifyResponse {
    if (!data || !data.results) {
      return { results: [] };
    }

    const results: IdentifyResult[] = data.results.map((result: any) => ({
      layerId: result.layerId || 0,
      layerName: result.layerName || '',
      value: result.value || '',
      displayFieldName: result.displayFieldName || '',
      attributes: result.attributes || {},
      geometry: result.geometry,
      geometryType: result.geometryType,
    }));

    return { results };
  }
}
