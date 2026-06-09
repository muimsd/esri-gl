/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { usePortalItem } from '@/react/hooks/usePortalItem';
import { serviceFromPortalItem } from '@/Portal';

jest.mock('@/Portal');
const mockResolve = serviceFromPortalItem as jest.MockedFunction<typeof serviceFromPortalItem>;

const mockMap = {
  addSource: jest.fn(),
  removeSource: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
} as any;

describe('usePortalItem Hook', () => {
  let removeSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    removeSpy = jest.fn();
    mockResolve.mockResolvedValue({
      service: { remove: removeSpy } as any,
      kind: 'feature',
      sourceId: 'src',
      url: 'https://example.com/FeatureServer/0',
      title: 'My Item',
    } as any);
  });

  it('stays idle when no map is provided', () => {
    const { result } = renderHook(() =>
      usePortalItem({ sourceId: 'src', map: null, itemId: 'abc' })
    );
    expect(result.current.service).toBeNull();
    expect(result.current.kind).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(typeof result.current.reload).toBe('function');
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('resolves the item and exposes service/kind/url/title', async () => {
    const { result } = renderHook(() =>
      usePortalItem({ sourceId: 'src', map: mockMap, itemId: 'abc' })
    );

    await waitFor(() => expect(result.current.service).not.toBeNull());

    expect(mockResolve).toHaveBeenCalledWith('src', mockMap, 'abc', undefined);
    expect(result.current.kind).toBe('feature');
    expect(result.current.url).toBe('https://example.com/FeatureServer/0');
    expect(result.current.title).toBe('My Item');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('surfaces resolution errors', async () => {
    mockResolve.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() =>
      usePortalItem({ sourceId: 'src', map: mockMap, itemId: 'bad' })
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('boom');
    expect(result.current.service).toBeNull();
  });

  it('removes the resolved service on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      usePortalItem({ sourceId: 'src', map: mockMap, itemId: 'abc' })
    );

    await waitFor(() => expect(result.current.service).not.toBeNull());
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });
});
