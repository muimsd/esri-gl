/**
 * FeatureService - Tile-based feature loading from ArcGIS FeatureServers
 *
 * This implementation is based on mapbox-gl-arcgis-featureserver by Rowan Winsemius
 * @see https://github.com/rowanwins/mapbox-gl-arcgis-featureserver
 *
 * Key features:
 * - Prioritizes PBF format for minimal payload size (requires ArcGIS Server 10.7+)
 * - Falls back to GeoJSON if PBF is not supported
 * - Uses tiled requests for efficient data loading
 * - Client-side feature deduplication
 * - Service bounds detection and coordinate projection
 */

import * as tilebelt from '@mapbox/tilebelt';
import tileDecode from 'arcgis-pbf-parser';
import { cleanTrailingSlash, updateAttribution } from '@/utils';
import type { Map, FeatureServiceOptions, ServiceMetadata, Extent } from '@/types';

// Extended options for FeatureService
export interface FeatureServiceExtendedOptions extends FeatureServiceOptions {
  fetchOptions?: RequestInit;
  /** Use a static zoom level for tile requests instead of dynamic */
  useStaticZoomLevel?: boolean;
  /** Minimum zoom level for data requests (default: 7 if useStaticZoomLevel, else 2) */
  minZoom?: number;
  /** Simplification factor for geometry (0-1, default: 0.3) */
  simplifyFactor?: number;
  /** Decimal precision for coordinates (default: 8) */
  precision?: number;
  /** Time filter: start date */
  from?: Date | number | null;
  /** Time filter: end date */
  to?: Date | number | null;
  /** Set attribution from service metadata (default: true) */
  setAttributionFromService?: boolean;
  /** Use service bounds to limit tile requests (default: true) */
  useServiceBounds?: boolean;
  /** Custom projection endpoint URL */
  projectionEndpoint?: string;
}

interface GeoJSONSourceOptions {
  attribution?: string;
  buffer?: number;
  cluster?: boolean;
  clusterMaxZoom?: number;
  clusterMinPoints?: number;
  clusterProperties?: Record<string, unknown>;
  clusterRadius?: number;
  data?: string | GeoJSON.FeatureCollection;
  filter?: unknown[];
  generateId?: boolean;
  lineMetrics?: boolean;
  maxzoom?: number;
  promoteId?: string | { [key: string]: string };
  tolerance?: number;
}

interface StyleData {
  type: string;
  source?: string;
  'source-layer'?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}

interface ExtendedServiceMetadata extends ServiceMetadata {
  supportedQueryFormats?: string;
  uniqueIdField?: { name: string; type: string };
  extent?: Extent;
  geometryType?: string;
  name?: string;
}

export class FeatureService {
  private _sourceId: string;
  private _map: Map;
  private _tileIndices: globalThis.Map<number, globalThis.Map<string, boolean>>;
  private _featureIndices: globalThis.Map<number, globalThis.Map<string | number, boolean>>;
  private _featureCollections: globalThis.Map<number, GeoJSON.FeatureCollection>;
  private _esriServiceOptions: Required<
    Pick<
      FeatureServiceExtendedOptions,
      | 'url'
      | 'useStaticZoomLevel'
      | 'minZoom'
      | 'simplifyFactor'
      | 'precision'
      | 'where'
      | 'outFields'
      | 'setAttributionFromService'
      | 'useServiceBounds'
      | 'projectionEndpoint'
    >
  > &
    Omit<FeatureServiceExtendedOptions, 'url'>;
  private _fallbackProjectionEndpoint: string;
  private _serviceMetadata: ExtendedServiceMetadata | null = null;
  private _maxExtent: [number, number, number, number];
  private _boundEvent: (() => void) | null = null;
  private _format: 'pbf' | 'geojson' = 'pbf';
  private _sourceReadyResolve: (() => void) | null = null;
  private _sourceReadyReject: ((error: Error) => void) | null = null;

  /**
   * Promise that resolves when the source has been successfully added to the map
   * and is ready to receive data.
   */
  public sourceReady: Promise<void>;

  /**
   * The GeoJSON source options passed to the constructor
   */
  public geojsonSourceOptions: GeoJSONSourceOptions;

