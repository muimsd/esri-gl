// Type definitions for esri-gl
export type { Map } from 'maplibre-gl';
import type { EsriAuthentication } from '@/request';
export type { EsriAuthentication, EsriAuthOptions } from '@/request';

// Prefer the ArcGIS REST JS package types as the single source of truth; the
// names below are esri-gl aliases of them (kept for backwards-compatible naming).
import type { IExtent, IField, IFeatureSet } from '@esri/arcgis-rest-request';
import type {
  IEditFeatureResult,
  IApplyEditsResult,
  IAttachmentInfo,
} from '@esri/arcgis-rest-feature-service';
export interface ServiceMetadata {
  attribution?: string;
  copyrightText?: string;
  tiles?: string[];
  defaultStyles?: string;
  supportsApplyEditsWithGlobalIds?: boolean;
  supportsPagination?: boolean;
  supportsAttachments?: boolean;
  maxRecordCount?: number;
  [key: string]: unknown;
}

export interface EsriServiceOptions {
  url: string;
  layers?: number[] | number | false;
  layerDefs?: Record<string, string> | false;
  // ArcGIS Dynamic Layer configuration (MapServer export parameter)
  // When provided, this overrides default layer drawing with server-side styling
  dynamicLayers?: DynamicLayer[] | false;
  format?: string;
  dpi?: number;
  transparent?: boolean;
  getAttributionFromService?: boolean;
  time?: number[] | false;
  /** Static token sent as the `token` parameter. */
  token?: string;
  /** ArcGIS Location Platform API key. */
  apiKey?: string;
  /** An ArcGIS REST JS authentication manager (takes precedence over token/apiKey). */
  authentication?: EsriAuthentication;
}

export interface RasterSourceOptions {
  attribution?: string;
  bounds?: [number, number, number, number];
  maxzoom?: number;
  minzoom?: number;
  scheme?: 'xyz' | 'tms';
  tileSize?: number;
  volatile?: boolean;
}

export interface VectorSourceOptions {
  attribution?: string;
  bounds?: [number, number, number, number];
  maxzoom?: number;
  minzoom?: number;
  scheme?: 'xyz' | 'tms';
  volatile?: boolean;
}

export interface ImageServiceOptions extends EsriServiceOptions {
  renderingRule?: Record<string, unknown> | false;
  mosaicRule?: Record<string, unknown> | false;
  bbox?: [number, number, number, number];
  size?: [number, number];
  bboxSR?: string;
  imageSR?: string;
  format?:
    | 'jpgpng'
    | 'png'
    | 'png8'
    | 'png24'
    | 'jpg'
    | 'bmp'
    | 'gif'
    | 'tiff'
    | 'png32'
    | 'bip'
    | 'bsq'
    | 'lerc';
}

// Feature Service query options (subset of ArcGIS REST parameters)
export interface FeatureServiceOptions {
  url: string; // Layer endpoint e.g., .../FeatureServer/0
  where?: string;
  outFields?: string | string[];
  f?: 'json' | 'geojson' | string;
  returnGeometry?: boolean;
  geometry?: Record<string, unknown>;
  geometryType?: string; // esriGeometryPoint|Polyline|Polygon|Envelope
  spatialRel?: string; // esriSpatialRelIntersects, etc.
  inSR?: string;
  outSR?: string;
  orderByFields?: string;
  groupByFieldsForStatistics?: string;
  outStatistics?: Array<Record<string, unknown>>;
  having?: string;
  resultOffset?: number;
  resultRecordCount?: number;
  maxRecordCount?: number;
  getAttributionFromService?: boolean;
  useBoundingBox?: boolean; // Enable screen bounding box filtering for better performance
  useVectorTiles?: boolean; // Use vector tiles instead of GeoJSON
  token?: string;
  apiKey?: string; // ArcGIS Location Platform API key
  authentication?: EsriAuthentication; // ArcGIS REST JS authentication manager
  // Not standard query params but kept for API symmetry; ignored for query URL
  layers?: number[] | number;
}

export interface VectorTileServiceOptions {
  url: string;
  getAttributionFromService?: boolean;
  token?: string;
  apiKey?: string;
  authentication?: EsriAuthentication;
}

export interface VectorBasemapStyleOptions {
  basemapEnum: string;
  token?: string;
  apiKey?: string;
  language?: string;
  worldview?: string;
}

// MapLibre GL JS source types
export interface SourceSpecification {
  type: string;
  [key: string]: unknown;
}

export interface LayerSpecification {
  id: string;
  type: string;
  source?: string | SourceSpecification;
  [key: string]: unknown;
}

// -----------------------------
// ArcGIS Dynamic Layers typing
// -----------------------------

