import { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils';
import type { Map, FeatureServiceOptions, VectorSourceOptions, ServiceMetadata } from '@/types';

interface FeatureServiceExtendedOptions extends FeatureServiceOptions {
  fetchOptions?: RequestInit;
  useVectorTiles?: boolean;
  useBoundingBox?: boolean; // Enable screen bounding box filtering
}

interface StyleData {
  type: string;
  source?: string;
  'source-layer'?: string;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
}

export class FeatureService {
  private _sourceId: string;
  private _map: Map;
  private _defaultEsriOptions: Partial<FeatureServiceOptions>;
  private _serviceMetadata: ServiceMetadata | null = null;
  private _defaultStyleData: StyleData | null = null;
  private _boundingBoxUpdateHandler: (() => void) | null = null;

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

    // Default to bounding box filtering for better performance
    if (this.esriServiceOptions.useBoundingBox === undefined) {
      this.esriServiceOptions.useBoundingBox = true;
    }

    this._createSource();
  }

  private async _createSource(): Promise<void> {
    if (!this._map) return;

    try {
      // Get service metadata
      this._serviceMetadata = await getServiceDetails(
        this.esriServiceOptions.url,
        this.esriServiceOptions.fetchOptions
      );

      // Check if vector tiles should be used (default behavior)
      // Note: Most FeatureServers don't support vector tiles, so we'll detect and fallback
      const vectorTileSupport = await this._checkVectorTileSupport();

      const useVectorTiles = this.esriServiceOptions.useVectorTiles !== false && vectorTileSupport;

      if (useVectorTiles) {
        // Create vector tile source
        const tileUrl = this._buildTileUrl();

        // Add vector source to map if it doesn't already exist
        if (!this._map.getSource(this._sourceId)) {
          this._map.addSource(this._sourceId, {
            type: 'vector',
            tiles: [tileUrl],
            maxzoom: 24,
            ...this.vectorSrcOptions,
          });
        }
      } else {
        // Fallback to GeoJSON (most common for FeatureServers)
        const queryUrl = this._buildQueryUrl();

        if (!this._map.getSource(this._sourceId)) {
          this._map.addSource(this._sourceId, {
            type: 'geojson',
            data: queryUrl,
          });
        }
      }

      // Update attribution after source is added if available in service metadata
      if (this._serviceMetadata?.copyrightText) {
        updateAttribution(this._serviceMetadata.copyrightText, this._sourceId, this._map);
      }

      // Set up bounding box update listeners if using GeoJSON and bounding box filtering
      if (!useVectorTiles && this.esriServiceOptions.useBoundingBox) {
        this._setupBoundingBoxUpdates();
      }
    } catch (error) {
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('Error creating FeatureService source:', error);
      }
      // Don't rethrow - service should handle errors gracefully
      // The source just won't be created and the service will be in a degraded state
    }
  }

  private async _checkVectorTileSupport(): Promise<boolean> {
    try {
      // Try to check if a VectorTileServer endpoint exists
      const vectorTileUrl = this.esriServiceOptions.url.replace(
        '/FeatureServer/',
        '/VectorTileServer/'
      );

      // Only check if the URL actually changed (meaning it was a FeatureServer URL)
      if (vectorTileUrl === this.esriServiceOptions.url) {
        return false;
      }

      const response = await fetch(vectorTileUrl + '?f=json', this.esriServiceOptions.fetchOptions);

      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  private _buildTileUrl(): string {
    const baseUrl = this.esriServiceOptions.url;
    // Check if this is a FeatureServer that supports vector tiles
    // Most FeatureServers don't have VectorTileServer endpoints
    // We'll use a different approach for FeatureServers with vector tile capability

    // Try to construct vector tile URL from FeatureServer URL
    // Some services have both FeatureServer and VectorTileServer endpoints
    const vectorTileUrl = baseUrl.replace('/FeatureServer/', '/VectorTileServer/');
    return `${vectorTileUrl}/tile/{z}/{y}/{x}.pbf`;
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

    // Add bounding box geometry if enabled and map is available
    if (options.useBoundingBox !== false && this._map) {
      const bounds = this._map.getBounds();
      if (bounds) {
        const geometry = {
          xmin: bounds.getWest(),
          ymin: bounds.getSouth(),
          xmax: bounds.getEast(),
          ymax: bounds.getNorth(),
          spatialReference: { wkid: 4326 },
        };
        params.append('geometry', JSON.stringify(geometry));
        params.append('geometryType', 'esriGeometryEnvelope');
        params.append('spatialRel', 'esriSpatialRelIntersects');
        params.append('inSR', '4326');
      }
    }

    // Only include geometry-related params when geometry is present (and not bounding box)
    if (options.geometry && options.useBoundingBox === false) {
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

  get defaultStyle(): StyleData {
    if (this._defaultStyleData) return this._defaultStyleData;

    // Generate default style based on geometry type from service metadata
    const geometryType = String(this._serviceMetadata?.geometryType || 'esriGeometryPoint');
    const isVectorTiles = this.esriServiceOptions.useVectorTiles !== false;

    // For vector tiles, we need to include source-layer
    const baseStyle: Partial<StyleData> = {
      source: this._sourceId,
    };

    if (isVectorTiles && this._serviceMetadata?.name) {
      baseStyle['source-layer'] = String(this._serviceMetadata.name);
    }

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

  getStyle(): Promise<StyleData> {
    return new Promise((resolve, reject) => {
      if (this._serviceMetadata) {
        resolve(this.defaultStyle);
      } else {
        // Wait for service metadata to be loaded
        this._getServiceMetadata()
          .then(() => resolve(this.defaultStyle))
          .catch(error => reject(error));
      }
    });
  }

  private async _getServiceMetadata(): Promise<void> {
    if (this._serviceMetadata) return;

    this._serviceMetadata = await getServiceDetails(
      this.esriServiceOptions.url,
      this.esriServiceOptions.fetchOptions
    );
  }

  updateData(): void {
    // For GeoJSON sources with bounding box filtering, update the data URL
    if (
      this.esriServiceOptions.useVectorTiles === false &&
      this.esriServiceOptions.useBoundingBox
    ) {
      const source = this._map.getSource(this._sourceId);
      if (source && 'setData' in source && typeof source.setData === 'function') {
        const newQueryUrl = this._buildQueryUrl();
        // @ts-ignore - GeoJSON source setData method not in generic Source type
        source.setData(newQueryUrl);
      }
    } else {
      // Vector tile sources don't need dynamic data updates like GeoJSON
      // The tiles are fetched automatically based on the tile URL
      // For filtering, we would need to recreate the source or use layer filtering
      console.warn(
        'updateData() is only applicable for GeoJSON sources with bounding box filtering.'
      );
    }
  }

  private _setupBoundingBoxUpdates(): void {
    if (this._boundingBoxUpdateHandler) {
      // Remove existing handler
      this._map.off('moveend', this._boundingBoxUpdateHandler);
      this._map.off('zoomend', this._boundingBoxUpdateHandler);
    }

    // Debounced update function to prevent excessive API calls
    let updateTimeout: NodeJS.Timeout | null = null;
    this._boundingBoxUpdateHandler = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      updateTimeout = setTimeout(() => {
        this.updateData();
      }, 300); // 300ms debounce
    };

    // Listen for map movement and zoom changes
    this._map.on('moveend', this._boundingBoxUpdateHandler);
    this._map.on('zoomend', this._boundingBoxUpdateHandler);
  }

  private _removeBoundingBoxUpdates(): void {
    if (this._boundingBoxUpdateHandler) {
      this._map.off('moveend', this._boundingBoxUpdateHandler);
      this._map.off('zoomend', this._boundingBoxUpdateHandler);
      this._boundingBoxUpdateHandler = null;
    }
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

  setBoundingBoxFilter(enabled: boolean): void {
    this.esriServiceOptions.useBoundingBox = enabled;
    if (enabled && this.esriServiceOptions.useVectorTiles === false) {
      this._setupBoundingBoxUpdates();
    } else {
      this._removeBoundingBoxUpdates();
    }
    this.updateSource();
  }

  // Note: maxRecordCount is a server capability; not settable via query params

  remove(): void {
    this._removeBoundingBoxUpdates();
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

        // Then check if source exists before trying to remove it
        if (this._map.getSource && this._map.getSource(this._sourceId)) {
          this._map.removeSource(this._sourceId);
        }
      } catch (error) {
        console.warn(`Failed to remove source ${this._sourceId}:`, error);
      }
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
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('Error querying features:', error);
      }
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