  constructor(
    sourceId: string,
    map: Map,
    arcgisOptions: FeatureServiceExtendedOptions,
    geojsonSourceOptions?: GeoJSONSourceOptions
  ) {
    if (!sourceId || !map || !arcgisOptions) {
      throw new Error(
        'Source id, map and arcgisOptions must be supplied as the first three arguments.'
      );
    }
    if (!arcgisOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.');
    }

    this._sourceId = sourceId;
    this._map = map;

    // Initialize tile/feature tracking maps
    this._tileIndices = new globalThis.Map();
    this._featureIndices = new globalThis.Map();
    this._featureCollections = new globalThis.Map();

    // Clean URL and set up options
    const cleanedUrl = cleanTrailingSlash(arcgisOptions.url);

    this._esriServiceOptions = {
      useStaticZoomLevel: false,
      minZoom: arcgisOptions.useStaticZoomLevel ? 7 : 2,
      simplifyFactor: 0.3,
      precision: 8,
      where: '1=1',
      to: null,
      from: null,
      outFields: '*',
      setAttributionFromService: true,
      useServiceBounds: true,
      projectionEndpoint: `${cleanedUrl.split('rest/services')[0]}rest/services/Geometry/GeometryServer/project`,
      token: '',
      fetchOptions: undefined,
      ...arcgisOptions,
      url: cleanedUrl,
    };

    this._fallbackProjectionEndpoint =
      'https://tasks.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/project';
    this._maxExtent = [-Infinity, Infinity, -Infinity, Infinity];

    this.geojsonSourceOptions = geojsonSourceOptions || {};

    // Create the sourceReady promise
    this.sourceReady = new Promise<void>((resolve, reject) => {
      this._sourceReadyResolve = resolve;
      this._sourceReadyReject = reject;
    });

    // Add GeoJSON source to map
    this._map.addSource(sourceId, {
      type: 'geojson' as const,
      data: this._getBlankFc(),
      ...this.geojsonSourceOptions,
    });

    // Initialize the service
    this._initialize();
  }

