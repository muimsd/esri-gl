/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDynamicMapService, useIdentifyFeatures } from '@/react';

// Mock maplibre-gl
const mockMap = {
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(() => ({
    setTiles: jest.fn(),
    tiles: ['test-url']
  })),
  hasSource: jest.fn(() => false),
  on: jest.fn(),
  off: jest.fn()
};

jest.mock('maplibre-gl', () => ({
  Map: jest.fn().mockImplementation(() => mockMap)
}));

// Mock fetch for service requests
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({
    results: [
      {
        layerId: 0,
        layerName: 'Test Layer',
        value: '1',
        displayFieldName: 'STATE_NAME',
        attributes: { OBJECTID: 1, STATE_NAME: 'California' },
        geometry: null
      }
    ]
  }),
  ok: true,
  status: 200,
}) as jest.Mock;

describe('React Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useDynamicMapService', () => {
    it('should initialize service when map is provided', async () => {
      const { result } = renderHook(() =>
        useDynamicMapService({
          sourceId: 'test-source',
          map: mockMap as any,
          options: {
            url: 'https://example.com/MapServer'
          }
        })
      );

      expect(result.current.loading).toBe(false); // Service creation is synchronous
      
      await waitFor(() => {
        expect(result.current.service).toBeDefined();
      });

      expect(result.current.service).toBeDefined();
      expect(result.current.error).toBeNull();
      expect(mockMap.addSource).toHaveBeenCalledWith('test-source', expect.any(Object));
    });

    it('should not initialize service when map is null', () => {
      const { result } = renderHook(() =>
        useDynamicMapService({
          sourceId: 'test-source',
          map: null,
          options: {
            url: 'https://example.com/MapServer'
          }
        })
      );

      expect(result.current.service).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockMap.addSource).not.toHaveBeenCalled();
    });

    it('should cleanup service on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useDynamicMapService({
          sourceId: 'test-source',
          map: mockMap as any,
          options: {
            url: 'https://example.com/MapServer'
          }
        })
      );

      await waitFor(() => {
        expect(result.current.service).toBeDefined();
      });

      unmount();

      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });

    it('should update service when options change', async () => {
      // Test that the service updates its options when props change
      const { result, rerender } = renderHook(
        ({ layers }: { layers: number[] }) =>
          useDynamicMapService({
            sourceId: 'test-source',
            map: mockMap as any,
            options: {
              url: 'https://example.com/MapServer',
              layers
            }
          }),
        { initialProps: { layers: [0, 1] } }
      );

      await waitFor(() => {
        expect(result.current.service).toBeDefined();
      });

      const initialService = result.current.service;

      rerender({ layers: [0, 1, 2] });

      await waitFor(() => {
        expect(result.current.service?.esriServiceOptions.layers).toEqual([0, 1, 2]);
      });

      // Should be the same service instance, just updated
      expect(result.current.service).toBe(initialService);
    });
  });

  describe('useIdentifyFeatures', () => {
    it('should provide identify function', () => {
      const { result } = renderHook(() =>
        useIdentifyFeatures({
          url: 'https://example.com/MapServer',
          tolerance: 3
        })
      );

      expect(result.current.identify).toBeDefined();
      expect(typeof result.current.identify).toBe('function');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should execute identify and return results', async () => {
      const { result } = renderHook(() =>
        useIdentifyFeatures({
          url: 'https://example.com/MapServer',
          tolerance: 3
        })
      );

      let identifyResult;
      await act(async () => {
        identifyResult = await result.current.identify({ lng: -95, lat: 37 });
      });

      expect(identifyResult).toBeDefined();
      expect(identifyResult!.features).toHaveLength(1);
      expect(identifyResult!.features[0].properties!.STATE_NAME).toBe('California');
    });

    it('should handle identify errors', async () => {
      // Mock a failed request
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useIdentifyFeatures({
          url: 'https://example.com/MapServer',
          tolerance: 3
        })
      );

      await act(async () => {
        try {
          await result.current.identify({ lng: -95, lat: 37 });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Network error');
        }
      });
    });

    it('should show loading state during identify', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(controlledPromise);

      const { result } = renderHook(() =>
        useIdentifyFeatures({
          url: 'https://example.com/MapServer',
          tolerance: 3
        })
      );

      // Start identify operation
      act(() => {
        result.current.identify({ lng: -95, lat: 37 });
      });

      // Should be loading
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePromise({
          json: () => Promise.resolve({ features: [] }),
          ok: true,
          status: 200
        });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});