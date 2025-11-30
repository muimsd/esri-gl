/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import mapboxgl from 'mapbox-gl';
import { Map } from 'react-map-gl/mapbox';
import { useEsriMapboxLayer } from '@/react-map-gl/hooks/useEsriMapboxLayer';

// Mock the react hooks
import * as reactHooks from '@/react/hooks/useDynamicMapService';
jest.mock('@/react/hooks/useDynamicMapService');
jest.mock('@/react/hooks/useTiledMapService');
jest.mock('@/react/hooks/useImageService');
jest.mock('@/react/hooks/useVectorTileService');
jest.mock('@/react/hooks/useFeatureService');

// Setup mock return values for service hooks
(reactHooks.useDynamicMapService as jest.Mock).mockReturnValue({ destroy: jest.fn() });

// Wrapper component that provides the map context
const MapWrapper = ({ children }: { children: React.ReactNode }) => {
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

describe('useEsriMapboxLayer with Real Mapbox GL', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide access to real mapbox map instance', done => {
    const TestComponent = () => {
      const { map } = useEsriMapboxLayer();

      // Check if we have a real map instance
      React.useEffect(() => {
        if (map) {
          // These are real mapbox-gl map methods
          expect(typeof map.addLayer).toBe('function');
          expect(typeof map.removeLayer).toBe('function');
          expect(typeof map.addSource).toBe('function');
          expect(typeof map.removeSource).toBe('function');
          done();
        }
      }, [map]);

      return null;
    };

    renderHook(() => <TestComponent />, {
      wrapper: MapWrapper,
    });
  });

  it('should call service hooks with real map instance', done => {
    const mockUseDynamicMapService = jest.spyOn(reactHooks, 'useDynamicMapService');

    const TestComponent = () => {
      const { map, useDynamicMapService } = useEsriMapboxLayer();

      React.useEffect(() => {
        if (map) {
          // Call the service hook with real map
          useDynamicMapService({
            sourceId: 'test-source',
            map: null as any, // Will be overridden by hook
            options: { url: 'test-url' },
            sourceOptions: {},
          });

          // Verify the service was called with the real map instance
          expect(mockUseDynamicMapService).toHaveBeenCalledWith({
            sourceId: 'test-source',
            map: map, // This should be the real mapbox map
            options: { url: 'test-url' },
            sourceOptions: {},
          });

          done();
        }
      }, [map, useDynamicMapService]);

      return null;
    };

    renderHook(() => <TestComponent />, {
      wrapper: MapWrapper,
    });
  });

  it('should handle map initialization lifecycle', done => {
    let mapInstance: any = null;

    const TestComponent = () => {
      const { map } = useEsriMapboxLayer();

      React.useEffect(() => {
        if (map && !mapInstance) {
          mapInstance = map;

          // Verify this is a real mapbox map with expected properties
          expect(map.getContainer).toBeDefined();
          expect(map.getCanvas).toBeDefined();
          expect(map.getStyle).toBeDefined();
          expect(map.getBounds).toBeDefined();

          done();
        }
      }, [map]);

      return null;
    };

    renderHook(() => <TestComponent />, {
      wrapper: MapWrapper,
    });
  });
});
