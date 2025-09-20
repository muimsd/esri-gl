import { Task } from './Task';
import { Service } from '@/Services/Service';

export interface FindOptions {
  url: string;
  token?: string;
  searchText?: string;
  contains?: boolean;
  searchFields?: string | string[];
  sr?: string | number;
  layers?: number | number[] | string;
  returnGeometry?: boolean;
  maxAllowableOffset?: number;
  geometryPrecision?: number;
  dynamicLayers?: unknown[];
  returnZ?: boolean;
  returnM?: boolean;
  gdbVersion?: string;
  layerDefs?: string;
}

/**
 * Find task for searching text in ArcGIS Map Services
 * Based on Esri Leaflet's Find functionality
 */
export class Find extends Task {
  protected setters = {
    contains: 'contains',
    text: 'searchText',
    fields: 'searchFields',
    spatialReference: 'sr',
    sr: 'sr',
    layers: 'layers',
    returnGeometry: 'returnGeometry',
    maxAllowableOffset: 'maxAllowableOffset',
    precision: 'geometryPrecision',
    dynamicLayers: 'dynamicLayers',
    returnZ: 'returnZ',
    returnM: 'returnM',
    gdbVersion: 'gdbVersion',
    token: 'token',
  };

  protected path = 'find';

  protected params: Record<string, unknown> = {
    searchText: '', // Required parameter
    layers: 'all', // Can be 'all' or comma-separated layer IDs
    contains: true,
    returnGeometry: true,
    f: 'json',
  };

  constructor(options: string | FindOptions | Service) {
    super(options);
    this.path = 'find';

    // If options is a FindOptions object, merge relevant properties into params
    if (
      options &&
      typeof options === 'object' &&
      !('request' in options) &&
      typeof options !== 'string'
    ) {
      const findOptions = options as FindOptions;

      // Merge find-specific options into params
      if (findOptions.searchText !== undefined) this.params.searchText = findOptions.searchText;
      if (findOptions.contains !== undefined) this.params.contains = findOptions.contains;
      if (findOptions.searchFields !== undefined) {
        this.params.searchFields = Array.isArray(findOptions.searchFields)
          ? findOptions.searchFields.join(',')
          : findOptions.searchFields;
      }
      if (findOptions.sr !== undefined) this.params.sr = findOptions.sr;
      if (findOptions.layers !== undefined) {
        // Convert array to comma-separated string or use as-is if already string
        if (Array.isArray(findOptions.layers)) {
          this.params.layers = findOptions.layers.join(',');
        } else if (typeof findOptions.layers === 'string') {
          this.params.layers = findOptions.layers;
        } else {
          this.params.layers = findOptions.layers.toString();
        }
      }
      if (findOptions.returnGeometry !== undefined)
        this.params.returnGeometry = findOptions.returnGeometry;
      if (findOptions.maxAllowableOffset !== undefined)
        this.params.maxAllowableOffset = findOptions.maxAllowableOffset;
      if (findOptions.geometryPrecision !== undefined)
        this.params.geometryPrecision = findOptions.geometryPrecision;
      if (findOptions.dynamicLayers !== undefined)
        this.params.dynamicLayers = findOptions.dynamicLayers;
      if (findOptions.returnZ !== undefined) this.params.returnZ = findOptions.returnZ;
      if (findOptions.returnM !== undefined) this.params.returnM = findOptions.returnM;
      if (findOptions.gdbVersion !== undefined) this.params.gdbVersion = findOptions.gdbVersion;
      if (findOptions.layerDefs !== undefined) this.params.layerDefs = findOptions.layerDefs;
      if (findOptions.token !== undefined) this.params.token = findOptions.token;
    }
  }

  /**
   * Set the text to search for
   */
  text(searchText: string): Find {
    this.params.searchText = searchText;
    return this;
  }

  /**
   * Set the fields to search in
   */
  fields(fields: string | string[]): Find {
    this.params.searchFields = Array.isArray(fields) ? fields.join(',') : fields;
    return this;
  }

  /**
   * Set whether the search should contain the text (partial match) or exact match
   */
  contains(contains: boolean): Find {
    this.params.contains = contains;
    return this;
  }

  /**
   * Set which layers to search in
   */
  layers(layers: number | number[] | string): Find {
    if (Array.isArray(layers)) {
      this.params.layers = layers.join(',');
    } else {
      this.params.layers = layers;
    }
    return this;
  }

  /**
   * Set layer definitions for filtering specific layers
   */
  layerDefs(layerId: number | string, whereClause: string): Find {
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
  ): Find {
    const bounds = map.getBounds();
    const mapWidth = Math.abs(bounds.getWest() - bounds.getEast());
    this.params.maxAllowableOffset = (mapWidth / map.getSize().x) * factor;
    return this;
  }

  /**
   * Execute the find operation
   */
  async run(): Promise<GeoJSON.FeatureCollection> {
    // Always use JSON format for Find API (GeoJSON might not be supported)
    this.params.f = 'json';

    try {
      const response = await this.request<{
        results?: Array<{
          layerId: number;
          layerName: string;
          foundFieldName: string;
          value: string;
          attributes: Record<string, unknown>;
          geometry?: unknown;
        }>;
      }>();

      return this._convertToGeoJSON(response);
    } catch (error) {
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('Find task error:', error);
      }
      throw error;
    }
  }

  private _convertToGeoJSON(
    response: {
      results?: Array<{
        layerId: number;
        layerName: string;
        foundFieldName: string;
        value: string;
        attributes: Record<string, unknown>;
        geometry?: unknown;
      }>;
    } | null
  ): GeoJSON.FeatureCollection {
    // Handle cases where response is null or results might be undefined, null, or empty
    const results = response?.results || [];
    const features: GeoJSON.Feature[] = results.map(result => ({
      type: 'Feature' as const,
      properties: {
        ...result.attributes,
        layerId: result.layerId,
        layerName: result.layerName,
        foundFieldName: result.foundFieldName,
        value: result.value,
      },
      geometry: this._convertEsriGeometry(result.geometry),
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  private _convertEsriGeometry(esriGeom: unknown): GeoJSON.Geometry | null {
    if (!esriGeom || typeof esriGeom !== 'object') return null;

    const geom = esriGeom as Record<string, unknown>;

    // Point geometry
    if ('x' in geom && 'y' in geom) {
      return {
        type: 'Point',
        coordinates: [geom.x as number, geom.y as number],
      };
    }

    // Polygon geometry
    if ('rings' in geom && Array.isArray(geom.rings)) {
      return {
        type: 'Polygon',
        coordinates: geom.rings as number[][][],
      };
    }

    // Polyline geometry
    if ('paths' in geom && Array.isArray(geom.paths)) {
      const paths = geom.paths as number[][][];

      if (paths.length === 1) {
        // Single path = LineString
        return {
          type: 'LineString',
          coordinates: paths[0],
        };
      } else {
        // Multiple paths = MultiLineString
        return {
          type: 'MultiLineString',
          coordinates: paths,
        };
      }
    }

    // Default: return null for unknown geometry types
    return null;
  }
}

export function find(options: string | FindOptions): Find {
  return new Find(options);
}

export default find;
