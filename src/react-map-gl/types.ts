// React Map GL specific types
export interface EsriLayerBaseProps {
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
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
}
