// Type definitions for mapbox-gl-esri-sources

export interface ServiceMetadata {
  attribution?: string
  copyrightText?: string
  tiles?: string[]
  defaultStyles?: string
  [key: string]: any
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
  renderingRule?: Record<string, any> | false;
  mosaicRule?: Record<string, any> | false;
  bbox?: [number, number, number, number];
  size?: [number, number];
  bboxSR?: string;
  imageSR?: string;
  format?: 'jpgpng' | 'png' | 'png8' | 'png24' | 'jpg' | 'bmp' | 'gif' | 'tiff' | 'png32' | 'bip' | 'bsq' | 'lerc';
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

export interface FeatureServiceOptions {
  url: string;
  layers?: number[] | number;
  where?: string;
  outFields?: string | string[];
  f?: 'json' | 'geojson' | 'pbf';
  returnGeometry?: boolean;
  spatialRel?: string;
  geometry?: any;
  geometryType?: string;
  inSR?: string;
  outSR?: string;
  maxRecordCount?: number;
  orderByFields?: string;
  groupByFieldsForStatistics?: string;
  outStatistics?: any[];
  having?: string;
  resultOffset?: number;
  resultRecordCount?: number;
  getAttributionFromService?: boolean;
  token?: string;
}

export interface GeoJSONSourceOptions {
  data?: string | object;
  maxzoom?: number;
  attribution?: string;
  buffer?: number;
  tolerance?: number;
  cluster?: boolean;
  clusterRadius?: number;
  clusterMaxZoom?: number;
  clusterProperties?: object;
  lineMetrics?: boolean;
  generateId?: boolean;
}

// Map interface (basic definition for mapbox-gl/maplibre-gl compatibility)
export interface Map {
  addSource(id: string, source: any): void;
  removeSource(id: string): void;
  getSource(id: string): any;
  _controls?: any[];
}
