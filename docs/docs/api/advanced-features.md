# Advanced Dynamic Map Service Features

This guide covers the advanced capabilities of the DynamicMapService, including server-side labeling, time-awareness, statistical queries, map export, and batch operations.

## Server-Side Labeling

### Label Configuration

Apply custom text labels with full styling control directly on ArcGIS Server:

```typescript
service.setLayerLabels(layerId, {
  labelExpression: '[field_name]',           // Field expression - use actual field name
  labelExpressionInfo: {                     // Advanced expressions (optional)
    expression: '$feature.state_name + " (" + $feature.pop2000 + ")"',
    returnType: 'String'
  },
  symbol: {
    type: 'esriTS',
    color: [255, 255, 255, 255],             // Text color (RGBA)
    backgroundColor: [0, 0, 0, 128],         // Background color
    borderLineColor: [0, 0, 0, 255],         // Border color
    borderLineSize: 1,                       // Border width
    font: {
      family: 'Arial',
      size: 12,
      style: 'normal',                       // 'normal' | 'italic' | 'oblique'
      weight: 'bold'                         // 'normal' | 'bold'
    },
    horizontalAlignment: 'center',           // 'left' | 'right' | 'center'
    verticalAlignment: 'middle'              // 'baseline' | 'top' | 'middle' | 'bottom'
  },
  minScale: 0,                               // Minimum scale for visibility
  maxScale: 25000000,                        // Maximum scale for visibility
  labelPlacement: 'esriServerPolygonPlacementAlwaysHorizontal',
  where: 'POP2000 > 1000000'                // Optional filter for labeled features
});
```

### Label Visibility Control

```typescript
// Toggle labels on/off
service.setLayerLabelsVisible(layerId, true);
service.setLayerLabelsVisible(layerId, false);
```

## Time-Aware Layer Management

### Time Configuration

Configure temporal data visualization for time-enabled layers:

```typescript
service.setLayerTimeOptions(layerId, {
  useTime: true,
  timeExtent: [startTimestamp, endTimestamp],    // Time range in milliseconds
  timeOffset: 5,                                 // Time offset value
  timeOffsetUnits: 'esriTimeUnitsHours'          // Offset units
});
```

### Time Animation

Animate through temporal data with frame callbacks:

```typescript
await service.animateTime({
  from: new Date('2023-01-01'),
  to: new Date('2023-12-31'),
  intervalMs: 1000,                              // Frame interval
  loop: true,                                    // Loop animation
  onFrame: (currentTime, progress) => {
    console.log(`Current time: ${currentTime.toISOString()}`);
    console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
    
    // Update UI or perform other actions
    updateTimeSlider(currentTime);
  },
  onComplete: () => {
    console.log('Animation completed');
  }
});
```

## Statistical Analysis

### Layer Statistics

Get statistical analysis results for numeric fields:

```typescript
const statistics = await service.getLayerStatistics(layerId, [
  {
    statisticType: 'count',
    onStatisticField: 'OBJECTID',
    outStatisticFieldName: 'total_count'
  },
  {
    statisticType: 'sum',
    onStatisticField: 'POPULATION',
    outStatisticFieldName: 'total_population'
  },
  {
    statisticType: 'avg',
    onStatisticField: 'POPULATION',
    outStatisticFieldName: 'avg_population'
  },
  {
    statisticType: 'min',
    onStatisticField: 'POPULATION',
    outStatisticFieldName: 'min_population'
  },
  {
    statisticType: 'max',
    onStatisticField: 'POPULATION',
    outStatisticFieldName: 'max_population'
  }
], {
  where: 'POPULATION > 0',                       // Optional filter
  groupByFieldsForStatistics: 'STATE_NAME'       // Optional grouping
});

console.log('Statistics results:', statistics);
```

### Feature Queries

Query features with spatial and attribute filtering:

```typescript
const features = await service.queryLayerFeatures(layerId, {
  where: 'POPULATION > 1000000',                 // Attribute filter
  geometry: {                                    // Spatial filter (GeoJSON)
    type: 'Polygon',
    coordinates: [[[-125, 32], [-114, 32], [-114, 42], [-125, 42], [-125, 32]]]
  },
  geometryType: 'esriGeometryPolygon',
  spatialRel: 'esriSpatialRelIntersects',        // Spatial relationship
  returnGeometry: true,                          // Include geometry in results
  outFields: ['STATE_NAME', 'POPULATION', 'AREA'], // Fields to return
  orderByFields: 'POPULATION DESC',              // Sort results
  resultOffset: 0,                               // Pagination offset
  resultRecordCount: 25,                         // Limit results
  returnCountOnly: false,                        // Return full features
  returnIdsOnly: false                           // Return object IDs only
});

console.log(`Found ${features.features.length} features`);
features.features.forEach(feature => {
  console.log(feature.attributes.STATE_NAME, feature.attributes.POPULATION);
});
```

## High-Resolution Map Export

Export styled maps as high-resolution images:

```typescript
const blob = await service.exportMapImage({
  bbox: [-125, 32, -114, 42],                    // Extent [west, south, east, north]
  size: [1200, 800],                             // Image dimensions [width, height]
  dpi: 300,                                      // Resolution (default: 96)
  format: 'png',                                 // Output format
  transparent: true,                             // Transparent background
  bboxSR: 4326,                                  // Coordinate system of bbox
  imageSR: 3857,                                 // Output coordinate system
  layerDefs: {                                   // Layer-specific filters
    '2': 'POPULATION > 1000000',
    '3': 'AREA > 1000'
  },
  dynamicLayers: service.esriServiceOptions.dynamicLayers, // Apply current styling
  gdbVersion: 'DEFAULT',                         // Geodatabase version
  historicMoment: Date.now()                     // Historic moment for archive data
});

// Download the exported image
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'exported-map.png';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```

