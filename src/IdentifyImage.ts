import { Task } from '@/Task';

export interface IdentifyImageOptions {
  url: string
  token?: string
  geometry?: unknown
  geometryType?: string
  sr?: string | number
  mosaic?: boolean
  renderingRules?: unknown[]
  pixelSize?: [number, number]
  returnGeometry?: boolean
  returnCatalogItems?: boolean
  f?: string
}

export interface PixelValue {
  attributes: Record<string, unknown>
  geometry?: unknown
}

export interface IdentifyImageResult {
  objectId?: number
  name?: string
  value?: string
  location?: {
    x: number
    y: number
    spatialReference?: {
      wkid: number
      latestWkid?: number
    }
  }
  attributes?: Record<string, unknown>
  catalogItems?: unknown[]
  catalogItemVisibilities?: number[]
}

/**
 * IdentifyImage task for identifying pixel values in ArcGIS Image Services
 * Based on Esri Leaflet's IdentifyImage functionality
 */
export class IdentifyImage extends Task {
  protected setters = {
    returnCatalogItems: 'returnCatalogItems',
    returnGeometry: 'returnGeometry',
    pixelSize: 'pixelSize',
    token: 'token',
  };

  protected path = 'identify';

  protected params: Record<string, unknown> = {
    sr: 4326,
    returnGeometry: false,
    returnCatalogItems: false,
    f: 'json',
  };

  constructor(options: string | IdentifyImageOptions) {
    super(options);
  }

  /**
   * Identify pixel values at a specific point
   */
  at(point: { lng: number; lat: number } | [number, number]): IdentifyImage {
    let geometry: { x: number; y: number; spatialReference: { wkid: number } };

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
    this.params.sr = 4326;
    return this;
  }

  /**
   * Set custom geometry for identification
   */
  geometry(geometry: unknown, geometryType?: string): IdentifyImage {
    this.params.geometry = JSON.stringify(geometry);
    this.params.geometryType = geometryType || 'esriGeometryPoint';
    return this;
  }

  /**
   * Set pixel size for the identify operation
   */
  pixelSize(size: [number, number] | { x: number; y: number }): IdentifyImage {
    if (Array.isArray(size)) {
      this.params.pixelSize = `${size[0]},${size[1]}`;
    } else {
      this.params.pixelSize = `${size.x},${size.y}`;
    }
    return this;
  }

  /**
   * Set whether to return geometry with results
   */
  returnGeometry(returnGeom: boolean): IdentifyImage {
    this.params.returnGeometry = returnGeom;
    return this;
  }

  /**
   * Set whether to return catalog items
   */
  returnCatalogItems(returnItems: boolean): IdentifyImage {
    this.params.returnCatalogItems = returnItems;
    return this;
  }

  /**
   * Set mosaic rule for the identify operation
   */
  mosaicRule(rule: unknown): IdentifyImage {
    this.params.mosaicRule = JSON.stringify(rule);
    return this;
  }

  /**
   * Set rendering rules for the identify operation
   */
  renderingRule(rule: unknown): IdentifyImage {
    this.params.renderingRule = JSON.stringify(rule);
    return this;
  }

  /**
   * Execute the identify operation
   */
  async run(): Promise<{
    results: IdentifyImageResult[]
    location?: {
      x: number
      y: number
      spatialReference?: {
        wkid: number
        latestWkid?: number
      }
    }
  }> {
    const response = await this.request<{
      results?: IdentifyImageResult[]
      location?: {
        x: number
        y: number
        spatialReference?: {
          wkid: number
          latestWkid?: number
        }
      }
      // Handle different response formats
      value?: string
      values?: string[]
      properties?: Record<string, unknown>
      catalogItems?: unknown[]
    }>();

    // Normalize different response formats
    let results: IdentifyImageResult[] = [];

    if (response.results) {
      results = response.results;
    } else if (response.value !== undefined || response.values) {
      // Handle simple value responses
      results = [
        {
          value: response.value || (response.values && response.values[0]) || '',
          attributes: response.properties || {},
        },
      ];
    }

    return {
      results,
      location: response.location,
    };
  }

  /**
   * Execute and return pixel values as a simple array
   */
  async getPixelValues(): Promise<Array<string | number | null>> {
    const response = await this.run();
    return response.results.map(result => {
      if (result.value !== undefined) {
        const numValue = parseFloat(result.value);
        return isNaN(numValue) ? result.value : numValue;
      }
      return null;
    });
  }

  /**
   * Execute and return detailed pixel information
   */
  async getPixelData(): Promise<IdentifyImageResult[]> {
    const response = await this.run();
    return response.results;
  }
}

export function identifyImage(options: string | IdentifyImageOptions): IdentifyImage {
  return new IdentifyImage(options);
}

export default identifyImage;
