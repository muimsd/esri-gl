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
  ServiceMetadata,
  Map,
} from './types'

export * from './types'

export declare class DynamicMapService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: EsriServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  )

  readonly options: Required<EsriServiceOptions>
  rasterSrcOptions?: RasterSourceOptions
  esriServiceOptions: EsriServiceOptions

  setAttributionFromService(): Promise<void>
  update(): void
  remove(): void
}

export declare class TiledMapService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: EsriServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  )

  readonly options: Required<EsriServiceOptions>
  rasterSrcOptions?: RasterSourceOptions
  esriServiceOptions: EsriServiceOptions

  setAttributionFromService(): Promise<void>
  update(): void
  remove(): void
}

export declare class ImageService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: ImageServiceOptions,
    rasterSrcOptions?: RasterSourceOptions
  )

  readonly options: Required<ImageServiceOptions>
  rasterSrcOptions?: RasterSourceOptions
  esriServiceOptions: ImageServiceOptions

  setAttributionFromService(): Promise<void>
  update(): void
  remove(): void
}

export declare class VectorTileService {
  constructor(
    sourceId: string,
    map: Map,
    esriServiceOptions: VectorTileServiceOptions,
    vectorSrcOptions?: VectorSourceOptions
  )

  readonly options: Required<VectorTileServiceOptions>
  vectorSrcOptions?: VectorSourceOptions
  esriServiceOptions: VectorTileServiceOptions

  setAttributionFromService(): Promise<void>
  update(): void
  remove(): void
}

export declare class VectorBasemapStyle {
  constructor(styleId: string, map: Map, vectorBasemapStyleOptions: VectorBasemapStyleOptions)

  readonly options: Required<VectorBasemapStyleOptions>
  vectorBasemapStyleOptions: VectorBasemapStyleOptions

  update(): void
  remove(): void
}

// Utility functions
export declare function cleanTrailingSlash(url: string): string
export declare function getServiceDetails(
  url: string,
  fetchOptions?: RequestInit
): Promise<ServiceMetadata>
export declare function updateAttribution(newAttribution: string, sourceId: string, map: Map): void
