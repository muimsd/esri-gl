# IdentifyFeatures

Task for identifying features at a point across multiple map services with advanced tolerance and filtering options.

## Constructor

```typescript
new IdentifyFeatures(options: IdentifyOptions)
```

| Argument | Type | Description |
|----------|------|-------------|
| options | `IdentifyOptions` | Configuration options for the identify operation |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** MapService URL |
| layers | `Array<number>` \| `string` | `'all'` | Layers to identify |
| tolerance | `number` | `3` | Search tolerance in pixels |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| dynamicLayers | `Array<object>` | | Dynamic layer definitions |
| mapExtent | `object` | | Current map extent |
| imageDisplay | `object` | | Map image parameters |
| returnFieldName | `boolean` | `false` | Return field names with values |
| returnUnformattedValues | `boolean` | `false` | Return raw field values |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
task.tolerance(5).layers([0, 1]).returnGeometry(true)
```

| Method | Description |
|--------|-------------|
| `layers(layers)` | Set layers to identify |
| `tolerance(pixels)` | Set search tolerance |
| `returnGeometry(boolean)` | Include geometry in results |
| `returnFieldName(boolean)` | Include field names |
| `token(token)` | Set authentication token |

## Execution Methods

### `.at(point, map, callback?)`

Identify features at a geographic point.

**Parameters:**
- `point` (`LngLat`) - Geographic coordinates
- `map` (`Map`) - MapLibre GL or Mapbox GL map instance
- `callback` (`Function`, optional) - Callback function for results

**Returns:** `Promise<FeatureCollection>`

### `.on(map)`

Set the map instance for the identify operation.

**Parameters:**
- `map` (`Map`) - MapLibre GL or Mapbox GL map instance

**Returns:** `IdentifyFeatures` (for chaining)

### `.run()`

Execute the identify operation with current parameters.

**Returns:** `Promise<FeatureCollection>`

  console.log('Identified features:', results.features);
});
```

## Advanced Usage Examples
