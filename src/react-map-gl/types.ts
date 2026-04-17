// React Map GL specific types

/**
 * Common authentication and request options forwarded to the underlying
 * Esri service when any defined value is passed on a layer component.
 */
export interface EsriAuthProps {
  /** ArcGIS token sent with every request as `token` query param */
  token?: string;
  /** ArcGIS API key sent via `X-Esri-Authorization` header */
  apiKey?: string;
  /** Proxy URL or flag forwarded to the service */
  proxy?: string | boolean;
  /** Whether to fetch and apply service attribution (default true in services) */
  getAttributionFromService?: boolean;
  /** Extra request params merged into every service request */
  requestParams?: Record<string, unknown>;
  /** Extra fetch options used by the service */
  fetchOptions?: RequestInit;
}

export interface EsriLayerBaseProps extends EsriAuthProps {
  id: string;
  sourceId?: string;
  beforeId?: string;
  visible?: boolean;
}

export interface EsriDynamicLayerProps extends EsriLayerBaseProps {
  url: string;
  layers?: number[] | number | false;
  layerDefs?: Record<string, string> | false;
  format?: string;
  dpi?: number;
  transparent?: boolean;
}

export interface EsriTiledLayerProps extends EsriLayerBaseProps {
  url: string;
}

export interface EsriImageLayerProps extends EsriLayerBaseProps {
  url: string;
  renderingRule?: Record<string, unknown> | false;
  mosaicRule?: Record<string, unknown> | false;
  format?: string;
}

export interface EsriVectorTileLayerProps extends EsriLayerBaseProps {
  url: string;
}

export interface EsriVectorBasemapLayerProps extends EsriLayerBaseProps {
  basemapEnum: string;
  token: string;
}

export interface EsriFeatureLayerProps extends EsriLayerBaseProps {
  url: string;
  where?: string;
  outFields?: string | string[];
  type?: 'fill' | 'circle' | 'line' | 'symbol' | 'heatmap';
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}
