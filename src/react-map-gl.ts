// React Map GL components for esri-gl
export { EsriDynamicLayer } from './react-map-gl/components/EsriDynamicLayer';
export { EsriTiledLayer } from './react-map-gl/components/EsriTiledLayer';
export { EsriImageLayer } from './react-map-gl/components/EsriImageLayer';
export { EsriVectorTileLayer } from './react-map-gl/components/EsriVectorTileLayer';
export { EsriVectorBasemapLayer } from './react-map-gl/components/EsriVectorBasemapLayer';
export { EsriFeatureLayer } from './react-map-gl/components/EsriFeatureLayer';

// Hooks specifically for react-map-gl
export { useEsriMapboxLayer } from './react-map-gl/hooks/useEsriMapboxLayer';
export { useEsriMaplibreLayer } from './react-map-gl/hooks/useEsriMaplibreLayer';

// Types (specific to react-map-gl to avoid conflicts)
export type {
  EsriDynamicLayerProps as ReactMapGLEsriDynamicLayerProps,
  EsriTiledLayerProps as ReactMapGLEsriTiledLayerProps,
  EsriImageLayerProps as ReactMapGLEsriImageLayerProps,
  EsriVectorTileLayerProps as ReactMapGLEsriVectorTileLayerProps,
  EsriVectorBasemapLayerProps as ReactMapGLEsriVectorBasemapLayerProps,
  EsriFeatureLayerProps as ReactMapGLEsriFeatureLayerProps,
} from './react-map-gl/types';

// Re-export everything from main
export * from './main';
