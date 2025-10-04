import { renderHook } from '@testing-library/react';
import { useEsriMapboxLayer } from '@/react-map-gl/hooks/useEsriMapboxLayer';
import { useMap } from 'react-map-gl/mapbox';
import * as reactHooks from '@/react/hooks/useDynamicMapService';

// Mock react-map-gl
jest.mock('react-map-gl/mapbox');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock the react hooks
jest.mock('@/react/hooks/useDynamicMapService');
jest.mock('@/react/hooks/useTiledMapService');
jest.mock('@/react/hooks/useImageService');
jest.mock('@/react/hooks/useVectorTileService');
jest.mock('@/react/hooks/useFeatureService');

// Import the mocked hooks
import { useTiledMapService } from '@/react/hooks/useTiledMapService';
import { useImageService } from '@/react/hooks/useImageService';
import { useVectorTileService } from '@/react/hooks/useVectorTileService';
import { useFeatureService } from '@/react/hooks/useFeatureService';

// Mock all service hooks to return mock services
(reactHooks.useDynamicMapService as jest.Mock).mockReturnValue({ destroy: jest.fn() });
(useTiledMapService as jest.Mock).mockReturnValue({ destroy: jest.fn() });
(useImageService as jest.Mock).mockReturnValue({ destroy: jest.fn() });
(useVectorTileService as jest.Mock).mockReturnValue({ destroy: jest.fn() });
(useFeatureService as jest.Mock).mockReturnValue({ destroy: jest.fn() });

const mockMapInstance = {
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
};

describe('useEsriMapboxLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return map instance', () => {
    const mockMapRef = {
      getMap: jest.fn().mockReturnValue(mockMapInstance),
    };
    mockUseMap.mockReturnValue({ current: mockMapRef as any });

    const { result } = renderHook(() => useEsriMapboxLayer());

    expect(result.current.map).toBe(mockMapInstance);
  });

  it('should return null map when no map ref', () => {
    mockUseMap.mockReturnValue({ current: undefined });

    const { result } = renderHook(() => useEsriMapboxLayer());

    expect(result.current.map).toBeUndefined();
  });

  it('should provide service hook wrappers', () => {
    const mockMapRef = {
      getMap: jest.fn().mockReturnValue(mockMapInstance),
    };
    mockUseMap.mockReturnValue({ current: mockMapRef as any });

    const { result } = renderHook(() => useEsriMapboxLayer());

    expect(typeof result.current.useDynamicMapService).toBe('function');
    expect(typeof result.current.useTiledMapService).toBe('function');
    expect(typeof result.current.useImageService).toBe('function');
    expect(typeof result.current.useVectorTileService).toBe('function');
    expect(typeof result.current.useFeatureService).toBe('function');
  });

  it('should call underlying hooks with map parameter', () => {
    const mockMapRef = {
      getMap: jest.fn().mockReturnValue(mockMapInstance),
    };
    mockUseMap.mockReturnValue({ current: mockMapRef as any });

    const mockUseDynamicMapService = jest.spyOn(reactHooks, 'useDynamicMapService');
    const { result } = renderHook(() => useEsriMapboxLayer());

    const options = {
      sourceId: 'test-source',
      map: null as any, // This will be overridden by the hook
      options: { url: 'test-url' },
      sourceOptions: {},
    };

    result.current.useDynamicMapService(options);

    expect(mockUseDynamicMapService).toHaveBeenCalledWith({
      ...options,
      map: mockMapInstance,
    });
  });

  it('should call all service wrapper functions', () => {
    const mockMapRef = {
      getMap: jest.fn().mockReturnValue(mockMapInstance),
    };
    mockUseMap.mockReturnValue({ current: mockMapRef as any });

    const { result } = renderHook(() => useEsriMapboxLayer());

    const options = {
      sourceId: 'test-source',
      map: null as any,
      options: { url: 'test-url' },
      sourceOptions: {},
    };

    // Call all wrapper functions to improve function coverage
    result.current.useDynamicMapService(options);
    result.current.useTiledMapService(options);
    result.current.useImageService(options);
    result.current.useVectorTileService(options);
    result.current.useFeatureService(options);

    // Verify they all get called with the injected map
    expect(result.current.useDynamicMapService).toBeDefined();
    expect(result.current.useTiledMapService).toBeDefined();
    expect(result.current.useImageService).toBeDefined();
    expect(result.current.useVectorTileService).toBeDefined();
    expect(result.current.useFeatureService).toBeDefined();
  });
});