// Minimal typing for renderer and drawing info
export interface EsriRenderer {
  type: string; // 'simple' | 'uniqueValue' | 'classBreaks' | etc.
  [key: string]: unknown;
}

export interface EsriDrawingInfo {
  renderer?: EsriRenderer;
  transparency?: number;
  labelingInfo?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

// Standard map layer source reference for dynamic layers
export interface EsriDynamicMapLayerSource {
  type: 'mapLayer';
  mapLayerId: number;
}

export interface DynamicLayer {
  id: number; // Sublayer id
  // Source: if omitted, will default to { type: 'mapLayer', mapLayerId: id }
  source?: EsriDynamicMapLayerSource | Record<string, unknown>;
  definitionExpression?: string;
  drawingInfo?: EsriDrawingInfo;
  minScale?: number;
  maxScale?: number;
  // Client-friendly visibility flag. The library converts this to ArcGIS 'visibility' in the payload.
  visible?: boolean;
  layerTimeOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

// -----------------------------
// Dynamic Layer filter builders
// -----------------------------

export type LogicalOp = 'AND' | 'OR';
export type ComparisonOp = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'LIKE';

export interface ComparisonFilter {
  field: string;
  op: ComparisonOp;
  value: string | number | boolean | null | Date;
}

export interface BetweenFilter {
  field: string;
  op: 'BETWEEN';
  from: string | number | Date;
  to: string | number | Date;
}

export interface InFilter {
  field: string;
  op: 'IN';
  values: Array<string | number>;
}

export interface NullFilter {
  field: string;
  op: 'IS NULL' | 'IS NOT NULL';
}

export interface GroupFilter {
  op: LogicalOp;
  filters: LayerFilter[];
}

// Allow raw SQL if needed, but prefer typed filters
export type LayerFilter =
  | string
  | ComparisonFilter
  | BetweenFilter
  | InFilter
  | NullFilter
  | GroupFilter;

// -----------------------------
// Advanced DynamicMapService Features
// -----------------------------

// Time-aware layer configuration
export interface LayerTimeOptions {
  useTime?: boolean;
  timeExtent?: number[] | null;
  timeOffset?: number;
  timeOffsetUnits?:
    | 'esriTimeUnitsMilliseconds'
    | 'esriTimeUnitsSeconds'
    | 'esriTimeUnitsMinutes'
    | 'esriTimeUnitsHours'
    | 'esriTimeUnitsDays'
    | 'esriTimeUnitsWeeks'
    | 'esriTimeUnitsMonths'
    | 'esriTimeUnitsYears';
  [key: string]: unknown;
}

// Text symbol for labeling
export interface EsriTextSymbol {
  type: 'esriTS';
  color?: number[];
  backgroundColor?: number[];
  borderLineColor?: number[];
  borderLineSize?: number;
  haloColor?: number[];
  haloSize?: number;
  font?: {
    family?: string;
    size?: number;
    style?: 'normal' | 'italic' | 'oblique';
    weight?: 'normal' | 'bold';
    decoration?: 'none' | 'underline' | 'line-through';
  };
  horizontalAlignment?: 'left' | 'right' | 'center' | 'justify';
  verticalAlignment?: 'baseline' | 'top' | 'middle' | 'bottom';
  angle?: number;
  xoffset?: number;
  yoffset?: number;
}

// Labeling configuration
export interface LayerLabelingInfo {
  labelExpression?: string;
  labelExpressionInfo?: {
    expression: string;
    returnType?: 'Default' | 'String' | 'Numeric';
  };
  useCodedValues?: boolean;
  symbol: EsriTextSymbol;
  minScale?: number;
  maxScale?: number;
  labelPlacement?: string;
  where?: string;
  priority?: number;
  [key: string]: unknown;
}

// Statistics query results
export interface StatisticResult {
  attributes: Record<string, unknown>;
}

/** Layer field metadata. Alias of `IField` (@esri/arcgis-rest-request). */
export type FieldInfo = IField & {
  length?: number;
  nullable?: boolean;
  defaultValue?: unknown;
};

// Layer metadata
export interface LayerInfo {
  id: number;
  name: string;
  type: string;
  description?: string;
  geometryType?:
    | 'esriGeometryPoint'
    | 'esriGeometryMultipoint'
    | 'esriGeometryPolyline'
    | 'esriGeometryPolygon'
    | 'esriGeometryEnvelope';
  minScale?: number;
  maxScale?: number;
  defaultVisibility?: boolean;
  fields?: FieldInfo[];
  drawingInfo?: EsriDrawingInfo;
  extent?: Extent;
  timeInfo?: {
    timeExtent?: [number, number];
    timeField?: string;
    timeFieldFormat?: string;
  };
}

export interface LayerMetadata extends LayerInfo {
  capabilities?: string;
  maxRecordCount?: number;
  standardMaxRecordCount?: number;
  tileMaxRecordCount?: number;
  hasAttachments?: boolean;
  supportsApplyEditsWithGlobalIds?: boolean;
  supportsPagination?: boolean;
  supportsAttachments?: boolean;
  htmlPopupType?: string;
  relationships?: Array<{
    id: number;
    name: string;
    relatedTableId: number;
    cardinality:
      | 'esriRelCardinalityOneToOne'
      | 'esriRelCardinalityOneToMany'
      | 'esriRelCardinalityManyToMany';
  }>;
}

// Spatial extent — alias of `IExtent` (@esri/arcgis-rest-request).
export type Extent = IExtent;

// Feature set for query results — alias of `IFeatureSet`
// (@esri/arcgis-rest-request) plus the query pagination flag.
export type FeatureSet = IFeatureSet & {
  exceededTransferLimit?: boolean;
};

// Layer query options
export interface LayerQueryOptions {
  where?: string;
  geometry?: GeoJSON.Geometry;
  geometryType?:
    | 'esriGeometryEnvelope'
    | 'esriGeometryPoint'
    | 'esriGeometryMultipoint'
    | 'esriGeometryPolyline'
    | 'esriGeometryPolygon';
  spatialRel?:
    | 'esriSpatialRelIntersects'
    | 'esriSpatialRelContains'
    | 'esriSpatialRelWithin'
    | 'esriSpatialRelTouches'
    | 'esriSpatialRelCrosses'
    | 'esriSpatialRelOverlaps';
  returnGeometry?: boolean;
  outFields?: string[] | string;
  orderByFields?: string;
  groupByFieldsForStatistics?: string;
  outStatistics?: Array<{
    statisticType: 'count' | 'sum' | 'min' | 'max' | 'avg' | 'stddev' | 'var';
    onStatisticField: string;
    outStatisticFieldName: string;
  }>;
  resultOffset?: number;
  resultRecordCount?: number;
  returnCountOnly?: boolean;
  returnIdsOnly?: boolean;
  returnDistinctValues?: boolean;
}

// Export options
export interface MapExportOptions {
  bbox: [number, number, number, number];
  size: [number, number];
  dpi?: number;
  format?:
    | 'png'
    | 'png8'
    | 'png24'
    | 'png32'
    | 'jpg'
    | 'pdf'
    | 'gif'
    | 'svg'
    | 'emf'
    | 'ps'
    | 'bmp'
    | 'tiff';
  transparent?: boolean;
  bboxSR?: number;
  imageSR?: number;
  layerDefs?: Record<string, string>;
  dynamicLayers?: DynamicLayer[];
  gdbVersion?: string;
  historicMoment?: number;
}

// Legend information
export interface LegendInfo {
  layerId: number;
  layerName: string;
  layerType: string;
  minScale?: number;
  maxScale?: number;
  legend: Array<{
    label: string;
    url: string;
    imageData: string;
    contentType: string;
    height: number;
    width: number;
    values?: string[];
  }>;
}

// Batch operation types
export interface BatchLayerOperation {
  layerId: number;
  operation: 'visibility' | 'renderer' | 'definition' | 'filter' | 'labels' | 'time';
  value: unknown;
}

// Animation options
export interface TimeAnimationOptions {
  from: Date;
  to: Date;
  intervalMs: number;
  loop?: boolean;
  onFrame?: (currentTime: Date, progress: number) => void;
  onComplete?: () => void;
}

// Event types
export type LayerUpdateType = 'data' | 'style' | 'visibility' | 'time' | 'labels';
export type ServiceEventType = 'layerUpdate' | 'serviceError' | 'timeUpdate' | 'exportComplete';

// Event callback types
export interface LayerUpdateEvent {
  layerId: number;
  changeType: LayerUpdateType;
  timestamp: Date;
}

export interface ServiceErrorEvent {
  error: Error;
  context: string;
  timestamp: Date;
}

// AGOL-specific types

export interface AGOLServiceError {
  code: number;
  message: string;
  details?: string[];
}

/** Result of a single add/update/delete. Alias of `IEditFeatureResult`. */
export type EditResult = IEditFeatureResult;

/** Result of an applyEdits transaction. Alias of `IApplyEditsResult`. */
export type ApplyEditsResult = IApplyEditsResult;

/** Feature attachment metadata. Alias of `IAttachmentInfo` plus optional extras. */
export type AttachmentInfo = IAttachmentInfo & {
  globalId?: string;
  keywords?: string;
};

export interface PaginatedFeatureCollection extends GeoJSON.FeatureCollection {
  exceededTransferLimit?: boolean;
}
