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
    sr: 4326,
    contains: true,
    returnGeometry: true,
    returnZ: true,
    returnM: false,
    f: 'json',
  };

  constructor(options: string | FindOptions | Service) {
    super(options);
    this.path = 'find';
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
    try {
      // Try GeoJSON format first if supported
      this.params.f = 'geojson';
      const response = await this.request<GeoJSON.FeatureCollection>();
      return response;
    } catch {
      // Fallback to JSON format and convert
      this.params.f = 'json';
      const response = await this.request<{
        results: Array<{
          layerId: number;
          layerName: string;
          foundFieldName: string;
          value: string;
          attributes: Record<string, unknown>;
          geometry?: unknown;
        }>;
      }>();

      return this._convertToGeoJSON(response);
    }
  }

  private _convertToGeoJSON(response: {
    results: Array<{
      layerId: number;
      layerName: string;
      foundFieldName: string;
      value: string;
      attributes: Record<string, unknown>;
      geometry?: unknown;
    }>;
  }): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = response.results.map(result => ({
      type: 'Feature',
      properties: {
        ...result.attributes,
        layerId: result.layerId,
        layerName: result.layerName,
        foundFieldName: result.foundFieldName,
        value: result.value,
      },
      geometry: (result.geometry as GeoJSON.Geometry) || null,
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}

export function find(options: string | FindOptions): Find {
  return new Find(options);
}

export default find;
