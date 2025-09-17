// MapService-specific interfaces
export interface LayerTimeOptions {
  useTime?: boolean;
  timeFields?: string[];
  timeExtent?: [number, number];
}

export interface DynamicLayer {
  id: number;
  source?: {
    type: string;
    mapLayerId?: number;
    workspaceId?: string;
    dataSourceName?: string;
  };
  definitionExpression?: string;
  drawingInfo?: Record<string, unknown>;
  transparency?: number;
  visible?: boolean;
  minScale?: number;
  maxScale?: number;
}

export interface EsriGeometry {
  x?: number;
  y?: number;
  spatialReference?: { wkid: number };
  rings?: number[][][];
  paths?: number[][][];
  points?: number[][];
}

export interface IdentifyResult {
  layerId: number;
  layerName: string;
  value: string;
  displayFieldName: string;
  feature: {
    attributes: Record<string, unknown>;
    geometry?: EsriGeometry;
  };
}

export interface IdentifyResponse {
  results: IdentifyResult[];
}

export interface FindResult {
  layerId: number;
  layerName: string;
  foundFieldName: string;
  value: string;
  displayFieldName: string;
  feature: {
    attributes: Record<string, unknown>;
    geometry?: EsriGeometry;
  };
}

export interface FindResponse {
  results: FindResult[];
}

export interface QueryFeature {
  attributes: Record<string, unknown>;
  geometry?: EsriGeometry;
}

export interface QueryResponse {
  features: QueryFeature[];
  exceededTransferLimit?: boolean;
  spatialReference?: { wkid: number };
}

export interface StatisticDefinition {
  statisticType: 'count' | 'sum' | 'min' | 'max' | 'avg' | 'stddev' | 'var';
  onStatisticField: string;
  outStatisticFieldName: string;
}

export interface QuantizationParameters {
  mode: string;
  originPosition?: string;
  tolerance?: number;
  extent?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
    spatialReference?: { wkid: number };
  };
}
