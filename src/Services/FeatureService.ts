import { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils';
import type { Map, FeatureServiceOptions, VectorSourceOptions, ServiceMetadata } from '@/types';

interface FeatureServiceExtendedOptions extends FeatureServiceOptions {
  fetchOptions?: RequestInit;
  useVectorTiles?: boolean;
}

export class FeatureService {
  private _sourceId: string;
  private _map: Map;
  private _defaultEsriOptions: Partial<FeatureServiceOptions>;
  private _serviceMetadata: ServiceMetadata | null = null;

  public vectorSrcOptions?: VectorSourceOptions;
  public esriServiceOptions: FeatureServiceExtendedOptions;

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: FeatureServiceExtendedOptions,
    vectorSrcOptions?: VectorSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.');
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url);

    this._sourceId = sourceId;
    this._map = map;

    this._defaultEsriOptions = {
      where: '1=1',
      outFields: '*',
      f: 'geojson',
      returnGeometry: true,
      // Only include geometry/spatial params when geometry is specified
      // No defaults for inSR/outSR; let server defaults apply
      // Do not send maxRecordCount: it's a server capability, not a query param
      token: '',
    };

    this.vectorSrcOptions = vectorSrcOptions;
    this.esriServiceOptions = esriServiceOptions;

    // Default to vector tiles unless explicitly disabled
    if (this.esriServiceOptions.useVectorTiles === undefined) {
      this.esriServiceOptions.useVectorTiles = true;
    }

    this._createSource();
  }

  private async _createSource(): Promise<void> {
    try {
      // Get service metadata
      this._serviceMetadata = await getServiceDetails(
        this.esriServiceOptions.url,
        this.esriServiceOptions.fetchOptions
      );

      // Update attribution if available in service metadata
      if (this._serviceMetadata?.copyrightText) {
        updateAttribution(this._serviceMetadata.copyrightText, this._sourceId, this._map);
      }

      // Check if vector tiles should be used (default behavior)
      const useVectorTiles = this.esriServiceOptions.useVectorTiles !== false;

      if (useVectorTiles) {
        // Create vector tile source
        const tileUrl = this._buildTileUrl();

        // Add vector source to map
        this._map.addSource(this._sourceId, {
          type: 'vector',
          tiles: [tileUrl],
          maxzoom: 24,
          ...this.vectorSrcOptions,
        });
      } else {
        // Fallback to GeoJSON (legacy behavior)
        const queryUrl = this._buildQueryUrl();

        this._map.addSource(this._sourceId, {
          type: 'geojson',
          data: queryUrl,
        });
      }
    } catch (error) {
      console.error('Error creating FeatureService source:', error);
      throw error;
    }
  }

  private _buildTileUrl(): string {
    const baseUrl = this.esriServiceOptions.url;
    return `${baseUrl}/VectorTileServer/tile/{z}/{y}/{x}.pbf`;
  }

  private _buildQueryUrl(): string {
    const options = { ...this._defaultEsriOptions, ...this.esriServiceOptions };
    const baseUrl = `${options.url}/query`;
    const params = new URLSearchParams();

    // Add query parameters (FeatureServer /layerId/query does not accept 'layers')

    params.append('where', options.where || '1=1');
    params.append(
      'outFields',
      Array.isArray(options.outFields) ? options.outFields.join(',') : options.outFields || '*'
    );
    params.append('f', options.f || 'geojson');
    params.append('returnGeometry', (options.returnGeometry !== false).toString());

    // Only include geometry-related params when geometry is present
    if (options.geometry) {
      params.append('geometry', JSON.stringify(options.geometry));
      if (options.geometryType) params.append('geometryType', options.geometryType);
      if (options.spatialRel) params.append('spatialRel', options.spatialRel);
      if (options.inSR) params.append('inSR', options.inSR);
    }
    if (options.outSR) params.append('outSR', options.outSR);
    if (options.orderByFields) params.append('orderByFields', options.orderByFields);
    if (options.groupByFieldsForStatistics)
      params.append('groupByFieldsForStatistics', options.groupByFieldsForStatistics);
    if (options.outStatistics && options.outStatistics.length > 0)
      params.append('outStatistics', JSON.stringify(options.outStatistics));
    if (options.having) params.append('having', options.having);
    if (options.resultOffset) params.append('resultOffset', options.resultOffset.toString());
    if (options.resultRecordCount)
      params.append('resultRecordCount', options.resultRecordCount.toString());
    if (options.token) params.append('token', options.token);

    return `${baseUrl}?${params.toString()}`;
  }

  get _source(): unknown {
    return this._map.getSource(this._sourceId);
  }

  get _url(): string {
    return this._buildQueryUrl();
  }

  get serviceMetadata(): ServiceMetadata | null {
    return this._serviceMetadata;
  }

  updateData(): void {
    // Vector tile sources don't need dynamic data updates like GeoJSON
    // The tiles are fetched automatically based on the tile URL
    // For filtering, we would need to recreate the source or use layer filtering
    console.warn(
      'updateData() is not applicable for vector tile sources. Use layer filtering instead.'
    );
  }

  updateSource(): void {
    // Remove existing source and recreate with new parameters
    if (this._map.getSource(this._sourceId)) {
      this._map.removeSource(this._sourceId);
    }
    this._createSource();
  }

  setWhere(whereClause: string): void {
    this.esriServiceOptions.where = whereClause;
    this.updateSource();
  }

  setOutFields(fields: string | string[]): void {
    this.esriServiceOptions.outFields = fields;
    this.updateSource();
  }

  setLayers(layers: number[] | number): void {
    this.esriServiceOptions.layers = layers;
    this.updateSource();
  }

  setGeometry(geometry: Record<string, unknown>, geometryType?: string): void {
    this.esriServiceOptions.geometry = geometry;
    if (geometryType) {
      this.esriServiceOptions.geometryType = geometryType;
    }
    this.updateSource();
  }

  clearGeometry(): void {
    delete this.esriServiceOptions.geometry;
    delete this.esriServiceOptions.geometryType;
    this.updateSource();
  }

  // Note: maxRecordCount is a server capability; not settable via query params

  remove(): void {
    if (this._map.getSource(this._sourceId)) {
      this._map.removeSource(this._sourceId);
    }
  }

  async queryFeatures(
    options?: Partial<FeatureServiceOptions>
  ): Promise<GeoJSON.FeatureCollection> {
    const queryOptions = { ...this.esriServiceOptions, ...options };
    const queryUrl = this._buildQueryUrlWithOptions(queryOptions);

    try {
      const response = await fetch(queryUrl, this.esriServiceOptions.fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error querying features:', error);
      throw error;
    }
  }

  private _buildQueryUrlWithOptions(options: Partial<FeatureServiceOptions>): string {
    const mergedOptions = { ...this._defaultEsriOptions, ...options };
    const baseUrl = `${mergedOptions.url}/query`;
    const params = new URLSearchParams();

    // Add query parameters using the same logic as _buildQueryUrl (omit 'layers')

    params.append('where', mergedOptions.where || '1=1');
    params.append(
      'outFields',
      Array.isArray(mergedOptions.outFields)
        ? mergedOptions.outFields.join(',')
        : mergedOptions.outFields || '*'
    );
    params.append('f', mergedOptions.f || 'geojson');
    params.append('returnGeometry', (mergedOptions.returnGeometry !== false).toString());

    if (mergedOptions.geometry) {
      params.append('geometry', JSON.stringify(mergedOptions.geometry));
      if (mergedOptions.geometryType) params.append('geometryType', mergedOptions.geometryType);
      if (mergedOptions.spatialRel) params.append('spatialRel', mergedOptions.spatialRel);
      if (mergedOptions.inSR) params.append('inSR', mergedOptions.inSR);
    }
    if (mergedOptions.outSR) params.append('outSR', mergedOptions.outSR);
    if (mergedOptions.orderByFields) params.append('orderByFields', mergedOptions.orderByFields);
    if (mergedOptions.groupByFieldsForStatistics)
      params.append('groupByFieldsForStatistics', mergedOptions.groupByFieldsForStatistics);
    if (mergedOptions.outStatistics && mergedOptions.outStatistics.length > 0)
      params.append('outStatistics', JSON.stringify(mergedOptions.outStatistics));
    if (mergedOptions.having) params.append('having', mergedOptions.having);
    if (mergedOptions.resultOffset)
      params.append('resultOffset', mergedOptions.resultOffset.toString());
    if (mergedOptions.resultRecordCount)
      params.append('resultRecordCount', mergedOptions.resultRecordCount.toString());
    if (mergedOptions.token) params.append('token', mergedOptions.token);

    return `${baseUrl}?${params.toString()}`;
  }
}
