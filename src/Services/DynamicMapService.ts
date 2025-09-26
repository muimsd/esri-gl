import { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils';
import type {
  Map,
  EsriServiceOptions,
  RasterSourceOptions,
  ServiceMetadata,
  DynamicLayer,
  EsriDrawingInfo,
  EsriRenderer,
  LayerFilter,
  GroupFilter,
  BetweenFilter,
  InFilter,
  NullFilter,
  ComparisonFilter,
  LayerLabelingInfo,
  LayerTimeOptions,
  TimeAnimationOptions,
  StatisticResult,
  LayerQueryOptions,
  FeatureSet,
  MapExportOptions,
  LegendInfo,
  LayerMetadata,
  FieldInfo,
  Extent,
  LayerInfo,
  BatchLayerOperation,
} from '@/types';

// Minimal raster source type returned to the map
type RasterExportSource = RasterSourceOptions & {
  type: 'raster';
  tiles: string[];
  tileSize: number;
};

interface DynamicMapServiceOptions extends EsriServiceOptions {
  from?: Date | number;
  to?: Date | number;
  fetchOptions?: RequestInit;
}

export class DynamicMapService {
  private _sourceId: string;
  private _map: Map;
  private _defaultEsriOptions: Omit<Required<EsriServiceOptions>, 'url' | 'time'>;
  private _serviceMetadata: ServiceMetadata | null = null;
  private _pendingUpdate: number | null = null;
  private _lastUpdateTime = 0;
  private _updateDelay = 50; // ms debounce to avoid rapid successive aborts

  public rasterSrcOptions?: RasterSourceOptions;
  public esriServiceOptions: DynamicMapServiceOptions;

  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: DynamicMapServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  ) {
    if (!esriServiceOptions.url) {
      throw new Error('A url must be supplied as part of the esriServiceOptions object.');
    }

    esriServiceOptions.url = cleanTrailingSlash(esriServiceOptions.url);

    this._sourceId = sourceId;
    this._map = map;

    this._defaultEsriOptions = {
      layers: false,
      layerDefs: false,
      dynamicLayers: false,
      format: 'png24',
      dpi: 96,
      transparent: true,
      getAttributionFromService: true,
    };

    this.rasterSrcOptions = rasterSrcOptions;
    this.esriServiceOptions = esriServiceOptions;
    this._createSource();

    if (this.options.getAttributionFromService) this.setAttributionFromService();
  }

  get options(): Required<DynamicMapServiceOptions> {
    return {
      ...this._defaultEsriOptions,
      ...this.esriServiceOptions,
    } as Required<DynamicMapServiceOptions>;
  }

  get _layersStr(): string | false {
    let lyrs = this.options.layers;
    if (!lyrs) return false;
    if (!Array.isArray(lyrs)) lyrs = [lyrs];
    return `show:${lyrs.join(',')}`;
  }

  get _layerDefs(): string | false {
    if (this.options.layerDefs !== false) return JSON.stringify(this.options.layerDefs);
    return false;
  }

  get _time(): string | false {
    if (!this.options.to) return false;
    let from = this.options.from;
    let to = this.options.to;
    if (from instanceof Date) from = from.valueOf();
    if (to instanceof Date) to = to.valueOf();

    return `${from},${to}`;
  }

  // ArcGIS Dynamic Layer styling parameter (JSON string)
  get _dynamicLayers(): string | false {
    const dl = this.options.dynamicLayers as DynamicLayer[] | false | undefined;
    if (!dl) return false;
    try {
      const normalized = (dl as DynamicLayer[]).map(l => {
        const { visible, ...rest } = l;

        const withSource = {
          ...rest,
          // ensure required source exists
          source: l.source ?? { type: 'mapLayer', mapLayerId: l.id },
        } as Record<string, unknown>;

        // Convert client-friendly 'visible' to ArcGIS 'visibility'
        if (typeof visible === 'boolean') {
          (withSource as Record<string, unknown>).visibility = visible;
        }
        return withSource;
      });
      const result = JSON.stringify(normalized);
      console.log('DynamicMapService: Generated dynamicLayers JSON:', result);
      return result;
    } catch {
      return false;
    }
  }

  get _source(): RasterExportSource {
    const tileSize = this.rasterSrcOptions?.tileSize ?? 256;
    // These are the bare minimum parameters
    const params = new URLSearchParams({
      bboxSR: '3857',
      imageSR: '3857',
      format: this.options.format,
      layers: this._layersStr || '',
      transparent: this.options.transparent.toString(),
      size: `${tileSize},${tileSize}`,
      f: 'image',
    });

    // These are optional params
    if (this._time) params.append('time', this._time);
    if (this._layerDefs) params.append('layerDefs', this._layerDefs);
    if (this._dynamicLayers) params.append('dynamicLayers', this._dynamicLayers);

    const tileUrl = `${this.options.url}/export?bbox={bbox-epsg-3857}&${params.toString()}`;
    console.log('DynamicMapService: Generated tile URL:', tileUrl);

    return {
      type: 'raster',
      tiles: [tileUrl],
      tileSize,
      ...this.rasterSrcOptions,
    };
  }

  private _createSource(): void {
    this._map.addSource(this._sourceId, this._source);
  }

  // This requires hooking into some undocumented methods
  private _updateSource(): void {
    // Simple debounce: collapse multiple rapid calls (e.g., visibility + labels in same tick)
    const now = performance.now();
    if (now - this._lastUpdateTime < this._updateDelay) {
      if (this._pendingUpdate) cancelAnimationFrame(this._pendingUpdate);
      this._pendingUpdate = requestAnimationFrame(() => this._updateSourceInternal());
      return;
    }
    this._lastUpdateTime = now;
    this._updateSourceInternal();
  }

  private _updateSourceInternal(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = this._map.getSource(this._sourceId) as any;
    if (!src) return;

    try {
      src.tiles[0] = this._source.tiles[0];
      src._options = this._source;

      if (src.setTiles) {
        // New MapboxGL >= 2.13.0
        src.setTiles(this._source.tiles);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((this._map as any).style.sourceCaches) {
        // Old MapboxGL and MaplibreGL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._map as any).style.sourceCaches[this._sourceId].clearTiles();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._map as any).style.sourceCaches[this._sourceId].update((this._map as any).transform);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } else if ((this._map as any).style._otherSourceCaches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._map as any).style.sourceCaches[this._sourceId].clearTiles();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._map as any).style.sourceCaches[this._sourceId].update((this._map as any).transform);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Ignore aborted tile refresh; map will request new tiles on next frame
        return;
      }
      // Swallow occasional transient errors that can happen during style reloads
      if (error && (error as Error).message?.includes('Source') && (error as Error).message?.includes('not found')) {
        return;
      }
      throw error;
    }
  }

  setLayerDefs(obj: Record<string, string>): void {
    this.esriServiceOptions.layerDefs = obj;
    this._updateSource();
  }

  /**
   * Replace the entire dynamicLayers array. Server applies these drawing rules.
   * Note: dynamicLayers overrides default drawing for listed sublayers.
   */
  setDynamicLayers(layers: DynamicLayer[] | false): void {
    this.esriServiceOptions.dynamicLayers = layers || false;
    this._updateSource();
  }

  /** Helper to ensure all visible layers are included when using dynamicLayers */
  private _ensureAllVisibleLayers(dynamicLayers: DynamicLayer[]): DynamicLayer[] {
    const visibleLayerIds = this._getVisibleLayerIds();
    const existingIds = new Set(dynamicLayers.map(dl => dl.id));

    // Add entries for visible layers that aren't already in dynamicLayers
    const additional = visibleLayerIds
      .filter(id => !existingIds.has(id))
      .map(id => ({ id, visible: true }));

    return [...dynamicLayers, ...additional];
  }

  /** Get the list of currently visible layer IDs */
  private _getVisibleLayerIds(): number[] {
    const lyrs = this.options.layers;
    if (!lyrs) return [];
    if (!Array.isArray(lyrs)) return [lyrs];
    return lyrs;
  }

  /** Merge/update a sublayer's drawingInfo with provided fields. */
  setLayerDrawingInfo(layerId: number, drawingInfo: EsriDrawingInfo): void {
    const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
    const next = Array.isArray(current) ? [...current] : [];
    const idx = next.findIndex(l => l.id === layerId);
    if (idx >= 0) {
      next[idx] = { ...next[idx], drawingInfo: { ...next[idx].drawingInfo, ...drawingInfo } };
    } else {
      next.push({ id: layerId, drawingInfo });
    }
    // Ensure all visible layers are included
    this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(next);
    this._updateSource();
  }

  /** Convenience to set a renderer on a sublayer */
  setLayerRenderer(layerId: number, renderer: EsriRenderer): void {
    this.setLayerDrawingInfo(layerId, { renderer });
  }

  /** Show/hide a sublayer via dynamicLayers */
  setLayerVisibility(layerId: number, visible: boolean): void {
    const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
    const next = Array.isArray(current) ? [...current] : [];
    const idx = next.findIndex(l => l.id === layerId);
    if (idx >= 0) {
      next[idx] = { ...next[idx], visible };
    } else {
      next.push({ id: layerId, visible });
    }
    // Ensure all visible layers are included
    this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(next);
    this._updateSource();
  }

  /** Set a definitionExpression for a sublayer, applied server-side */
  setLayerDefinition(layerId: number, definitionExpression: string): void {
    const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
    const next = Array.isArray(current) ? [...current] : [];
    const idx = next.findIndex(l => l.id === layerId);
    if (idx >= 0) {
      next[idx] = { ...next[idx], definitionExpression };
    } else {
      next.push({ id: layerId, definitionExpression });
    }
    // Ensure all visible layers are included
    this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(next);
    this._updateSource();
  }

  // Build a SQL where clause and apply as definitionExpression
  setLayerFilter(layerId: number, filter: LayerFilter): void {
    const where = this._buildWhere(filter);
    if (where) this.setLayerDefinition(layerId, where);
  }

  private _escapeValue(val: unknown): string {
    if (val === null) return 'NULL';
    if (val instanceof Date) return `${val.valueOf()}`; // epoch ms for time-enabled services
    if (typeof val === 'number') return `${val}`;
    if (typeof val === 'boolean') return val ? '1' : '0';
    const s = String(val).replace(/'/g, "''");
    return `'${s}'`;
  }

  // Very small, pragmatic builder that covers common cases in types.ts
  private _isGroupFilter(f: LayerFilter): f is GroupFilter {
    return (
      typeof f !== 'string' &&
      'op' in f &&
      (f.op === 'AND' || f.op === 'OR') &&
      'filters' in f &&
      Array.isArray((f as GroupFilter).filters)
    );
  }

  private _isBetweenFilter(f: LayerFilter): f is BetweenFilter {
    return (
      typeof f !== 'string' &&
      'op' in f &&
      f.op === 'BETWEEN' &&
      'field' in f &&
      typeof (f as BetweenFilter).field === 'string' &&
      'from' in f &&
      (f as BetweenFilter).from !== undefined &&
      'to' in f &&
      (f as BetweenFilter).to !== undefined
    );
  }

  private _isInFilter(f: LayerFilter): f is InFilter {
    return (
      typeof f !== 'string' &&
      'op' in f &&
      f.op === 'IN' &&
      'field' in f &&
      typeof (f as InFilter).field === 'string' &&
      'values' in f &&
      Array.isArray((f as InFilter).values)
    );
  }

  private _isNullFilter(f: LayerFilter): f is NullFilter {
    return (
      typeof f !== 'string' &&
      'op' in f &&
      (f.op === 'IS NULL' || f.op === 'IS NOT NULL') &&
      'field' in f &&
      typeof (f as NullFilter).field === 'string'
    );
  }

  private _isComparisonFilter(f: LayerFilter): f is ComparisonFilter {
    return (
      typeof f !== 'string' &&
      'field' in f &&
      typeof (f as ComparisonFilter).field === 'string' &&
      'op' in f &&
      typeof (f as ComparisonFilter).op === 'string' &&
      'value' in f &&
      (f as ComparisonFilter).value !== undefined
    );
  }

  private _buildWhere(filter: LayerFilter): string | undefined {
    if (!filter) return undefined;
    if (typeof filter === 'string') return filter.trim();

    if (this._isBetweenFilter(filter)) {
      return `${filter.field} BETWEEN ${this._escapeValue(filter.from)} AND ${this._escapeValue(filter.to)}`;
    }
    if (this._isInFilter(filter)) {
      const vals = filter.values.map(v => this._escapeValue(v)).join(', ');
      return `${filter.field} IN (${vals})`;
    }
    if (this._isNullFilter(filter)) {
      return `${filter.field} ${filter.op}`;
    }
    if (this._isGroupFilter(filter)) {
      const built = (filter.filters as LayerFilter[])
        .map((f: LayerFilter) => this._buildWhere(f))
        .filter((s): s is string => Boolean(s));
      if (!built.length) return undefined;
      if (built.length === 1) return built[0];
      return `(${built.join(` ${filter.op} `)})`;
    }
    if (this._isComparisonFilter(filter)) {
      return `${filter.field} ${filter.op} ${this._escapeValue(filter.value)}`;
    }
    return undefined;
  }

  setLayers(arr: number[] | number): void {
    this.esriServiceOptions.layers = arr;
    this._updateSource();
  }

  setDate(from: Date | number, to: Date | number): void {
    this.esriServiceOptions.from = from;
    this.esriServiceOptions.to = to;
    this._updateSource();
  }

  setAttributionFromService(): Promise<void> {
    if (this._serviceMetadata) {
      updateAttribution(this._serviceMetadata.copyrightText || '', this._sourceId, this._map);
      return Promise.resolve();
    } else {
      return this.getMetadata().then(() => {
        updateAttribution(this._serviceMetadata?.copyrightText || '', this._sourceId, this._map);
      });
    }
  }

  getMetadata(): Promise<ServiceMetadata> {
    if (this._serviceMetadata !== null) return Promise.resolve(this._serviceMetadata);
    return new Promise((resolve, reject) => {
      getServiceDetails(this.esriServiceOptions.url, this.esriServiceOptions.fetchOptions)
        .then(data => {
          this._serviceMetadata = data;
          resolve(this._serviceMetadata);
        })
        .catch(err => reject(err));
    });
  }

  get _layersStrIdentify(): string | false {
    const layersStr = this._layersStr;
    return layersStr ? layersStr.replace('show', 'visible') : false;
  }

  identify(
    lnglat: { lng: number; lat: number },
    returnGeometry: boolean = false
  ): Promise<unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = (this._map as any).getCanvas();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bounds = (this._map as any).getBounds().toArray();

    const params = new URLSearchParams({
      sr: '4326',
      geometryType: 'esriGeometryPoint',
      geometry: JSON.stringify({
        x: lnglat.lng,
        y: lnglat.lat,
        spatialReference: {
          wkid: 4326,
        },
      }),
      tolerance: '3',
      returnGeometry: returnGeometry.toString(),
      imageDisplay: `${canvas.width},${canvas.height},96`,
      mapExtent: `${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`,
      layers: this._layersStrIdentify || '',
      f: 'json',
    });

    if (this._layerDefs) params.append('layerDefs', this._layerDefs);
    if (this._dynamicLayers) params.append('dynamicLayers', this._dynamicLayers);
    if (this._time) params.append('time', this._time);

    return new Promise((resolve, reject) => {
      fetch(
        `${this.esriServiceOptions.url}/identify?${params.toString()}`,
        this.esriServiceOptions.fetchOptions
      )
        .then(response => response.json())
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  // ========================================
  // Advanced Features
  // ========================================

  /** Set labeling configuration for a sublayer */
  setLayerLabels(layerId: number, labelingInfo: LayerLabelingInfo): void {
    const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
    const next = Array.isArray(current) ? [...current] : [];
    const idx = next.findIndex(l => l.id === layerId);

    if (idx >= 0) {
      next[idx] = {
        ...next[idx],
        drawingInfo: {
          ...next[idx].drawingInfo,
          labelingInfo: [labelingInfo],
        },
      };
    } else {
      next.push({
        id: layerId,
        drawingInfo: { labelingInfo: [labelingInfo] },
      });
    }

    // Ensure all visible layers are included
    this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(next);
    this._updateSource();
  }

  /** Toggle label visibility for a sublayer */
  setLayerLabelsVisible(layerId: number, visible: boolean): void {
    if (visible) {
      // If enabling labels but no labeling info exists, set a default
      const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
      const layer = Array.isArray(current) ? current.find(l => l.id === layerId) : null;

      if (!layer?.drawingInfo?.labelingInfo) {
        // Set a basic label configuration
        this.setLayerLabels(layerId, {
          labelExpression: '[OBJECTID]', // Default to object ID
          symbol: {
            type: 'esriTS',
            color: [0, 0, 0, 255],
            font: { family: 'Arial', size: 8 },
          },
        });
      }
    } else {
      // Remove labeling info to disable labels
      const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
      const next = Array.isArray(current) ? [...current] : [];
      const idx = next.findIndex(l => l.id === layerId);

      if (idx >= 0) {
        const drawingInfo = { ...next[idx].drawingInfo };
        delete drawingInfo.labelingInfo;
        next[idx] = { ...next[idx], drawingInfo };

        // Ensure all visible layers are included
        this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(next);
        this._updateSource();
      }
    }
  }

  /** Set time options for a time-enabled sublayer */
  setLayerTimeOptions(layerId: number, timeOptions: LayerTimeOptions): void {
    const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
    const next = Array.isArray(current) ? [...current] : [];
    const idx = next.findIndex(l => l.id === layerId);

    if (idx >= 0) {
      next[idx] = { ...next[idx], layerTimeOptions: timeOptions };
    } else {
      next.push({ id: layerId, layerTimeOptions: timeOptions });
    }

    // Ensure all visible layers are included
    this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(next);
    this._updateSource();
  }

  /** Animate through time periods for time-enabled layers */
  async animateTime(options: TimeAnimationOptions): Promise<void> {
    const { from, to, intervalMs, loop = false, onFrame, onComplete } = options;
    const totalDuration = to.getTime() - from.getTime();
    const steps = Math.ceil(totalDuration / intervalMs);

    return new Promise<void>(resolve => {
      let currentStep = 0;

      const animate = () => {
        if (currentStep >= steps && !loop) {
          onComplete?.();
          resolve();
          return;
        }

        const progress = (currentStep % steps) / steps;
        const currentTime = new Date(from.getTime() + progress * totalDuration);

        // Update service time extent
        this.esriServiceOptions.from = currentTime;
        this.esriServiceOptions.to = currentTime;
        this._updateSource();

        onFrame?.(currentTime, progress);
        currentStep++;

        setTimeout(animate, intervalMs);
      };

      animate();
    });
  }

  /** Get statistics for a sublayer */
  async getLayerStatistics(
    layerId: number,
    statisticFields: Array<{
      statisticType: 'count' | 'sum' | 'min' | 'max' | 'avg' | 'stddev' | 'var';
      onStatisticField: string;
      outStatisticFieldName: string;
    }>,
    options: {
      where?: string;
      groupByFieldsForStatistics?: string;
    } = {}
  ): Promise<StatisticResult[]> {
    const queryUrl = `${this.esriServiceOptions.url}/${layerId}/query`;
    const params = new URLSearchParams({
      f: 'json',
      where: options.where || '1=1',
      outStatistics: JSON.stringify(statisticFields),
      returnGeometry: 'false',
    });

    if (options.groupByFieldsForStatistics) {
      params.append('groupByFieldsForStatistics', options.groupByFieldsForStatistics);
    }

    const response = await fetch(`${queryUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Statistics query failed: ${data.error.message}`);
    }

    return data.features || [];
  }

  /** Query features from a specific sublayer */
  async queryLayerFeatures(layerId: number, options: LayerQueryOptions = {}): Promise<FeatureSet> {
    const queryUrl = `${this.esriServiceOptions.url}/${layerId}/query`;
    const params = new URLSearchParams({
      f: 'json',
      where: options.where || '1=1',
      returnGeometry: options.returnGeometry !== false ? 'true' : 'false',
      outFields: Array.isArray(options.outFields)
        ? options.outFields.join(',')
        : options.outFields || '*',
    });

    if (options.geometry) {
      params.append('geometry', JSON.stringify(options.geometry));
      params.append('geometryType', options.geometryType || 'esriGeometryEnvelope');
      params.append('spatialRel', options.spatialRel || 'esriSpatialRelIntersects');
    }

    if (options.orderByFields) {
      params.append('orderByFields', options.orderByFields);
    }

    if (options.resultOffset) {
      params.append('resultOffset', options.resultOffset.toString());
    }

    if (options.resultRecordCount) {
      params.append('resultRecordCount', options.resultRecordCount.toString());
    }

    if (options.returnCountOnly) {
      params.append('returnCountOnly', 'true');
    }

    if (options.returnIdsOnly) {
      params.append('returnIdsOnly', 'true');
    }

    const response = await fetch(`${queryUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Layer query failed: ${data.error.message}`);
    }

    return data;
  }

  /** Export high-resolution map image */
  async exportMapImage(options: MapExportOptions): Promise<Blob> {
    const exportUrl = `${this.esriServiceOptions.url}/export`;
    const params = new URLSearchParams({
      f: 'image',
      bbox: options.bbox.join(','),
      size: options.size.join(','),
      format: options.format || 'png24',
      transparent: options.transparent !== false ? 'true' : 'false',
      dpi: (options.dpi || 96).toString(),
      bboxSR: (options.bboxSR || 3857).toString(),
      imageSR: (options.imageSR || 3857).toString(),
    });

    if (options.layerDefs) {
      params.append('layerDefs', JSON.stringify(options.layerDefs));
    }

    if (options.dynamicLayers) {
      const normalized = this._ensureAllVisibleLayers(options.dynamicLayers);
      params.append('dynamicLayers', JSON.stringify(normalized));
    }

    if (options.gdbVersion) {
      params.append('gdbVersion', options.gdbVersion);
    }

    if (options.historicMoment) {
      params.append('historicMoment', options.historicMoment.toString());
    }

    const response = await fetch(`${exportUrl}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /** Generate legend information for layers */
  async generateLegend(layerIds?: number[]): Promise<LegendInfo[]> {
    const legendUrl = `${this.esriServiceOptions.url}/legend`;
    const params = new URLSearchParams({
      f: 'json',
    });

    if (layerIds?.length) {
      params.append('layers', layerIds.join(','));
    }

    const response = await fetch(`${legendUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Legend generation failed: ${data.error.message}`);
    }

    return data.layers || [];
  }

  /** Get detailed information about a specific layer */
  async getLayerInfo(layerId: number): Promise<LayerMetadata> {
    const layerUrl = `${this.esriServiceOptions.url}/${layerId}`;
    const params = new URLSearchParams({ f: 'json' });

    const response = await fetch(`${layerUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Layer info request failed: ${data.error.message}`);
    }

    return data;
  }

  /** Get field information for a layer */
  async getLayerFields(layerId: number): Promise<FieldInfo[]> {
    const layerInfo = await this.getLayerInfo(layerId);
    return layerInfo.fields || [];
  }

  /** Get spatial extent of a layer */
  async getLayerExtent(layerId: number): Promise<Extent> {
    const layerInfo = await this.getLayerInfo(layerId);
    if (!layerInfo.extent) {
      throw new Error(`No extent available for layer ${layerId}`);
    }
    return layerInfo.extent;
  }

  /** Discover all layers in the service */
  async discoverLayers(): Promise<LayerInfo[]> {
    const serviceUrl = this.esriServiceOptions.url;
    const params = new URLSearchParams({ f: 'json' });

    const response = await fetch(`${serviceUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.error) {
      throw new Error(`Service discovery failed: ${data.error.message}`);
    }

    return data.layers || [];
  }

  /** Apply multiple layer operations in a single update */
  setBulkLayerProperties(operations: BatchLayerOperation[]): void {
    const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
    const next = Array.isArray(current) ? [...current] : [];

    // Process all operations
    for (const op of operations) {
      const idx = next.findIndex(l => l.id === op.layerId);
      const layer = idx >= 0 ? { ...next[idx] } : { id: op.layerId };

      switch (op.operation) {
        case 'visibility':
          layer.visible = op.value as boolean;
          break;
        case 'renderer':
          layer.drawingInfo = { ...layer.drawingInfo, renderer: op.value as EsriRenderer };
          break;
        case 'definition':
          layer.definitionExpression = op.value as string;
          break;
        case 'filter': {
          const where = this._buildWhere(op.value as LayerFilter);
          if (where) layer.definitionExpression = where;
          break;
        }
        case 'labels':
          layer.drawingInfo = {
            ...layer.drawingInfo,
            labelingInfo: op.value as LayerLabelingInfo[],
          };
          break;
        case 'time':
          layer.layerTimeOptions = op.value as LayerTimeOptions;
          break;
      }

      if (idx >= 0) {
        next[idx] = layer;
      } else {
        next.push(layer);
      }
    }

    // Ensure all visible layers are included
    this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(next);
    this._updateSource();
  }

  // Transaction-like updates
  private _pendingUpdates: DynamicLayer[] | null = null;

  /** Begin a batch update transaction */
  beginUpdate(): void {
    const current = (this.esriServiceOptions.dynamicLayers as DynamicLayer[] | false) || [];
    this._pendingUpdates = Array.isArray(current) ? [...current] : [];
  }

  /** Commit all pending updates */
  commitUpdate(): void {
    if (this._pendingUpdates) {
      this.esriServiceOptions.dynamicLayers = this._ensureAllVisibleLayers(this._pendingUpdates);
      this._pendingUpdates = null;
      this._updateSource();
    }
  }

  /** Rollback pending updates */
  rollbackUpdate(): void {
    this._pendingUpdates = null;
  }

  /** Check if currently in a transaction */
  get isInTransaction(): boolean {
    return this._pendingUpdates !== null;
  }

  update(): void {
    this._updateSource();
  }

  remove(): void {
    this._map.removeSource(this._sourceId);
  }
}
