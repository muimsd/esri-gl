// Type definitions for esri-gl
// Project: https://github.com/muimsd/esri-gl
// Definitions by: Generated types

import {
  EsriServiceOptions,
  RasterSourceOptions,
  ImageServiceOptions,
  VectorTileServiceOptions,
  VectorBasemapStyleOptions,
  VectorSourceOptions,
  FeatureServiceOptions,
  GeoJSONSourceOptions,
  ServiceMetadata,
  Map,
} from './types';

export * from './types';

export declare class DynamicMapService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: EsriServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  );

  readonly options: Required<EsriServiceOptions>;
  rasterSrcOptions?: RasterSourceOptions;
  esriServiceOptions: EsriServiceOptions;

  setAttributionFromService(): Promise<void>;
  update(): void;
  remove(): void;
}

export declare class TiledMapService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: EsriServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  );

  readonly options: Required<EsriServiceOptions>;
  rasterSrcOptions?: RasterSourceOptions;
  esriServiceOptions: EsriServiceOptions;

  setAttributionFromService(): Promise<void>;
  update(): void;
  remove(): void;
}

export declare class ImageService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: ImageServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  );

  readonly options: Required<ImageServiceOptions>;
  rasterSrcOptions?: RasterSourceOptions;
  esriServiceOptions: ImageServiceOptions;

  setAttributionFromService(): Promise<void>;
  update(): void;
  remove(): void;
}

export declare class VectorTileService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: VectorTileServiceOptions,
    vectorSrcOptions?: VectorSourceOptions
  );

  readonly options: Required<VectorTileServiceOptions>;
  vectorSrcOptions?: VectorSourceOptions;
  esriServiceOptions: VectorTileServiceOptions;

  setAttributionFromService(): Promise<void>;
  update(): void;
  remove(): void;
}

export declare class VectorBasemapStyle {
  constructor(styleId: string, map: Map, vectorBasemapStyleOptions: VectorBasemapStyleOptions);

  readonly options: Required<VectorBasemapStyleOptions>;
  vectorBasemapStyleOptions: VectorBasemapStyleOptions;

  update(): void;
  remove(): void;
}

export declare class FeatureService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: FeatureServiceOptions,
    geojsonSrcOptions?: GeoJSONSourceOptions
  );

  geojsonSrcOptions?: GeoJSONSourceOptions;
  esriServiceOptions: FeatureServiceOptions;

  readonly serviceMetadata: ServiceMetadata | null;
  updateData(): void;
  setWhere(whereClause: string): void;
  setOutFields(fields: string | string[]): void;
  setLayers(layers: number[] | number): void;
  setGeometry(geometry: any, geometryType?: string): void;
  clearGeometry(): void;
  setMaxRecordCount(count: number): void;
  remove(): void;
  queryFeatures(options?: Partial<FeatureServiceOptions>): Promise<any>;
}

// Utility functions
export declare function cleanTrailingSlash(url: string): string;
export declare function getServiceDetails(
  url: string,
  fetchOptions?: RequestInit
): Promise<ServiceMetadata>;
export declare function updateAttribution(newAttribution: string, sourceId: string, map: Map): void;