  private async _initialize(): Promise<void> {
    try {
      await this._getServiceMetadata();

      if (!this.supportsPbf) {
        if (!this.supportsGeojson) {
          this._map.removeSource(this._sourceId);
          const error = new Error('Server does not support PBF or GeoJSON query formats.');
          if (this._sourceReadyReject) this._sourceReadyReject(error);
          throw error;
        }
        this._format = 'geojson';
      }

      if (this._esriServiceOptions.useServiceBounds && this._serviceMetadata?.extent) {
        const serviceExtent = this._serviceMetadata.extent;
        if (serviceExtent.spatialReference?.wkid === 4326) {
          this._setBounds([
            serviceExtent.xmin,
            serviceExtent.ymin,
            serviceExtent.xmax,
            serviceExtent.ymax,
          ]);
        } else {
          await this._projectBounds();
        }
      }

      // Ensure unique ID field is included in outFields
      if (
        this._esriServiceOptions.outFields !== '*' &&
        this._serviceMetadata?.uniqueIdField?.name
      ) {
        const currentFields = this._esriServiceOptions.outFields;
        const uniqueIdField = this._serviceMetadata.uniqueIdField.name;
        if (typeof currentFields === 'string') {
          if (!currentFields.includes(uniqueIdField)) {
            this._esriServiceOptions.outFields = `${currentFields},${uniqueIdField}`;
          }
        } else if (Array.isArray(currentFields)) {
          if (!currentFields.includes(uniqueIdField)) {
            this._esriServiceOptions.outFields = [...currentFields, uniqueIdField].join(',');
          }
        }
      }

      this._setAttribution();
      this.enableRequests();
      this._clearAndRefreshTiles();

      if (this._sourceReadyResolve) this._sourceReadyResolve();
    } catch (error) {
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('Error initializing FeatureService:', error);
      }
      if (this._sourceReadyReject && error instanceof Error) {
        this._sourceReadyReject(error);
      }
    }
  }

  /**
   * Remove the source and clean up event listeners
   */
  remove(): void {
    this.disableRequests();
    if (this._map && typeof this._map.removeSource === 'function') {
      try {
        // First, remove any layers that are using this source
        const mapWithStyle = this._map as unknown as {
          getStyle?: () => { layers?: Array<{ id: string; source?: string }> };
        };
        if (mapWithStyle.getStyle) {
          const style = mapWithStyle.getStyle();
          const layers = style?.layers || [];
          layers.forEach(layer => {
            if (
              layer.source === this._sourceId &&
              this._map.getLayer &&
              this._map.getLayer(layer.id)
            ) {
              this._map.removeLayer(layer.id);
            }
          });
        }

        if (this._map.getSource && this._map.getSource(this._sourceId)) {
          this._map.removeSource(this._sourceId);
        }
      } catch (error) {
        console.warn(`Failed to remove source ${this._sourceId}:`, error);
      }
    }
  }

  /** Alias for remove() for API compatibility */
  destroySource(): void {
    this.remove();
  }

  private _getBlankFc(): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  private _setBounds(bounds: [number, number, number, number]): void {
    this._maxExtent = bounds;
  }

  /** Check if service supports GeoJSON format */
  get supportsGeojson(): boolean {
    return (this._serviceMetadata?.supportedQueryFormats?.indexOf('geoJSON') ?? -1) > -1;
  }

  /** Check if service supports PBF format */
  get supportsPbf(): boolean {
    return (this._serviceMetadata?.supportedQueryFormats?.indexOf('PBF') ?? -1) > -1;
  }

  /** Get the service metadata */
  get serviceMetadata(): ExtendedServiceMetadata | null {
    return this._serviceMetadata;
  }

  /** Get the source object from the map */
  get _source(): unknown {
    return this._map.getSource(this._sourceId);
  }

  /** Get the current query URL */
  get _url(): string {
    return this._esriServiceOptions.url;
  }

  /** Get the esri service options */
  get esriServiceOptions(): FeatureServiceExtendedOptions {
    return this._esriServiceOptions;
  }

  /** Get default style based on geometry type */
  get defaultStyle(): StyleData {
    const geometryType = String(this._serviceMetadata?.geometryType || 'esriGeometryPoint');

    const baseStyle: Partial<StyleData> = {
      source: this._sourceId,
    };

    if (geometryType.includes('Point')) {
      return {
        type: 'circle',
        ...baseStyle,
        paint: {
          'circle-radius': 4,
          'circle-color': '#3b82f6',
          'circle-stroke-color': '#1e40af',
          'circle-stroke-width': 1,
        },
      };
    } else if (geometryType.includes('Polyline')) {
      return {
        type: 'line',
        ...baseStyle,
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
        },
      };
    } else if (geometryType.includes('Polygon')) {
      return {
        type: 'fill',
        ...baseStyle,
        paint: {
          'fill-color': 'rgba(59, 130, 246, 0.4)',
          'fill-outline-color': '#1e40af',
        },
      };
    }

    // Default to circle for unknown geometry types
    return {
      type: 'circle',
      ...baseStyle,
      paint: {
        'circle-radius': 4,
        'circle-color': '#3b82f6',
        'circle-stroke-color': '#1e40af',
        'circle-stroke-width': 1,
      },
    };
  }

  /** Get style, fetching metadata if needed */
  async getStyle(): Promise<StyleData> {
    if (this._serviceMetadata) {
      return this.defaultStyle;
    }
    await this._getServiceMetadata();
    return this.defaultStyle;
  }

  /** Disable map event listeners */
  disableRequests(): void {
    if (this._boundEvent) {
      this._map.off('moveend', this._boundEvent);
      this._boundEvent = null;
    }
  }

  /** Enable map event listeners */
  enableRequests(): void {
    this._boundEvent = this._findAndMapData.bind(this);
    this._map.on('moveend', this._boundEvent);
  }

  private _clearAndRefreshTiles(): void {
    this._tileIndices = new globalThis.Map();
    this._featureIndices = new globalThis.Map();
    this._featureCollections = new globalThis.Map();
    this._findAndMapData();
  }

  /**
   * Set the WHERE clause filter
   */
  setWhere(newWhere: string): void {
    this._esriServiceOptions.where = newWhere;
    this._clearAndRefreshTiles();
  }

  /**
   * Clear the WHERE clause filter
   */
  clearWhere(): void {
    this._esriServiceOptions.where = '1=1';
    this._clearAndRefreshTiles();
  }

  /**
   * Set a date/time filter
   */
  setDate(to: Date | number | null, from?: Date | number | null): void {
    this._esriServiceOptions.to = to;
    this._esriServiceOptions.from = from ?? null;
    this._clearAndRefreshTiles();
  }

  /**
   * Set the authentication token
   */
  setToken(token: string | null): void {
    this._esriServiceOptions.token = token ?? '';
    this._clearAndRefreshTiles();
  }

  /**
   * Set output fields
   */
  setOutFields(fields: string | string[]): void {
    this._esriServiceOptions.outFields = Array.isArray(fields) ? fields.join(',') : fields;
    this._clearAndRefreshTiles();
  }

  private _createOrGetTileIndex(zoomLevel: number): globalThis.Map<string, boolean> {
    const existingZoomIndex = this._tileIndices.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;
    const newIndex = new globalThis.Map<string, boolean>();
    this._tileIndices.set(zoomLevel, newIndex);
    return newIndex;
  }

  private _createOrGetFeatureCollection(zoomLevel: number): GeoJSON.FeatureCollection {
    const existingZoomIndex = this._featureCollections.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;
    const fc = this._getBlankFc();
    this._featureCollections.set(zoomLevel, fc);
    return fc;
  }

  private _createOrGetFeatureIdIndex(zoomLevel: number): globalThis.Map<string | number, boolean> {
    const existingFeatureIdIndex = this._featureIndices.get(zoomLevel);
    if (existingFeatureIdIndex) return existingFeatureIdIndex;
    const newFeatureIdIndex = new globalThis.Map<string | number, boolean>();
    this._featureIndices.set(zoomLevel, newFeatureIdIndex);
    return newFeatureIdIndex;
  }

  private async _findAndMapData(): Promise<void> {
    const z = this._map.getZoom();

    if (z < this._esriServiceOptions.minZoom) {
      return;
    }

    const bounds = this._map.getBounds();
    if (!bounds) return;

    const boundsArray = bounds.toArray();
    const primaryTile = tilebelt.bboxToTile([
      boundsArray[0][0],
      boundsArray[0][1],
      boundsArray[1][0],
      boundsArray[1][1],
    ]) as [number, number, number];

    if (this._esriServiceOptions.useServiceBounds) {
      if (
        this._maxExtent[0] !== -Infinity &&
        !this._doesTileOverlapBbox(this._maxExtent, boundsArray)
      ) {
        return;
      }
    }

    // Round to nearest even zoom level to reuse data across zooms
    const zoomLevel = this._esriServiceOptions.useStaticZoomLevel
      ? this._esriServiceOptions.minZoom
      : 2 * Math.floor(z / 2);

    const zoomLevelIndex = this._createOrGetTileIndex(zoomLevel);
    const featureIdIndex = this._createOrGetFeatureIdIndex(zoomLevel);
    const fc = this._createOrGetFeatureCollection(zoomLevel);

    let tilesToRequest: [number, number, number][] = [];

    if (primaryTile[2] < zoomLevel) {
      let candidateTiles = tilebelt.getChildren(primaryTile) as [number, number, number][];
      let minZoomOfCandidates = candidateTiles[0][2];

      while (minZoomOfCandidates < zoomLevel) {
        const newCandidateTiles: [number, number, number][] = [];
        candidateTiles.forEach(t => {
          newCandidateTiles.push(...(tilebelt.getChildren(t) as [number, number, number][]));
        });
        candidateTiles = newCandidateTiles;
        minZoomOfCandidates = candidateTiles[0][2];
      }

      for (let index = 0; index < candidateTiles.length; index++) {
        if (this._doesTileOverlapBbox(candidateTiles[index], boundsArray)) {
          tilesToRequest.push(candidateTiles[index]);
        }
      }
    } else {
      tilesToRequest.push(primaryTile);
    }

    // Filter out already fetched tiles
    tilesToRequest = tilesToRequest.filter(tile => {
      const quadKey = tilebelt.tileToQuadkey(tile);
      if (zoomLevelIndex.has(quadKey)) {
        return false;
      }
      zoomLevelIndex.set(quadKey, true);
      return true;
    });

    if (tilesToRequest.length === 0) {
      this._updateFcOnMap(fc);
      return;
    }

    // Calculate tolerance for simplification
    const mapWidth = Math.abs(boundsArray[1][0] - boundsArray[0][0]);
    const canvas = this._map.getCanvas();
    const tolerance = (mapWidth / canvas.width) * this._esriServiceOptions.simplifyFactor;

    await this._loadTiles(tilesToRequest, tolerance, featureIdIndex, fc);
    this._updateFcOnMap(fc);
  }

  private async _loadTiles(
    tilesToRequest: [number, number, number][],
    tolerance: number,
    featureIdIndex: globalThis.Map<string | number, boolean>,
    fc: GeoJSON.FeatureCollection
  ): Promise<void> {
    const promises = tilesToRequest.map(t => this._getTile(t, tolerance));
    const featureCollections = await Promise.all(promises);

    featureCollections.forEach(tileFc => {
      if (tileFc) this._iterateItems(tileFc, featureIdIndex, fc);
    });
  }

  private _iterateItems(
    tileFc: GeoJSON.FeatureCollection | null | undefined,
    featureIdIndex: globalThis.Map<string | number, boolean>,
    fc: GeoJSON.FeatureCollection
  ): void {
    if (!tileFc || !tileFc.features) return;

    tileFc.features.forEach(feature => {
      const featureId = feature.id;
      if (featureId !== undefined && !featureIdIndex.has(featureId)) {
        fc.features.push(feature);
        featureIdIndex.set(featureId, true);
      } else if (featureId === undefined) {
        // If no ID, just add it (can't deduplicate)
        fc.features.push(feature);
      }
    });
  }

  private get _time(): string | false {
    if (!this._esriServiceOptions.to) return false;
    let from = this._esriServiceOptions.from;
    let to = this._esriServiceOptions.to;
    if (from instanceof Date) from = from.valueOf();
    if (to instanceof Date) to = to.valueOf();

    return `${from ?? ''},${to}`;
  }

  private async _getTile(
    tile: [number, number, number],
    tolerance: number
  ): Promise<GeoJSON.FeatureCollection | null> {
    const tileBounds = tilebelt.tileToBBOX(tile);

    const extent = {
      spatialReference: {
        latestWkid: 4326,
        wkid: 4326,
      },
      xmin: tileBounds[0],
      ymin: tileBounds[1],
      xmax: tileBounds[2],
      ymax: tileBounds[3],
    };

    const params = new URLSearchParams({
      f: this._format,
      geometry: JSON.stringify(extent),
      where: this._esriServiceOptions.where,
      outFields:
        typeof this._esriServiceOptions.outFields === 'string'
          ? this._esriServiceOptions.outFields
          : this._esriServiceOptions.outFields?.join(',') || '*',
      outSR: '4326',
      returnZ: 'false',
      returnM: 'false',
      precision: this._esriServiceOptions.precision.toString(),
      quantizationParameters: JSON.stringify({
        extent,
        tolerance,
        mode: 'view',
      }),
      resultType: 'tile',
      spatialRel: 'esriSpatialRelIntersects',
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
    });

    if (this._time) {
      params.append('time', this._time);
    }

    this._appendTokenIfExists(params);

    try {
      const response = await fetch(
        `${this._esriServiceOptions.url}/query?${params.toString()}`,
        this._esriServiceOptions.fetchOptions
      );

      if (!response.ok) {
        console.warn(`Tile fetch failed: HTTP ${response.status}`);
        return null;
      }

      if (this._format === 'pbf') {
        const buffer = await response.arrayBuffer();
        try {
          const decoded = tileDecode(new Uint8Array(buffer));
          return decoded.featureCollection;
        } catch {
          console.error('Could not parse arcgis buffer. Please check the url you requested.');
          return null;
        }
      } else {
        return await response.json();
      }
    } catch (error) {
      console.warn('Error fetching tile:', error);
      return null;
    }
  }

  private _updateFcOnMap(fc: GeoJSON.FeatureCollection): void {
    const source = this._map.getSource(this._sourceId) as
      | { setData: (data: GeoJSON.FeatureCollection) => void }
      | undefined;
    if (source && 'setData' in source) {
      source.setData(fc);
    }
  }

  private _doesTileOverlapBbox(
    tile: [number, number, number] | [number, number, number, number],
    bbox: [number, number][] | [[number, number], [number, number]]
  ): boolean {
    const tileBounds =
      tile.length === 4 ? tile : tilebelt.tileToBBOX(tile as [number, number, number]);
    if (tileBounds[2] < bbox[0][0]) return false;
    if (tileBounds[0] > bbox[1][0]) return false;
    if (tileBounds[3] < bbox[0][1]) return false;
    if (tileBounds[1] > bbox[1][1]) return false;
    return true;
  }

  private async _getServiceMetadata(): Promise<ExtendedServiceMetadata> {
    if (this._serviceMetadata !== null) return this._serviceMetadata;

    const params = new URLSearchParams({ f: 'json' });
    this._appendTokenIfExists(params);

    const response = await fetch(
      `${this._esriServiceOptions.url}?${params.toString()}`,
      this._esriServiceOptions.fetchOptions
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch service metadata: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }

    this._serviceMetadata = data as ExtendedServiceMetadata;
    return this._serviceMetadata;
  }

  /**
   * Query features by longitude/latitude with optional radius
   */
  async getFeaturesByLonLat(
    lnglat: { lng: number; lat: number },
    radius: number = 20,
    returnGeometry: boolean = false
  ): Promise<GeoJSON.FeatureCollection> {
    const params = new URLSearchParams({
      sr: '4326',
      geometryType: 'esriGeometryPoint',
      geometry: JSON.stringify({
        x: lnglat.lng,
        y: lnglat.lat,
        spatialReference: { wkid: 4326 },
      }),
      returnGeometry: returnGeometry.toString(),
      outFields: '*',
      spatialRel: 'esriSpatialRelIntersects',
      units: 'esriSRUnit_Meter',
      distance: radius.toString(),
      f: 'geojson',
    });

    if (this._time) {
      params.append('time', this._time);
    }

    this._appendTokenIfExists(params);

    const response = await fetch(
      `${this._esriServiceOptions.url}/query?${params.toString()}`,
      this._esriServiceOptions.fetchOptions
    );

    if (!response.ok) {
      throw new Error(`Query failed: HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Query features by object IDs
   */
  async getFeaturesByObjectIds(
    objectIds: number[] | string,
    returnGeometry: boolean = false
  ): Promise<GeoJSON.FeatureCollection> {
    const idsString = Array.isArray(objectIds) ? objectIds.join(',') : objectIds;

    const params = new URLSearchParams({
      sr: '4326',
      objectIds: idsString,
      returnGeometry: returnGeometry.toString(),
      outFields: '*',
      f: 'geojson',
    });

    this._appendTokenIfExists(params);

    const response = await fetch(
      `${this._esriServiceOptions.url}/query?${params.toString()}`,
      this._esriServiceOptions.fetchOptions
    );

    if (!response.ok) {
      throw new Error(`Query failed: HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Query features with custom options
   */
  async queryFeatures(
    options?: Partial<FeatureServiceOptions>
  ): Promise<GeoJSON.FeatureCollection> {
    const queryOptions = { ...this._esriServiceOptions, ...options };
    const params = new URLSearchParams();

    params.append('f', 'geojson');
    params.append('where', queryOptions.where || '1=1');
    params.append(
      'outFields',
      typeof queryOptions.outFields === 'string'
        ? queryOptions.outFields
        : queryOptions.outFields?.join(',') || '*'
    );
    params.append('returnGeometry', (queryOptions.returnGeometry !== false).toString());

    if (queryOptions.geometry) {
      params.append('geometry', JSON.stringify(queryOptions.geometry));
      if (queryOptions.geometryType) params.append('geometryType', queryOptions.geometryType);
      if (queryOptions.spatialRel) params.append('spatialRel', queryOptions.spatialRel);
      if (queryOptions.inSR) params.append('inSR', queryOptions.inSR);
    }
    if (queryOptions.outSR) params.append('outSR', queryOptions.outSR);
    if (queryOptions.orderByFields) params.append('orderByFields', queryOptions.orderByFields);
    if (queryOptions.groupByFieldsForStatistics)
      params.append('groupByFieldsForStatistics', queryOptions.groupByFieldsForStatistics);
    if (queryOptions.outStatistics && queryOptions.outStatistics.length > 0)
      params.append('outStatistics', JSON.stringify(queryOptions.outStatistics));
    if (queryOptions.having) params.append('having', queryOptions.having);
    if (queryOptions.resultOffset)
      params.append('resultOffset', queryOptions.resultOffset.toString());
    if (queryOptions.resultRecordCount)
      params.append('resultRecordCount', queryOptions.resultRecordCount.toString());
    if (queryOptions.token) params.append('token', queryOptions.token);

    try {
      const response = await fetch(
        `${this._esriServiceOptions.url}/query?${params.toString()}`,
        this._esriServiceOptions.fetchOptions
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('Error querying features:', error);
      }
      throw error;
    }
  }

  private async _projectBounds(): Promise<void> {
    if (!this._serviceMetadata?.extent) return;

    const params = new URLSearchParams({
      geometries: JSON.stringify({
        geometryType: 'esriGeometryEnvelope',
        geometries: [this._serviceMetadata.extent],
      }),
      inSR: (this._serviceMetadata.extent.spatialReference?.wkid || 4326).toString(),
      outSR: '4326',
      f: 'json',
    });

    let fetchOptions = this._esriServiceOptions.fetchOptions;
    if (!this._projectionEndpointIsFallback()) {
      this._appendTokenIfExists(params);
    } else {
      fetchOptions = undefined;
    }

    try {
      const response = await fetch(
        `${this._esriServiceOptions.projectionEndpoint}?${params.toString()}`,
        fetchOptions
      );

      if (!response.ok) {
        throw new Error(`Projection failed: HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(JSON.stringify(data.error));
      }

      const extent = data.geometries[0];
      this._maxExtent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
    } catch (error) {
      // If projection endpoint fails, try fallback
      if (!this._projectionEndpointIsFallback()) {
        this._esriServiceOptions.projectionEndpoint = this._fallbackProjectionEndpoint;
        await this._projectBounds();
      } else {
        console.warn('Could not project service bounds:', error);
      }
    }
  }

  private _projectionEndpointIsFallback(): boolean {
    return this._esriServiceOptions.projectionEndpoint === this._fallbackProjectionEndpoint;
  }

  private _setAttribution(): void {
    if (!this._esriServiceOptions.setAttributionFromService) return;

    const copyrightText = this._serviceMetadata?.copyrightText;
    if (copyrightText) {
      updateAttribution(copyrightText, this._sourceId, this._map);
    } else {
      // Add default Esri attribution
      updateAttribution('', this._sourceId, this._map);
    }
  }

  private _appendTokenIfExists(params: URLSearchParams): void {
    const token = this._esriServiceOptions.token;
    if (token) {
      params.append('token', token);
    }
  }

  // Legacy method aliases for backwards compatibility

  /** @deprecated Use setWhere instead */
  updateSource(): void {
    this._clearAndRefreshTiles();
  }

  /** @deprecated Use setWhere instead */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setLayers(_layers: number[] | number): void {
    // FeatureService doesn't support layers parameter (single layer only)
    console.warn('setLayers is not applicable to FeatureService. Use the layer URL directly.');
  }

  /** @deprecated Use clearWhere instead */
  setGeometry(geometry: Record<string, unknown>, geometryType?: string): void {
    // For compatibility, but recommend using queryFeatures with geometry parameter
    console.warn(
      'setGeometry is not recommended. Use queryFeatures({ geometry: ... }) for spatial queries.'
    );
    this._esriServiceOptions.geometry = geometry;
    if (geometryType) {
      this._esriServiceOptions.geometryType = geometryType;
    }
  }

  /** @deprecated */
  clearGeometry(): void {
    delete this._esriServiceOptions.geometry;
    delete this._esriServiceOptions.geometryType;
  }

  /** @deprecated Use enableRequests/disableRequests instead */
  setBoundingBoxFilter(enabled: boolean): void {
    if (enabled) {
      this.enableRequests();
    } else {
      this.disableRequests();
    }
  }

  /** @deprecated Use _clearAndRefreshTiles instead */
  updateData(): void {
    this._clearAndRefreshTiles();
  }
}
