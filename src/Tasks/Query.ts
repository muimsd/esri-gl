import { Task } from './Task';
import { Service } from '@/Services/Service';

export interface QueryOptions {
  url: string;
  token?: string;
  where?: string;
  outFields?: string | string[];
  returnGeometry?: boolean;
  spatialRel?: string;
  geometry?: unknown;
  geometryType?: string;
  inSR?: string | number;
  outSR?: string | number;
  returnDistinctValues?: boolean;
  returnIdsOnly?: boolean;
  returnCountOnly?: boolean;
  returnExtentOnly?: boolean;
  orderByFields?: string;
  groupByFieldsForStatistics?: string;
  outStatistics?: unknown[];
  resultOffset?: number;
  resultRecordCount?: number;
  maxAllowableOffset?: number;
  geometryPrecision?: number;
  time?: number[];
  gdbVersion?: string;
  historicMoment?: number;
  returnTrueCurves?: boolean;
  returnZ?: boolean;
  returnM?: boolean;
  f?: string;
}

export interface QueryGeometry {
  x?: number;
  y?: number;
  xmin?: number;
  ymin?: number;
  xmax?: number;
  ymax?: number;
  paths?: number[][][];
  rings?: number[][][];
  points?: number[][];
  spatialReference?: {
    wkid: number;
    latestWkid?: number;
  };
}

export interface Bounds {
  _southWest: { lat: number; lng: number };
  _northEast: { lat: number; lng: number };
}

/**
 * Query task for ArcGIS Feature Services
 * Based on Esri Leaflet's Query functionality
 */
export class Query extends Task {
  protected setters = {
    offset: 'resultOffset',
    limit: 'resultRecordCount',
    fields: 'outFields',
    precision: 'geometryPrecision',
    featureIds: 'objectIds',
    returnGeometry: 'returnGeometry',
    returnM: 'returnM',
    transform: 'datumTransformation',
    token: 'token',
  };

  protected path = 'query';

  protected params: Record<string, unknown> = {
    returnGeometry: true,
    where: '1=1',
    outSR: 4326,
    outFields: '*',
    f: 'json',
  };

  constructor(options: string | QueryOptions | Service) {
    super(options);
    this.path = 'query';
  }

  // Spatial relationship methods

  /**
   * Returns a feature if its shape is wholly contained within the search geometry
   */
  within(geometry: QueryGeometry | unknown): Query {
    this._setGeometryParams(geometry);
    this.params.spatialRel = 'esriSpatialRelContains';
    return this;
  }

  /**
   * Returns a feature if any spatial relationship is found
   */
  intersects(geometry: QueryGeometry | unknown): Query {
    this._setGeometryParams(geometry);
    this.params.spatialRel = 'esriSpatialRelIntersects';
    return this;
  }

  /**
   * Returns a feature if its shape wholly contains the search geometry
   */
  contains(geometry: QueryGeometry | unknown): Query {
    this._setGeometryParams(geometry);
    this.params.spatialRel = 'esriSpatialRelWithin';
    return this;
  }

  /**
   * Returns a feature if the intersection of the interiors is not empty and has lower dimension
   */
  crosses(geometry: QueryGeometry | unknown): Query {
    this._setGeometryParams(geometry);
    this.params.spatialRel = 'esriSpatialRelCrosses';
    return this;
  }

  /**
   * Returns a feature if the two shapes share a common boundary
   */
  touches(geometry: QueryGeometry | unknown): Query {
    this._setGeometryParams(geometry);
    this.params.spatialRel = 'esriSpatialRelTouches';
    return this;
  }

  /**
   * Returns a feature if the intersection results in same dimension but different from both shapes
   */
  overlaps(geometry: QueryGeometry | unknown): Query {
    this._setGeometryParams(geometry);
    this.params.spatialRel = 'esriSpatialRelOverlaps';
    return this;
  }

  /**
   * Returns a feature if the envelope of the two shapes intersects
   */
  bboxIntersects(geometry: QueryGeometry | unknown): Query {
    this._setGeometryParams(geometry);
    this.params.spatialRel = 'esriSpatialRelEnvelopeIntersects';
    return this;
  }

  /**
   * Nearby search - only valid for ArcGIS Server 10.3+ or ArcGIS Online
   */
  nearby(latlng: { lat: number; lng: number }, radius: number): Query {
    this.params.geometry = [latlng.lng, latlng.lat];
    this.params.geometryType = 'esriGeometryPoint';
    this.params.spatialRel = 'esriSpatialRelIntersects';
    this.params.units = 'esriSRUnit_Meter';
    this.params.distance = radius;
    this.params.inSR = 4326;
    return this;
  }

  // Query methods

  /**
   * Set WHERE clause for the query
   */
  where(whereClause: string): Query {
    this.params.where = whereClause;
    return this;
  }

  /**
   * Set time range for temporal queries
   */
  between(start: Date | number, end: Date | number): Query {
    const startTime = start instanceof Date ? start.valueOf() : start;
    const endTime = end instanceof Date ? end.valueOf() : end;
    this.params.time = [startTime, endTime];
    return this;
  }

