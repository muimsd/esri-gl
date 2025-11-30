/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEsriService } from '@/react/hooks/useEsriService';

// Mock service for testing
class MockService {
  constructor() {
    // Service creation
  }

  remove() {
    // Cleanup logic
  }
}

// Mock map object
const mockMap = {
  addSource: jest.fn(),
  removeSource: jest.fn(),
  isStyleLoaded: jest.fn(() => true),
  on: jest.fn(),
  off: jest.fn(),
};

describe('useEsriService Hook', () => {
  let mockCreateService: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockCreateService = jest.fn(() => new MockService());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should initialize with null service and no loading', () => {
    const { result } = renderHook(() => useEsriService(mockCreateService, null));

    expect(result.current.service).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.reload).toBe('function');
  });

  it('should create service when map is provided', async () => {
    const { result } = renderHook(() => useEsriService(mockCreateService, mockMap as any));

    // Fast-forward timers to trigger service creation
    act(() => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(result.current.service).toBeInstanceOf(MockService);
    });

    expect(mockCreateService).toHaveBeenCalledWith(mockMap);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle service creation errors', async () => {
    const error = new Error('Service creation failed');
    mockCreateService.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useEsriService(mockCreateService, mockMap as any));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    expect(result.current.service).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle non-Error exceptions', async () => {
    mockCreateService.mockImplementation(() => {
      throw 'String error';
    });

    const { result } = renderHook(() => useEsriService(mockCreateService, mockMap as any));

    act(() => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });

    expect(result.current.error?.message).toBe('Failed to create service');
  });

  it('should clean up service when map is removed', async () => {
    const mockService = new MockService();
    const removeSpy = jest.spyOn(mockService, 'remove');
    mockCreateService.mockReturnValue(mockService);

    const { result, rerender } = renderHook(({ map }) => useEsriService(mockCreateService, map), {
      initialProps: { map: mockMap as any },
    });

    // Wait for service creation
    act(() => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(result.current.service).toBe(mockService);
    });

    // Remove the map
    rerender({ map: null });

    expect(removeSpy).toHaveBeenCalled();
    expect(result.current.service).toBeNull();
  });

  it('should handle reload function', async () => {
    const { result } = renderHook(() => useEsriService(mockCreateService, mockMap as any));

    // Wait for initial service creation
    act(() => {
      jest.advanceTimersByTime(50);
    });

    await waitFor(() => {
      expect(result.current.service).toBeInstanceOf(MockService);
    });

    const firstService = result.current.service;
    const removeSpy = jest.spyOn(firstService!, 'remove');

    // Call reload
    act(() => {
      result.current.reload();
    });

    expect(removeSpy).toHaveBeenCalled();
    expect(mockCreateService).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple reload calls', async () => {
    const { result } = renderHook(() => useEsriService(mockCreateService, mockMap as any));

    // Call reload multiple times quickly
    act(() => {
      result.current.reload();
      result.current.reload();
      result.current.reload();
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    // Multiple calls should work without errors
    expect(mockCreateService).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});
