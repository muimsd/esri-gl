// Main esri-gl exports (same as main.ts)
// Services
export { Service } from '@/Services/Service';
export { DynamicMapService } from '@/Services/DynamicMapService';
export { TiledMapService } from '@/Services/TiledMapService';
export { ImageService } from '@/Services/ImageService';
export { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';
export { VectorTileService } from '@/Services/VectorTileService';
export { FeatureService } from '@/Services/FeatureService';

// Tasks
export { Task } from '@/Tasks/Task';
export { Query, query } from '@/Tasks/Query';
export { Find, find } from '@/Tasks/Find';
export { IdentifyFeatures, type LayerScaleRange } from '@/Tasks/IdentifyFeatures';
export { IdentifyImage, identifyImage } from '@/Tasks/IdentifyImage';

// Portal item resolution (resolve item ids / web maps to services) + search
export {
  serviceFromPortalItem,
  servicesFromWebMap,
  searchPortalItems,
  SearchQueryBuilder,
  isPortalItemId,
  resolveServiceUrl,
  urlHasLayerIndex,
  type ResolveServiceUrlOptions,
  type PortalResolvedService,
  type PortalServiceKind,
  type PortalServiceResult,
  type PortalRequestOptions,
  type PortalItemServiceOptions,
  type WebMapOptions,
  type ISearchResult,
  type ISearchOptions,
  type IItem,
  type IGroup,
  type IUser,
  type IPagingParams,
} from '@/Portal';

// ArcGIS REST JS data, query, edit, layer and basemap-session types
export * from '@/esri-rest';

// Request / authentication helpers (ArcGIS REST JS)
export {
  esriRequest,
  resolveAuthentication,
  ApiKeyManager,
  ArcGISIdentityManager,
  ApplicationCredentialsManager,
  ArcGISRequestError,
  ArcGISAuthError,
  type EsriAuthentication,
  type EsriAuthOptions,
  type EsriRequestOptions,
  type IAuthenticationManager,
  type IRequestOptions,
} from '@/request';

// Utilities
export { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils';
export * from '@/types';