  /**
   * Simplify geometries based on map resolution
   */
  simplify(
    map: { getBounds(): Bounds; getSize(): { x: number; y: number } },
    factor: number
  ): Query {
    const bounds = map.getBounds();
    const mapWidth = Math.abs(bounds._northEast.lng - bounds._southWest.lng);
    this.params.maxAllowableOffset = (mapWidth / map.getSize().x) * factor;
    return this;
  }

  /**
   * Set order by fields
   */
  orderBy(fieldName: string, order: 'ASC' | 'DESC' = 'ASC'): Query {
    const currentOrder = (this.params.orderByFields as string) || '';
    this.params.orderByFields = currentOrder
      ? `${currentOrder},${fieldName} ${order}`
      : `${fieldName} ${order}`;
    return this;
  }

  /**
   * Set specific layer to query (for Map Services)
   */
  layer(layerId: number): Query {
    this.path = `${layerId}/query`;
    return this;
  }

  /**
   * Return only distinct values
   */
  distinct(): Query {
    this.params.returnGeometry = false;
    this.params.returnDistinctValues = true;
    return this;
  }

  /**
   * Set pixel size for image services
   */
  pixelSize(point: { x: number; y: number }): Query {
    this.params.pixelSize = [point.x, point.y];
    return this;
  }

  // Execution methods

  /**
   * Execute the query and return features
   */
  async run(): Promise<GeoJSON.FeatureCollection> {
    this._cleanParams();

    // Use GeoJSON format if supported
    this.params.f = 'geojson';

    try {
      const response = await this.request<GeoJSON.FeatureCollection>();
      return response;
    } catch {
      // Fallback to JSON format and convert
      this.params.f = 'json';
      const response = await this.request<{
        features: Array<{
          attributes: Record<string, unknown>;
          geometry?: unknown;
        }>;
      }>();

      return this._convertToGeoJSON(response);
    }
  }

  /**
   * Execute the query and return only the count
   */
  async count(): Promise<number> {
    this._cleanParams();
    this.params.returnCountOnly = true;
    const response = await this.request<{ count: number }>();
    return response.count;
  }

  /**
   * Execute the query and return only feature IDs
   */
  async ids(): Promise<number[]> {
    this._cleanParams();
    this.params.returnIdsOnly = true;
    const response = await this.request<{ objectIds: number[] }>();
    return response.objectIds;
  }

  /**
   * Execute the query and return extent bounds (ArcGIS Server 10.3+)
   */
  async bounds(): Promise<{
    _southWest: { lat: number; lng: number };
    _northEast: { lat: number; lng: number };
  }> {
    this._cleanParams();
    this.params.returnExtentOnly = true;
    const response = await this.request<{
      extent: {
        xmin: number;
        ymin: number;
        xmax: number;
        ymax: number;
      };
    }>();

    if (!response.extent) {
      throw new Error('Invalid bounds returned');
    }

    return {
      _southWest: { lat: response.extent.ymin, lng: response.extent.xmin },
      _northEast: { lat: response.extent.ymax, lng: response.extent.xmax },
    };
  }

  // Private methods

  private _setGeometryParams(geometry: unknown): void {
    this.params.inSR = 4326;
    const converted = this._setGeometry(geometry);
    this.params.geometry = converted.geometry;
    this.params.geometryType = converted.geometryType;
  }

  private _setGeometry(geometry: unknown): { geometry: unknown; geometryType: string } {
    if (!geometry) {
      return { geometry: null, geometryType: 'esriGeometryPoint' };
    }

    // Handle different geometry types
    if (typeof geometry === 'object' && geometry !== null) {
      const geom = geometry as Record<string, unknown>;

      if ('lat' in geom && 'lng' in geom) {
        // Leaflet LatLng-like object
        return {
          geometry: { x: geom.lng, y: geom.lat, spatialReference: { wkid: 4326 } },
          geometryType: 'esriGeometryPoint',
        };
      }

      if ('_southWest' in geom && '_northEast' in geom) {
        // Leaflet Bounds-like object
        const bounds = geom as unknown as Bounds;
        return {
          geometry: {
            xmin: bounds._southWest.lng,
            ymin: bounds._southWest.lat,
            xmax: bounds._northEast.lng,
            ymax: bounds._northEast.lat,
            spatialReference: { wkid: 4326 },
          },
          geometryType: 'esriGeometryEnvelope',
        };
      }
    }

    // Default: assume it's already in Esri geometry format
    return {
      geometry,
      geometryType: 'esriGeometryPoint',
    };
  }

  private _cleanParams(): void {
    delete this.params.returnIdsOnly;
    delete this.params.returnExtentOnly;
    delete this.params.returnCountOnly;
    delete this.params.returnDistinctValues;
  }

  private _convertToGeoJSON(response: {
    features: Array<{
      attributes: Record<string, unknown>;
      geometry?: unknown;
    }>;
  }): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = response.features.map(feature => ({
      type: 'Feature',
      properties: feature.attributes,
      geometry: (feature.geometry as GeoJSON.Geometry) || null,
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}

export function query(options: string | QueryOptions): Query {
  return new Query(options);
}

export default query;
