# Dynamic Layers

Dynamic Layers provide server-side styling and filtering capabilities for ArcGIS Dynamic Map Services, enabling advanced cartographic control without client-side processing overhead.

## Overview

The `dynamicLayers` parameter leverages ArcGIS Server's ability to override default layer drawing, allowing you to:

- **Apply Custom Styling** - Renderers, symbols, and transparency
- **Filter Features** - SQL expressions and structured filters  
- **Control Visibility** - Show/hide individual layers
- **Define Scale Ranges** - Min/max scale visibility
- **Combine Multiple Customizations** - Style + filter + visibility in one configuration

## Core Concepts

### Server-side Processing
All styling and filtering is processed on ArcGIS Server, resulting in:
- **Better Performance** - No client-side rendering overhead
- **Consistent Output** - Identical rendering across all clients
- **Scalability** - Complex symbology without memory constraints

### Layer Preservation
When applying customizations to one layer, all other visible layers are automatically preserved to prevent unintended hiding.

## DynamicLayer Interface

```typescript
interface DynamicLayer {
  id: number;                           // Required: Layer ID to customize
  visible?: boolean;                    // Show/hide the layer
  source?: EsriDynamicMapLayerSource;   // Layer source (auto-generated if omitted)
  definitionExpression?: string;        // SQL WHERE clause
  drawingInfo?: EsriDrawingInfo;        // Styling configuration
  minScale?: number;                    // Minimum visible scale
  maxScale?: number;                    // Maximum visible scale
}
```

### Drawing Info Structure

```typescript
interface EsriDrawingInfo {
  renderer?: EsriRenderer;              // Symbol renderer
  transparency?: number;                // 0-100, layer transparency
  labelingInfo?: Array<object>;         // Label configuration
}
```

## Styling with Renderers

### Simple Renderer

Apply the same symbol to all features in a layer:

```typescript
service.setLayerRenderer(2, {
  type: 'simple',
  symbol: {
    type: 'esriSFS',                    // Simple Fill Symbol
    style: 'esriSFSSolid',
    color: [0, 122, 255, 128],          // RGBA color
    outline: {
      type: 'esriSLS',                  // Simple Line Symbol
      style: 'esriSLSSolid',
      color: [0, 82, 204, 255],
      width: 2
    }
  }
});
```

### Point Symbols

```typescript
service.setLayerRenderer(0, {
  type: 'simple',
  symbol: {
    type: 'esriSMS',                    // Simple Marker Symbol
    style: 'esriSMSCircle',
    color: [255, 0, 0, 255],            // Red
    size: 10,
    outline: {
      color: [255, 255, 255, 255],      // White outline
      width: 2
    }
  }
});
```

### Line Symbols

```typescript
service.setLayerRenderer(1, {
  type: 'simple',
  symbol: {
    type: 'esriSLS',                    // Simple Line Symbol
    style: 'esriSLSDash',               // Dashed line
    color: [0, 255, 0, 255],            // Green
    width: 3
  }
});
```

## Advanced Filtering

### Filter Types

#### Comparison Filters
```typescript
// Equal
service.setLayerFilter(2, {
  field: 'STATE_NAME',
  op: '=',
  value: 'California'
});

// Greater than
service.setLayerFilter(2, {
  field: 'POP2000',
  op: '>',
  value: 5000000
});

// Like (pattern matching)
service.setLayerFilter(2, {
  field: 'STATE_NAME',
  op: 'LIKE',
  value: 'C%'                           // States starting with 'C'
});
```

#### Range Filters
```typescript
// Between
service.setLayerFilter(2, {
  field: 'POP2000',
  op: 'BETWEEN',
  from: 1000000,
  to: 10000000
});
```

#### Multiple Value Filters
```typescript
// IN clause
service.setLayerFilter(2, {
  field: 'STATE_ABBR',
  op: 'IN',
  values: ['CA', 'OR', 'WA', 'AK', 'HI'] // Pacific states
});
```

#### Null Checks
```typescript
// IS NULL
service.setLayerFilter(2, {
  field: 'DESCRIPTION',
  op: 'IS NULL'
});

// IS NOT NULL  
service.setLayerFilter(2, {
  field: 'LAST_UPDATED',
  op: 'IS NOT NULL'
});
```

#### Grouped Filters
```typescript
// AND conditions
service.setLayerFilter(2, {
  op: 'AND',
  filters: [
    { field: 'POP2000', op: '>', value: 1000000 },
    { field: 'SUB_REGION', op: '=', value: 'Pacific' },
    { field: 'STATE_ABBR', op: 'IN', values: ['CA', 'OR', 'WA'] }
  ]
});

// OR conditions
service.setLayerFilter(2, {
  op: 'OR',
  filters: [
    { field: 'STATE_NAME', op: '=', value: 'California' },
    { field: 'STATE_NAME', op: '=', value: 'Texas' },
    { field: 'STATE_NAME', op: '=', value: 'Florida' }
  ]
});
```

