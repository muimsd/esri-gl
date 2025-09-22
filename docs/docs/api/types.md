# Advanced Feature Types

This page documents all the TypeScript interfaces and types for the advanced DynamicMapService features.

## Labeling Types

### LayerLabelingInfo

Configuration for server-side text labeling:

```typescript
interface LayerLabelingInfo {
  labelExpression?: string;                    // Simple field expression: '[field_name]'
  labelExpressionInfo?: {                      // Advanced Arcade expressions
    expression: string;                        // Arcade expression
    returnType?: 'Default' | 'String' | 'Numeric';
  };
  useCodedValues?: boolean;                    // Use domain coded values
  symbol: EsriTextSymbol;                      // Text symbol configuration
  minScale?: number;                           // Minimum scale for label visibility
  maxScale?: number;                           // Maximum scale for label visibility  
  labelPlacement?: string;                     // Label placement method
  where?: string;                              // Filter expression for labeled features
  priority?: number;                           // Label priority (higher = more important)
  [key: string]: unknown;                     // Additional properties
}
```

### EsriTextSymbol

Text symbol configuration for labels:

```typescript
interface EsriTextSymbol {
  type: 'esriTS';                              // Required symbol type
  color?: number[];                            // Text color [R, G, B, A]
  backgroundColor?: number[];                  // Background color [R, G, B, A]
  borderLineColor?: number[];                  // Border color [R, G, B, A]
  borderLineSize?: number;                     // Border width in pixels
  haloColor?: number[];                        // Halo color [R, G, B, A]
  haloSize?: number;                           // Halo size in pixels
  font?: {
    family?: string;                           // Font family name
    size?: number;                             // Font size in points
    style?: 'normal' | 'italic' | 'oblique';
    weight?: 'normal' | 'bold';
    decoration?: 'none' | 'underline' | 'line-through';
  };
  horizontalAlignment?: 'left' | 'right' | 'center' | 'justify';
  verticalAlignment?: 'baseline' | 'top' | 'middle' | 'bottom';
  angle?: number;                              // Text rotation angle
  xoffset?: number;                            // Horizontal offset in pixels
  yoffset?: number;                            // Vertical offset in pixels
}
```

## Time-Aware Types

### LayerTimeOptions

Configuration for time-enabled layers:

```typescript
interface LayerTimeOptions {
  useTime?: boolean;                           // Enable time filtering
  timeExtent?: number[] | null;                // Time range [start, end] in milliseconds
  timeOffset?: number;                         // Time offset value
  timeOffsetUnits?: 'esriTimeUnitsMilliseconds' | 'esriTimeUnitsSeconds' | 
                    'esriTimeUnitsMinutes' | 'esriTimeUnitsHours' | 
                    'esriTimeUnitsDays' | 'esriTimeUnitsWeeks' | 
                    'esriTimeUnitsMonths' | 'esriTimeUnitsYears';
  [key: string]: unknown;                      // Additional properties
}
```

### TimeAnimationOptions

Configuration for time animation:

```typescript
interface TimeAnimationOptions {
  from: Date;                                  // Animation start time
  to: Date;                                    // Animation end time
  intervalMs: number;                          // Frame interval in milliseconds
  loop?: boolean;                              // Loop animation when complete
  onFrame?: (currentTime: Date, progress: number) => void;    // Frame callback
  onComplete?: () => void;                     // Completion callback
}
```

## Query & Statistics Types

### LayerQueryOptions

Options for querying layer features:

