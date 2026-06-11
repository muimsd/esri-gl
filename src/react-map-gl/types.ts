// React Map GL specific types
import type { EsriAuthentication } from '@/request';
import type { PortalServiceResult } from '@/Portal';

/**
 * Common authentication and request options forwarded to the underlying
 * Esri service when any defined value is passed on a layer component.
 */
export interface EsriAuthProps {
  /** ArcGIS token (sent as the `token` request parameter) */
  token?: string;
  /** ArcGIS Location Platform API key (sent as the `token` parameter) */
  apiKey?: string;
  /** ArcGIS REST JS authentication manager (preferred for OAuth/user sign-in) */
  authentication?: EsriAuthentication;
  /** @deprecated No longer applied. */
  proxy?: string | boolean;
  /** Whether to fetch and apply service attribution (default true in services) */
  getAttributionFromService?: boolean;
  /** Extra request params merged into every service request */
  requestParams?: Record<string, unknown>;
  /** @deprecated No longer forwarded to requests; use `authentication`. */
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
  /** OAuth / user token (v2 host). Provide `token` or `apiKey`. */
  token?: string;
  /** ArcGIS Location Platform API key (v1 host). Provide `token` or `apiKey`. */
  apiKey?: string;
  /** Optional locale for the basemap labels. */
  language?: string;
  /** Optional worldview. */
  worldview?: string;
}

export interface EsriFeatureLayerProps extends EsriLayerBaseProps {
  url: string;
  where?: string;
  outFields?: string | string[];
  type?: 'fill' | 'circle' | 'line' | 'symbol' | 'heatmap';
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}

export interface EsriPortalLayerProps extends EsriLayerBaseProps {
  /** ArcGIS portal item id to resolve to a service. */
  itemId: string;
  /** For multi-layer Feature Services, which sublayer to load (default 0). */
  layerId?: number;
  /** Portal sharing REST URL (defaults to ArcGIS Online). */
  portal?: string;
  /** Called once the item resolves, with the resolved service/kind/url/title. */
  onResolve?: (result: PortalServiceResult) => void;
}