### Raw SQL Expressions

For complex queries not covered by structured filters:

```typescript
service.setLayerDefinition(2, 
  "STATE_NAME IN ('California', 'Nevada', 'Oregon') AND POP2000 > 500000"
);
```

## Complete Layer Configuration

### Multi-layer Setup

Configure multiple layers with different styling and filtering:

```typescript
service.setDynamicLayers([
  {
    // Cities layer - Red circles for large cities
    id: 0,
    visible: true,
    definitionExpression: "POP_2000 > 100000",
    drawingInfo: {
      renderer: {
        type: 'simple',
        symbol: {
          type: 'esriSMS',
          style: 'esriSMSCircle',
          color: [255, 0, 0, 255],
          size: 8
        }
      }
    }
  },
  {
    // Highways layer - Thick green lines
    id: 1,
    visible: true,
    drawingInfo: {
      renderer: {
        type: 'simple',
        symbol: {
          type: 'esriSLS',
          style: 'esriSLSSolid',
          color: [0, 255, 0, 255],
          width: 4
        }
      },
      transparency: 20
    }
  },
  {
    // States layer - Blue fill for Pacific states
    id: 2,
    visible: true,
    definitionExpression: "SUB_REGION = 'Pacific'",
    drawingInfo: {
      renderer: {
        type: 'simple',
        symbol: {
          type: 'esriSFS',
          style: 'esriSFSSolid',
          color: [0, 122, 255, 90],
          outline: {
            type: 'esriSLS',
            color: [0, 82, 204, 255],
            width: 2
          }
        }
      }
    }
  }
]);
```

## Method Reference

### Individual Layer Methods

| Method | Description | Example |
|--------|-------------|---------|
| `setLayerRenderer(id, renderer)` | Apply custom styling | `service.setLayerRenderer(2, blueRenderer)` |
| `setLayerFilter(id, filter)` | Apply structured filter | `service.setLayerFilter(2, californiaFilter)` |
| `setLayerDefinition(id, sql)` | Apply SQL expression | `service.setLayerDefinition(2, "POP > 1000000")` |
| `setLayerVisibility(id, visible)` | Show/hide layer | `service.setLayerVisibility(2, false)` |

### Batch Configuration

| Method | Description | Example |
|--------|-------------|---------|
| `setDynamicLayers(layers)` | Complete configuration | `service.setDynamicLayers([layer1, layer2])` |
| `setDynamicLayers(false)` | Reset to defaults | `service.setDynamicLayers(false)` |

## Best Practices

### Performance Optimization
- **Combine Operations** - Use `setDynamicLayers()` for multiple changes
- **Efficient Filters** - Index-friendly field comparisons perform better
- **Appropriate Scale Ranges** - Use `minScale`/`maxScale` to reduce rendering load

### Error Handling
```typescript
try {
  service.setLayerFilter(2, complexFilter);
} catch (error) {
  console.error('Filter application failed:', error);
  // Fallback to simpler filter or display error message
}
```

### Progressive Enhancement
```typescript
// Start with basic configuration
service.setLayers([0, 1, 2]);

// Add styling when needed
if (userWantsCustomStyling) {
  service.setLayerRenderer(2, customRenderer);
}

// Add filtering based on user input
if (filterCriteria) {
  service.setLayerFilter(2, filterCriteria);
}
```

## Troubleshooting

### Common Issues

**Layer Not Visible After Styling**
- Ensure the layer ID exists in the service
- Check that other visible layers are preserved
- Verify the renderer configuration is valid

**Filter Not Applied**
- Validate field names match service schema
- Check data types (strings need quotes, numbers don't)
- Ensure filter syntax is correct

**Performance Issues**
- Optimize complex filters with indexed fields
- Use scale ranges to reduce rendering load
- Consider server-side layer caching

### Debugging
```typescript
// Check current dynamic layers configuration
console.log('Current dynamicLayers:', service.esriServiceOptions.dynamicLayers);

// Verify visible layers
console.log('Visible layers:', service.options.layers);

// Test individual components
service.setLayerDefinition(2, 'OBJECTID > 0'); // Should show all features
```

## Migration Guide

### From layerDefs to Dynamic Layers

**Before (layerDefs):**
```typescript
service.setLayerDefs({
  2: "STATE_NAME = 'California'"
});
```

**After (Dynamic Layers):**
```typescript
service.setLayerFilter(2, {
  field: 'STATE_NAME',
  op: '=',
  value: 'California'
});
```

### Benefits of Migration
- **Type Safety** - Structured filters prevent syntax errors  
- **Better Performance** - Server-side optimization
- **Enhanced Features** - Styling + filtering combined
- **Easier Maintenance** - Programmatic filter building