```typescript
interface LayerQueryOptions {
  where?: string;                              // SQL WHERE clause
  geometry?: GeoJSON.Geometry;                 // Spatial filter geometry
  geometryType?: 'esriGeometryEnvelope' | 'esriGeometryPoint' | 
                 'esriGeometryMultipoint' | 'esriGeometryPolyline' | 
                 'esriGeometryPolygon';
  spatialRel?: 'esriSpatialRelIntersects' | 'esriSpatialRelContains' | 
               'esriSpatialRelWithin' | 'esriSpatialRelTouches' | 
               'esriSpatialRelCrosses' | 'esriSpatialRelOverlaps';
  returnGeometry?: boolean;                    // Include geometry in results
  outFields?: string[] | string;               // Fields to return ('*' for all)
  orderByFields?: string;                      // Sort specification
  groupByFieldsForStatistics?: string;        // Group by fields for statistics
  outStatistics?: Array<{                      // Statistics to calculate
    statisticType: 'count' | 'sum' | 'min' | 'max' | 'avg' | 'stddev' | 'var';
    onStatisticField: string;
    outStatisticFieldName: string;
  }>;
  resultOffset?: number;                       // Pagination offset
  resultRecordCount?: number;                  // Maximum results to return
  returnCountOnly?: boolean;                   // Return only feature count
  returnIdsOnly?: boolean;                     // Return only object IDs
  returnDistinctValues?: boolean;              // Return distinct values only
}
```

### StatisticResult

Result from statistical queries:

```typescript
interface StatisticResult {
  attributes: Record<string, unknown>;         // Statistics results as key-value pairs
}
```

### FeatureSet

Result from feature queries:

```typescript
interface FeatureSet {
  features: Array<{
    attributes: Record<string, unknown>;       // Feature attributes
    geometry?: GeoJSON.Geometry;               // Feature geometry (if requested)
  }>;
  fields?: FieldInfo[];                        // Field definitions
  spatialReference?: {                         // Coordinate system
    wkid?: number;
    latestWkid?: number;
  };
}
```

## Export Types

### MapExportOptions

Configuration for map image export:

```typescript
interface MapExportOptions {
  bbox: [number, number, number, number];     // Extent [west, south, east, north]
  size: [number, number];                     // Image size [width, height]
  dpi?: number;                               // Resolution (default: 96)
  format?: 'png' | 'png8' | 'png24' | 'png32' | 'jpg' | 'pdf' | 
           'gif' | 'svg' | 'emf' | 'ps' | 'bmp' | 'tiff';
  transparent?: boolean;                      // Transparent background
  bboxSR?: number;                           // Coordinate system of bbox
  imageSR?: number;                          // Output coordinate system  
  layerDefs?: Record<string, string>;        // Layer-specific filters
  dynamicLayers?: DynamicLayer[];            // Dynamic layer configuration
  gdbVersion?: string;                       // Geodatabase version
  historicMoment?: number;                   // Historic moment timestamp
}
```

## Metadata Types

### LegendInfo

Layer legend information:

```typescript
interface LegendInfo {
  layerId: number;                            // Layer ID
  layerName: string;                          // Layer name
  layerType: string;                          // Layer type
  minScale: number;                           // Minimum scale
  maxScale: number;                           // Maximum scale
  legend: Array<{
    label: string;                            // Symbol label
    url: string;                              // Symbol image URL
    imageData: string;                        // Base64 image data
    contentType: string;                      // Image content type
    height: number;                           // Symbol height
    width: number;                            // Symbol width
  }>;
}
```

### LayerMetadata

Comprehensive layer metadata:

```typescript
interface LayerMetadata {
  id: number;                                 // Layer ID
  name: string;                               // Layer name
  type: string;                               // Layer type
  description?: string;                       // Layer description
  geometryType?: string;                      // Geometry type
  minScale: number;                           // Minimum scale
  maxScale: number;                           // Maximum scale
  defaultVisibility: boolean;                 // Default visibility
  extent?: Extent;                            // Layer extent
  fields?: FieldInfo[];                       // Field definitions
  drawingInfo?: EsriDrawingInfo;              // Default drawing info
  capabilities?: string;                      // Layer capabilities
  [key: string]: unknown;                     // Additional properties
}
```

### FieldInfo

Field definition information:

