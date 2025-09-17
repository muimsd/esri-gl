// Type definitions for mapbox-gl-esri-sources

export interface ServiceMetadata {
  attribution?: string
  copyrightText?: string
  tiles?: string[]
  defaultStyles?: string
  [key: string]: unknown
}

export interface EsriServiceOptions {
  url: string;
  layers?: number[] | number | false;
  layerDefs?: Record<string, string> | false;
  format?: string;
  dpi?: number;
  transparent?: boolean;
  getAttributionFromService?: boolean;
  time?: number[] | false;
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
  format?: 'jpgpng' | 'png' | 'png8' | 'png24' | 'jpg' | 'bmp' | 'gif' | 'tiff' | 'png32' | 'bip' | 'bsq' | 'lerc';
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
  token?: string;
  // Not standard query params but kept for API symmetry; ignored for query URL
  layers?: number[] | number;
}

export interface VectorTileServiceOptions {
  url: string;
  getAttributionFromService?: boolean;
}

export interface VectorBasemapStyleOptions {
  basemapEnum: string;
  token: string;
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

// Map interface (basic definition for mapbox-gl/maplibre-gl compatibility)
export interface Map {
  addSource(id: string, source: SourceSpecification): void;
  removeSource(id: string): void;
  getSource(id: string): SourceSpecification | undefined;
  addLayer(layer: LayerSpecification, beforeId?: string): void;
  removeLayer(id: string): void;
  getLayer(id: string): LayerSpecification | undefined;
  setPaintProperty(layerId: string, property: string, value: unknown): void;
  moveLayer(id: string, beforeId?: string): void;
  on(type: string, listener: (...args: unknown[]) => void): void;
  off(type: string, listener: (...args: unknown[]) => void): void;
  fire(type: string, data?: unknown): void;
  _controls?: unknown[];
}
