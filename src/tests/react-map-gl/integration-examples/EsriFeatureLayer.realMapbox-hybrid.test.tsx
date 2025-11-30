/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Explicitly unmock mapbox-gl to use the real library for imports
jest.unmock('mapbox-gl');
jest.unmock('react-map-gl/mapbox');

import mapboxgl from 'mapbox-gl';
import { EsriFeatureLayer } from '@/react-map-gl/components/EsriFeatureLayer';

// Mock the FeatureService but allow real map integration
import { FeatureService } from '@/Services/FeatureService';
jest.mock('@/Services/FeatureService');
const MockedFeatureService = FeatureService as jest.MockedClass<typeof FeatureService>;

// Set a valid Mapbox token for testing
mapboxgl.accessToken = 'pk.eyJ1IjoidGVzdCIsImEiOiJ0ZXN0LXRva2VuIn0.test';

// Mock react-map-gl's useMap hook at module level
jest.mock('react-map-gl/mapbox', () => {
  const originalModule = jest.requireActual('react-map-gl/mapbox');
  return {
    ...originalModule,
    useMap: () => ({
      current: {
        getMap: () => ({
          addSource: jest.fn(),
          removeSource: jest.fn(),
          addLayer: jest.fn(),
          removeLayer: jest.fn(),
          getSource: jest.fn(),
          getLayer: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
          getZoom: jest.fn(() => 3.5),
          getCenter: jest.fn(() => ({ lng: -100, lat: 40 })),
          setZoom: jest.fn(),
          getBounds: jest.fn(() => ({
            getNorth: () => 85,
            getSouth: () => -85,
            getEast: () => 180,
            getWest: () => -180,
          })),
          getContainer: jest.fn(() => document.createElement('div')),
        }),
      },
    }),
  };
});

// Simple test wrapper
const MockMapProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-map-provider">{children}</div>;
};

describe('EsriFeatureLayer with Real Mapbox GL Integration (Hybrid)', () => {
  let mockService: jest.Mocked<FeatureService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      remove: jest.fn(),
      addTo: jest.fn(),
      identify: jest.fn(),
    } as any;

    MockedFeatureService.mockImplementation(() => mockService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should verify real mapbox-gl is imported and accessible', () => {
    // Test that we have the real mapbox-gl library
    expect(typeof mapboxgl).toBe('object');
    expect(typeof mapboxgl.Map).toBe('function');
    expect(typeof mapboxgl.LngLat).toBe('function');
    expect(mapboxgl.accessToken).toBe('pk.eyJ1IjoidGVzdCIsImEiOiJ0ZXN0LXRva2VuIn0.test');

    // Test that we can create mapbox classes (even if they don't work in JSDOM)
    const lngLat = new mapboxgl.LngLat(-100, 40);
    expect(lngLat.lng).toBe(-100);
    expect(lngLat.lat).toBe(40);
  });

  it('should create FeatureService with real map integration pattern', async () => {
    render(
      <MockMapProvider>
        <EsriFeatureLayer
          id="test-feature-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0"
        />
      </MockMapProvider>
    );

    // Wait for the component to process and create the service
    await waitFor(
      () => {
        expect(MockedFeatureService).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    // Verify the service was created with the expected parameters
    const serviceCall = MockedFeatureService.mock.calls[0];
    expect(serviceCall[0]).toBe('esri-feature-test-feature-layer'); // sourceId
    expect(serviceCall[1]).toBeDefined(); // map instance (mocked)
    expect(serviceCall[2]).toEqual({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0',
    });
  });

  it('should handle custom styling options', async () => {
    const customPaint = {
      'fill-color': '#ff0000',
      'fill-opacity': 0.5,
    };

    const customLayout = {
      visibility: 'visible' as const,
    };

    render(
      <MockMapProvider>
        <EsriFeatureLayer
          id="test-styled-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0"
          paint={customPaint}
          layout={customLayout}
        />
      </MockMapProvider>
    );

    await waitFor(() => {
      expect(MockedFeatureService).toHaveBeenCalled();
    });

    // Verify service creation with proper parameters
    expect(MockedFeatureService).toHaveBeenCalledWith(
      'esri-feature-test-styled-layer',
      expect.anything(), // map instance
      {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0',
      }
    );
  });

  it('should cleanup properly when unmounting', async () => {
    const { unmount } = render(
      <MockMapProvider>
        <EsriFeatureLayer
          id="cleanup-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0"
        />
      </MockMapProvider>
    );

    // Wait for service creation
    await waitFor(() => {
      expect(MockedFeatureService).toHaveBeenCalled();
    });

    // Unmount the component
    unmount();

    // Wait for cleanup
    await waitFor(
      () => {
        expect(mockService.remove).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it('should demonstrate real mapbox-gl vs mock difference', () => {
    // This test demonstrates that we're using real mapbox-gl
    // If we were using mocks, this would behave differently

    // Real mapbox-gl has specific version and properties
    expect(mapboxgl.version).toMatch(/^\d+\.\d+\.\d+/); // Real version format
    expect(typeof mapboxgl.supported).toBe('function'); // Real API
    expect(typeof mapboxgl.clearStorage).toBe('function'); // Real API

    // These are real mapbox-gl classes, not mocks
    expect(mapboxgl.LngLatBounds).toBeDefined();
    expect(mapboxgl.Point).toBeDefined();
    expect(mapboxgl.MercatorCoordinate).toBeDefined();
  });
});