```typescript
interface FieldInfo {
  name: string;                               // Field name
  type: string;                               // Field type
  alias: string;                              // Field alias
  length?: number;                            // Field length
  nullable?: boolean;                         // Nullable field
  editable?: boolean;                         // Editable field
  domain?: {                                  // Field domain
    type: string;
    name: string;
    codedValues?: Array<{
      name: string;
      code: string | number;
    }>;
  };
}
```

### Extent

Spatial extent information:

```typescript
interface Extent {
  xmin: number;                               // Minimum X coordinate
  ymin: number;                               // Minimum Y coordinate
  xmax: number;                               // Maximum X coordinate
  ymax: number;                               // Maximum Y coordinate
  spatialReference: {                         // Coordinate system
    wkid?: number;
    latestWkid?: number;
  };
}
```

### LayerInfo

Basic layer information:

```typescript
interface LayerInfo {
  id: number;                                 // Layer ID
  name: string;                               // Layer name
  type: string;                               // Layer type
  parentLayerId?: number;                     // Parent layer ID
  defaultVisibility: boolean;                 // Default visibility
  subLayerIds?: number[];                     // Sub-layer IDs
  minScale: number;                           // Minimum scale
  maxScale: number;                           // Maximum scale
}
```

## Batch Operation Types

### BatchLayerOperation

Single operation in a batch update:

```typescript
interface BatchLayerOperation {
  layerId: number;                            // Target layer ID
  operation: 'visibility' | 'renderer' | 'definition' | 
             'filter' | 'labels' | 'time';    // Operation type
  value: boolean | EsriRenderer | string | LayerFilter | 
         LayerLabelingInfo[] | LayerTimeOptions;  // Operation value
}
```

### Operation Types

The `operation` field determines the type of change:

- **`'visibility'`** - Show/hide layer (value: `boolean`)
- **`'renderer'`** - Apply styling (value: `EsriRenderer`)  
- **`'definition'`** - SQL filter (value: `string`)
- **`'filter'`** - Structured filter (value: `LayerFilter`)
- **`'labels'`** - Label configuration (value: `LayerLabelingInfo[]`)
- **`'time'`** - Time settings (value: `LayerTimeOptions`)

## Filter Types

These types are also documented in the main [Dynamic Layers](./dynamic-layers.md) documentation:

```typescript
type LayerFilter = 
  | ComparisonFilter    // { field: 'STATE_NAME', op: '=', value: 'California' }
  | BetweenFilter      // { field: 'POP2000', op: 'BETWEEN', from: 1000000, to: 5000000 }
  | InFilter           // { field: 'STATE_ABBR', op: 'IN', values: ['CA', 'OR', 'WA'] }
  | NullFilter         // { field: 'DESCRIPTION', op: 'IS NULL' }
  | GroupFilter        // { op: 'AND', filters: [filter1, filter2] }
  | string;            // Raw SQL expression
```

## Usage Examples

### Type-Safe Development

With these type definitions, you get full IntelliSense support and compile-time type checking:

```typescript
// TypeScript will validate the configuration
const labelConfig: LayerLabelingInfo = {
  labelExpression: '[state_name]',  // Use actual field name
  symbol: {
    type: 'esriTS',
    color: [255, 255, 255, 255],
    font: {
      family: 'Arial',
      size: 12,
      weight: 'bold'  // Type error if invalid value
    }
  },
  minScale: 0,
  maxScale: 25000000
};

// Method calls are type-checked
service.setLayerLabels(2, labelConfig);

// Query options are validated
const queryOptions: LayerQueryOptions = {
  where: 'pop2000 > 1000000',  // Use actual field names
  outFields: ['state_name', 'pop2000'],
  returnGeometry: true,
  orderByFields: 'pop2000 DESC'
};

const features = await service.queryLayerFeatures(2, queryOptions);
```

All types are exported from the main esri-gl module and can be imported for use in your applications.