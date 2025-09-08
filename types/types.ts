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

// Map interface (basic definition for mapbox-gl/maplibre-gl compatibility)
export interface Map {
  addSource(id: string, source: any): void;
  removeSource(id: string): void;
  getSource(id: string): any;
  _controls?: any[];
}
