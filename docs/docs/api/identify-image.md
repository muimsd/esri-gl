# IdentifyImage

Task for identifying pixel values and raster information from ArcGIS Image Services at specific geographic locations.

## Constructor

```typescript
new IdentifyImage(options: IdentifyImageOptions)
```

| Argument | Type | Description |
|----------|------|-------------|
| options | `IdentifyImageOptions` | Configuration options for the identify operation |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | `string` | | **Required** Image Service URL |
| geometry | `object` | | **Required** Point geometry to identify |
| geometryType | `string` | `'esriGeometryPoint'` | Type of geometry |
| mosaicRule | `object` | | Mosaic rule for multi-raster services |
| renderingRule | `object` | | Rendering rule to apply |
| pixelSize | `object` | | Pixel size for resampling |
| timeExtent | `object` | | Time extent for temporal data |
| returnGeometry | `boolean` | `false` | Include geometry in response |
| returnCatalogItems | `boolean` | `false` | Return catalog items |
| returnPixelValues | `boolean` | `true` | Return pixel values |
| token | `string` | | Authentication token |

## Chainable Methods

All methods return the task instance for chaining:

```typescript
identify.at(geometry).pixelSize({x: 10, y: 10}).renderingRule(rule)
```

| Method | Description |
|--------|-------------|
| `at(geometry)` | Set location to identify |
| `pixelSize(size)` | Set pixel size for resampling |
| `renderingRule(rule)` | Apply rendering rule |
| `mosaicRule(rule)` | Set mosaic rule |
| `returnGeometry(boolean)` | Include geometry in results |
| `returnCatalogItems(boolean)` | Include catalog information |
| `token(token)` | Set authentication token |

## Execution Methods

### `.run()`

Execute the identify operation with current parameters.

**Returns:** `Promise<IdentifyImageResponse>`
```

## Advanced Usage Examples

### Multiple Service Analysis
