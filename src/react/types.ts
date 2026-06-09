import type { ReactNode } from 'react';
import type { Map, EditResult, ApplyEditsResult } from '@/types';
import type {
  EsriServiceOptions,
  ImageServiceOptions,
  FeatureServiceOptions,
  VectorTileServiceOptions,
  VectorBasemapStyleOptions,
} from '@/types';
import type { IdentifyImageOptions } from '@/Tasks/IdentifyImage';
import type { FindOptions } from '@/Tasks/Find';
import type { PortalResolvedService, PortalServiceKind, PortalItemServiceOptions } from '@/Portal';

// Base service hook types
export interface UseEsriServiceOptions<T extends EsriServiceOptions = EsriServiceOptions> {
  sourceId: string;
  map: Map | null;
  options: T;
  sourceOptions?: Record<string, unknown>;
}

export interface UseEsriServiceResult<T> {
  service: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

// Portal item resolution hook
export interface UsePortalItemOptions {
  sourceId: string;
  map: Map | null;
  /** ArcGIS portal item id to resolve. */
  itemId: string;
  options?: PortalItemServiceOptions;
}

export interface UsePortalItemResult {
  /** The resolved esri-gl service (source already added to the map), or null. */
  service: PortalResolvedService | null;
  /** Which service kind the item resolved to. */
  kind: PortalServiceKind | null;
  /** The service URL the item resolved to. */
  url: string | null;
  /** The portal item title. */
  title: string | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

// Hook-specific option types
export interface UseDynamicMapServiceOptions extends UseEsriServiceOptions<EsriServiceOptions> {}
export interface UseTiledMapServiceOptions extends UseEsriServiceOptions<EsriServiceOptions> {}
export interface UseImageServiceOptions extends UseEsriServiceOptions<ImageServiceOptions> {}
export interface UseVectorTileServiceOptions extends UseEsriServiceOptions<VectorTileServiceOptions> {}
export interface UseVectorBasemapStyleOptions {
  sourceId?: string;
  map?: Map | null;
  options?: VectorBasemapStyleOptions | null;
  sourceOptions?: Record<string, unknown>;
}
export interface UseFeatureServiceOptions extends UseEsriServiceOptions<FeatureServiceOptions> {}

// Task hook types
export interface UseIdentifyFeaturesOptions {
  url: string;
  tolerance?: number;
  returnGeometry?: boolean;
}

export type UseIdentifyImageOptions = IdentifyImageOptions;

export interface UseQueryOptions extends FeatureServiceOptions {}

export type UseFindOptions = FindOptions;

export interface UseFeatureEditingResult {
  addFeatures: (
    features: GeoJSON.Feature[],
    options?: { gdbVersion?: string }
  ) => Promise<EditResult[]>;
  updateFeatures: (
    features: GeoJSON.Feature[],
    options?: { gdbVersion?: string }
  ) => Promise<EditResult[]>;
  deleteFeatures: (params: { objectIds?: number[]; where?: string }) => Promise<EditResult[]>;
  applyEdits: (
    edits: {
      adds?: GeoJSON.Feature[];
      updates?: GeoJSON.Feature[];
      deletes?: number[];
    },
    options?: { gdbVersion?: string }
  ) => Promise<ApplyEditsResult>;
  loading: boolean;
  error: Error | null;
  lastResult: EditResult[] | ApplyEditsResult | null;
}

// Component types
export interface EsriServiceProviderProps {
  children: ReactNode;
  map?: Map | null;
}

export interface EsriLayerProps {
  sourceId: string;
  layerId: string;
  type:
    | 'raster'
    | 'fill'
    | 'line'
    | 'symbol'
    | 'circle'
    | 'fill-extrusion'
    | 'heatmap'
    | 'hillshade';
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  beforeId?: string;
}

// (react-map-gl layer prop types live in src/react-map-gl/types.ts, exported as
// ReactMapGL* from `esri-gl/react-map-gl`.)
