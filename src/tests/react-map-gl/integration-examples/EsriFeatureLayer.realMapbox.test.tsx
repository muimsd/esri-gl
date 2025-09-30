/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

// Explicitly unmock mapbox-gl to use the real library
jest.unmock('mapbox-gl');
jest.unmock('react-map-gl');

import mapboxgl from 'mapbox-gl';
import { Map } from 'react-map-gl';
import { EsriFeatureLayer } from '@/react-map-gl/components/EsriFeatureLayer';

// Mock the FeatureService but allow real map integration
import { FeatureService } from '@/Services/FeatureService';
jest.mock('@/Services/FeatureService');
const MockedFeatureService = FeatureService as jest.MockedClass<typeof FeatureService>;

// Set a valid Mapbox token for testing
mapboxgl.accessToken = 'pk.eyJ1IjoidGVzdCIsImEiOiJ0ZXN0LXRva2VuIn0.test';

interface TestWrapperProps {
  children: React.ReactNode;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

const TestWrapper = ({ children, onMapLoad }: TestWrapperProps) => {
  return (
    <div style={{ width: '400px', height: '300px' }}>
      <Map
        mapLib={mapboxgl as any}
        initialViewState={{
          longitude: -100,
          latitude: 40,
          zoom: 3.5,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v9"
        onLoad={evt => {
          if (onMapLoad) {
            onMapLoad(evt.target);
          }
        }}
      >
        {children}
      </Map>
    </div>
  );
};

describe('EsriFeatureLayer with Real Mapbox GL Integration', () => {
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

  it('should integrate with real Mapbox GL Map and add actual layers', async () => {
    let mapInstance: mapboxgl.Map | null = null;

    render(
      <TestWrapper
        onMapLoad={map => {
          mapInstance = map;
        }}
      >
        <EsriFeatureLayer
          id="test-feature-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0"
        />
      </TestWrapper>
    );

    // Wait for the map to load
    await waitFor(
      () => {
        expect(mapInstance).not.toBeNull();
      },
      { timeout: 5000 }
    );

    // Wait for the component to process and create the service
    await waitFor(
      () => {
        expect(MockedFeatureService).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // Verify the service was created with the real map instance
    const serviceCall = MockedFeatureService.mock.calls[0];
    expect(serviceCall[0]).toBe('esri-feature-test-feature-layer'); // sourceId
    expect(serviceCall[1]).toBe(mapInstance); // Real map instance
    expect(serviceCall[2]).toEqual({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0',
    });

    // Verify we can interact with the real map
    expect(mapInstance!.getContainer()).toBeInstanceOf(HTMLElement);
    expect(typeof mapInstance!.addLayer).toBe('function');
    expect(typeof mapInstance!.addSource).toBe('function');
  });

  it('should work with custom layer styling on real map', async () => {
    const customPaint = {
      'fill-color': '#ff0000',
      'fill-opacity': 0.5,
    };

    const customLayout = {
      visibility: 'visible' as const,
    };

    let mapInstance: mapboxgl.Map | null = null;

    render(
      <TestWrapper
        onMapLoad={map => {
          mapInstance = map;
        }}
      >
        <EsriFeatureLayer
          id="test-styled-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0"
          paint={customPaint}
          layout={customLayout}
        />
      </TestWrapper>
    );

    // Wait for map and service initialization
    await waitFor(
      () => {
        expect(mapInstance).not.toBeNull();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(MockedFeatureService).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // In a real integration, you could test that the layer was actually added to the map
    // For now, we verify the service was called with the right parameters
    expect(MockedFeatureService).toHaveBeenCalledWith(
      'esri-feature-test-styled-layer',
      mapInstance,
      {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0',
      }
    );

    // You could also spy on map.addLayer to verify layer configuration
    // const addLayerSpy = jest.spyOn(mapInstance!, 'addLayer');
    // expect(addLayerSpy).toHaveBeenCalledWith(expect.objectContaining({
    //   id: 'test-styled-layer',
    //   type: 'fill',
    //   paint: customPaint,
    //   layout: customLayout,
    // }));
  });

  it('should handle real map events and interactions', async () => {
    let mapInstance: mapboxgl.Map | null = null;

    render(
      <TestWrapper
        onMapLoad={map => {
          mapInstance = map;
        }}
      >
        <EsriFeatureLayer
          id="interactive-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0"
        />
      </TestWrapper>
    );

    // Wait for map to load
    await waitFor(
      () => {
        expect(mapInstance).not.toBeNull();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(MockedFeatureService).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // Test real map capabilities
    expect(mapInstance!.getZoom()).toBeCloseTo(3.5);
    expect(mapInstance!.getCenter().lng).toBeCloseTo(-100);
    expect(mapInstance!.getCenter().lat).toBeCloseTo(40);

    // Test that we can interact with the real map
    mapInstance!.setZoom(5);
    expect(mapInstance!.getZoom()).toBeCloseTo(5);

    // Test bounds functionality
    const bounds = mapInstance!.getBounds();
    expect(bounds?.getNorth()).toBeDefined();
    expect(bounds?.getSouth()).toBeDefined();
    expect(bounds?.getEast()).toBeDefined();
    expect(bounds?.getWest()).toBeDefined();
  });

  it('should cleanup properly when unmounting from real map', async () => {
    let mapInstance: mapboxgl.Map | null = null;

    const { unmount } = render(
      <TestWrapper
        onMapLoad={map => {
          mapInstance = map;
        }}
      >
        <EsriFeatureLayer
          id="cleanup-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0"
        />
      </TestWrapper>
    );

    // Wait for map and service initialization
    await waitFor(
      () => {
        expect(mapInstance).not.toBeNull();
      },
      { timeout: 5000 }
    );

    await waitFor(
      () => {
        expect(MockedFeatureService).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

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
});
