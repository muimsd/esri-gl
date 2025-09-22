# Find

Task for finding features by searching text values across multiple fields and layers in ArcGIS Map Services.

## Constructor

```typescript
new Find(options: FindOptions)
```

| Argument | Type | Description |
|----------|------|-------------|
| options | `FindOptions` | Configuration options for the find operation |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** MapService URL |
| searchText | `string` | | **Required** Text to search for |
| searchFields | `Array<string>` | | Fields to search in |
| layers | `Array<number>` | | Layers to search |
| contains | `boolean` | `true` | Whether to find partial matches |
| returnGeometry | `boolean` | `false` | Include feature geometry |
| maxAllowableOffset | `number` | | Geometry simplification |
| geometryPrecision | `number` | | Decimal places for geometry |
| dynamicLayers | `Array<object>` | | Dynamic layer definitions |
| returnFieldName | `boolean` | `false` | Return field names with values |
| returnUnformattedValues | `boolean` | `false` | Return raw field values |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
find.text('California').in(['STATE_NAME']).layers([0, 1])
```

| Method | Description |
|--------|-------------|
| `text(searchText)` | Set text to search for |
| `in(fields)` | Set fields to search in |
| `layers(layerIds)` | Set layers to search |
| `contains(boolean)` | Enable/disable partial matching |
| `returnGeometry(boolean)` | Include geometry in results |
| `returnFieldName(boolean)` | Include field names |
| `token(token)` | Set authentication token |

## Execution Methods

### `.run()`

Execute the find operation with current parameters.

**Returns:** `Promise<FeatureCollection>`
```

## Advanced Usage Examples

