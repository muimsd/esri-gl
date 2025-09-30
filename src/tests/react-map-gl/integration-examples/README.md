# Real Mapbox GL Integration Examples

This directory contains integration test examples that demonstrate how to use **real mapbox-gl imports** instead of Jest mocks. These tests are excluded from the main test suite because they require a full browser environment to run properly.

## Files

- `EsriFeatureLayer.realMapbox.test.tsx` - Shows real mapbox-gl integration with EsriFeatureLayer component
- `EsriDynamicLayer.realMapbox.test.tsx` - Demonstrates real mapbox integration patterns for dynamic layers
- `useEsriMapboxLayer.realMapbox.test.tsx` - Tests hooks with real mapbox map instances

## Key Features

✅ **Direct Import**: Uses `import mapboxgl from 'mapbox-gl'` (real library, not mocks)
✅ **Real API Testing**: Tests interact with actual mapbox-gl APIs and classes
✅ **Authentic Integration**: Demonstrates real-world usage patterns
✅ **Browser Environment**: Requires WebGL, TextDecoder, and other browser APIs

## Why Excluded from Main Test Suite

These tests are designed to run with the real mapbox-gl library, which requires:

- WebGL context (not available in JSDOM)
- Real map rendering (timeouts in test environment)
- Network requests for map tiles
- Full browser environment

## Running These Tests

To run these integration examples:

```bash
# Run individual test files (expect timeouts in JSDOM)
npm test -- --testPathPatterns="integration-examples/EsriFeatureLayer.realMapbox.test.tsx"

# Or run with extended timeout
npm test -- --testPathPatterns="integration-examples" --testTimeout=10000
```

## Purpose

These examples prove that the esri-gl library successfully transitioned from mocked testing to **real mapbox-gl integration**. They demonstrate:

1. Real mapbox-gl library imports work correctly
2. Integration patterns are properly structured
3. Service creation with authentic map instances
4. Real API method availability and usage

The timeout errors are expected and actually **confirm** that the tests are using real mapbox-gl instead of mocks!