### Supported Export Formats

- `'png'` - Portable Network Graphics (default)
- `'png8'` - 8-bit PNG
- `'png24'` - 24-bit PNG
- `'png32'` - 32-bit PNG
- `'jpg'` - JPEG
- `'gif'` - Graphics Interchange Format
- `'bmp'` - Bitmap
- `'svg'` - Scalable Vector Graphics
- `'pdf'` - Portable Document Format

## Metadata Discovery

### Layer Information

Get comprehensive layer metadata:

```typescript
// Get detailed layer information
const layerInfo = await service.getLayerInfo(layerId);
console.log('Layer name:', layerInfo.name);
console.log('Layer type:', layerInfo.type);
console.log('Geometry type:', layerInfo.geometryType);
console.log('Fields:', layerInfo.fields);
console.log('Extent:', layerInfo.extent);

// Get just field definitions
const fields = await service.getLayerFields(layerId);
fields.forEach(field => {
  console.log(`${field.name}: ${field.type} (${field.alias})`);
});

// Get spatial extent
const extent = await service.getLayerExtent(layerId);
console.log('Extent:', {
  xmin: extent.xmin,
  ymin: extent.ymin,
  xmax: extent.xmax,
  ymax: extent.ymax,
  spatialReference: extent.spatialReference
});
```

### Service Discovery

Discover all available layers in the service:

```typescript
const layers = await service.discoverLayers();
layers.forEach(layer => {
  console.log(`Layer ${layer.id}: ${layer.name} (${layer.type})`);
});
```

### Legend Generation

Get symbology information for layers:

```typescript
// Generate legend for all layers
const allLegends = await service.generateLegend();

// Generate legend for specific layers
const specificLegends = await service.generateLegend([1, 2, 3]);

specificLegends.forEach(layerLegend => {
  console.log(`Layer ${layerLegend.layerId}: ${layerLegend.layerName}`);
  layerLegend.legend.forEach(legendItem => {
    console.log(`  - ${legendItem.label}: ${legendItem.url}`);
  });
});
```

## Batch Operations & Transactions

### Bulk Updates

Apply multiple layer operations atomically:

```typescript
service.setBulkLayerProperties([
  {
    layerId: 1,
    operation: 'visibility',
    value: true
  },
  {
    layerId: 1,
    operation: 'renderer',
    value: {
      type: 'simple',
      symbol: { type: 'esriSFS', color: [255, 0, 0, 128] }
    }
  },
  {
    layerId: 2,
    operation: 'filter',
    value: {
      field: 'POPULATION',
      op: '>',
      value: 5000000
    }
  },
  {
    layerId: 3,
    operation: 'definition',
    value: 'STATE_NAME LIKE \'%CALIFORNIA%\''
  },
  {
    layerId: 3,
    operation: 'labels',
    value: [{
      labelExpression: '[STATE_NAME]',
      symbol: {
        type: 'esriTS',
        color: [0, 0, 0, 255],
        font: { family: 'Arial', size: 10 }
      }
    }]
  },
  {
    layerId: 4,
    operation: 'time',
    value: {
      useTime: true,
      timeExtent: [Date.now() - 86400000, Date.now()]
    }
  }
]);
```

### Transaction Management

Control when map updates are applied:

```typescript
// Begin a transaction - changes won't be applied immediately
service.beginUpdate();
console.log('In transaction:', service.isInTransaction); // true

// Make multiple changes
service.setLayerVisibility(1, false);
service.setLayerRenderer(2, customRenderer);
service.setLayerFilter(3, populationFilter);

// Map hasn't updated yet - all changes are pending

// Option 1: Commit all changes at once
service.commitUpdate();
console.log('In transaction:', service.isInTransaction); // false

// Option 2: Rollback all changes (if called instead of commit)
// service.rollbackUpdate();
```

## Error Handling

All async methods properly handle and throw errors:

```typescript
try {
  const statistics = await service.getLayerStatistics(layerId, statisticFields);
  console.log('Statistics:', statistics);
} catch (error) {
  console.error('Statistics query failed:', error.message);
}

try {
  const features = await service.queryLayerFeatures(layerId, queryOptions);
  console.log('Features:', features);
} catch (error) {
  console.error('Feature query failed:', error.message);
}

try {
  const blob = await service.exportMapImage(exportOptions);
  console.log('Export successful');
} catch (error) {
  console.error('Export failed:', error.message);
}
```

## Performance Considerations

### Server-Side Processing
- All styling, filtering, and labeling is processed on ArcGIS Server
- Reduces client-side memory usage and processing time
- Consistent rendering across different devices and browsers

### Batch Operations
- Use `setBulkLayerProperties()` for multiple simultaneous changes
- Use transactions (`beginUpdate`/`commitUpdate`) to prevent flickering
- Group related operations together to minimize server requests

### Caching
- Layer metadata and field information are cached after first request
- Statistics and query results are not cached and reflect current data
- Legend information is cached based on current layer symbology

## Best Practices

1. **Use Structured Filters** - Prefer structured filters over raw SQL for better type safety
2. **Batch Updates** - Group multiple layer changes using bulk operations
3. **Error Handling** - Always wrap async operations in try/catch blocks  
4. **Scale Ranges** - Set appropriate min/max scales for labels and layer visibility
5. **Field Selection** - Specify only needed fields in queries to improve performance
6. **Pagination** - Use `resultRecordCount` and `resultOffset` for large datasets