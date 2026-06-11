/**
 * Curated re-exports of the ArcGIS REST JS types that esri-gl's public API
 * surfaces (or that consumers commonly need when calling it), so they can be
 * imported directly from `esri-gl` without depending on the `@esri/arcgis-rest-*`
 * packages by name.
 *
 * Geometry / feature / field data types come from `@esri/arcgis-rest-request`;
 * query, edit, layer and service definition types come from
 * `@esri/arcgis-rest-feature-service`; basemap session types come from
 * `@esri/arcgis-rest-basemap-sessions`. (Portal item/search types are
 * re-exported from `@/Portal`.)
 */

// --- Geometry, feature & field data types (@esri/arcgis-rest-request) ---
export type {
  IFeature,
  IFeatureSet,
  IField,
  IGeometry,
  IPoint,
  IPolygon,
  IPolyline,
  IMultipoint,
  IExtent,
  ISpatialReference,
  IHasZM,
  IDomain,
  ICodedValue,
  GeometryType,
  FieldType,
  Units,
} from '@esri/arcgis-rest-request';

// --- Query / edit / layer / service definition types (feature-service) ---
export type {
  ISharedQueryOptions,
  ISharedEditOptions,
  IQueryFeaturesOptions,
  IQueryFeaturesResponse,
  IQueryResponse,
  IQueryAllFeaturesOptions,
  IQueryAllFeaturesResponse,
  IQueryRelatedOptions,
  IQueryRelatedResponse,
  IRelatedRecordGroup,
  IRelatedRecordsInfo,
  IEditFeatureResult,
  IApplyEditsOptions,
  IApplyEditsResult,
  IAddFeaturesOptions,
  IDeleteFeaturesOptions,
  IGetLayerOptions,
  IGetFeatureOptions,
  IGetAttachmentsOptions,
  IAddAttachmentOptions,
  IDeleteAttachmentsOptions,
  IAttachmentInfo,
  ILayer,
  ILayerDefinition,
  IFeatureServiceDefinition,
  IAllLayersAndTablesResponse,
  IStatisticDefinition,
  IOrderByField,
  IDecodeValuesOptions,
} from '@esri/arcgis-rest-feature-service';

// --- Basemap style sessions (@esri/arcgis-rest-basemap-sessions) ---
export { BasemapStyleSession } from '@esri/arcgis-rest-basemap-sessions';
export type { StyleFamily, IStartSessionParams } from '@esri/arcgis-rest-basemap-sessions';
