/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import mapboxgl from 'mapbox-gl';
import { Map } from 'react-map-gl';
import { EsriDynamicLayer } from '@/react-map-gl/components/EsriDynamicLayer';

// Import and mock the Esri services
import { DynamicMapService } from '@/Services/DynamicMapService';
jest.mock('@/Services/DynamicMapService');
const MockedDynamicMapService = DynamicMapService as jest.MockedClass<typeof DynamicMapService>;

// Test component wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Map
      mapLib={mapboxgl as any}
      initialViewState={{
        longitude: -100,
        latitude: 40,
        zoom: 3.5,
      }}
      style={{ width: '100%', height: '400px' }}
      mapStyle="mapbox://styles/mapbox/light-v9"
    >
      {children}
    </Map>
  );
};

describe('EsriDynamicLayer with Real Mapbox GL', () => {
  let mockService: jest.Mocked<DynamicMapService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      remove: jest.fn(),
    } as any;

    MockedDynamicMapService.mockImplementation(() => mockService);
  });

  afterEach(() => {
    // Cleanup any mapbox instances
    jest.clearAllMocks();
  });

  it('should integrate with real Mapbox GL Map', async () => {
    render(
      <TestWrapper>
        <EsriDynamicLayer
          id="test-dynamic-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/Highways/MapServer"
        />
      </TestWrapper>
    );

    // Wait for the map to initialize and the service to be created
    await waitFor(
      () => {
        expect(MockedDynamicMapService).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // Verify service was called with correct parameters
    expect(MockedDynamicMapService).toHaveBeenCalledWith(
      'esri-dynamic-test-dynamic-layer',
      expect.any(Object), // This should be the real mapbox map instance
      {
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Highways/MapServer',
      }
    );
  });

  it('should work with custom service options', async () => {
    render(
      <TestWrapper>
        <EsriDynamicLayer
          id="test-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/Highways/MapServer"
          layers={[0, 1, 2]}
          layerDefs={{ '0': 'STATE_NAME = "California"' }}
          format="png24"
          dpi={96}
          transparent={true}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(MockedDynamicMapService).toHaveBeenCalledWith(
        'esri-dynamic-test-layer',
        expect.any(Object),
        {
          url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Highways/MapServer',
          layers: [0, 1, 2],
          layerDefs: { '0': 'STATE_NAME = "California"' },
          format: 'png24',
          dpi: 96,
          transparent: true,
        }
      );
    });
  });

  it('should cleanup service on unmount', async () => {
    const { unmount } = render(
      <TestWrapper>
        <EsriDynamicLayer
          id="test-layer"
          url="https://sampleserver6.arcgisonline.com/arcgis/rest/services/Highways/MapServer"
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(MockedDynamicMapService).toHaveBeenCalled();
    });

    unmount();

    // Note: cleanup verification might need to wait for useEffect cleanup
    await waitFor(() => {
      expect(mockService.remove).toHaveBeenCalled();
    });
  });
});
