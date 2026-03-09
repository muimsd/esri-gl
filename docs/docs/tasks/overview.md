# Tasks Overview

Tasks provide chainable operations for querying and analyzing Esri services, modeled after Esri Leaflet's task pattern.

## Pattern

Tasks follow a create → configure → execute pattern:

```typescript
const results = await new IdentifyFeatures({ url: '...' })
  .layers([0, 1, 2])
  .tolerance(5)
  .returnGeometry(true)
  .at({ lng: -95, lat: 37 }, map);
```

## Available Tasks

| Task | Description |
|------|-------------|
| [IdentifyFeatures](./identify-features) | Identify features at a point across map services |
| [IdentifyImage](./identify-image) | Get pixel values from image services |
| [Query](./query) | Spatial and attribute queries with pagination |
| [Find](./find) | Text-based search across layers and fields |

## Task vs Service Methods

| Aspect | Task | Service Method |
|--------|------|---------------|
| Flexibility | Highly configurable | Basic options |
| Chaining | Fluent API | Single call |
| Reusability | Reusable instances | One-time use |

## Common Patterns

### Reusable Tasks

```typescript
const queryTask = new Query({ url: '...' })
  .outFields(['*'])
  .returnGeometry(true);

const all = await queryTask.where('1=1').run();
const filtered = await queryTask.where('POP > 100000').run();
```

### Error Handling

```typescript
try {
  const results = await task.run();
} catch (error) {
  console.error('Task failed:', error.message);
}
```
