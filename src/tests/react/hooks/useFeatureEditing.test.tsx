/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useFeatureEditing } from '@/react/hooks/useFeatureEditing';
import type { FeatureService } from '@/Services/FeatureService';

const FEATURE: GeoJSON.Feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { name: 'test' },
};

const EDIT_RESULT = [{ objectId: 1, success: true }];
const APPLY_RESULT = { addResults: EDIT_RESULT, updateResults: [], deleteResults: [] };

function createMockService(overrides: Partial<FeatureService> = {}) {
  return {
    addFeatures: jest.fn().mockResolvedValue(EDIT_RESULT),
    updateFeatures: jest.fn().mockResolvedValue(EDIT_RESULT),
    deleteFeatures: jest.fn().mockResolvedValue(EDIT_RESULT),
    applyEdits: jest.fn().mockResolvedValue(APPLY_RESULT),
    ...overrides,
  } as unknown as FeatureService;
}

describe('useFeatureEditing', () => {
  it('exposes the editing operations with idle initial state', () => {
    const { result } = renderHook(() => useFeatureEditing(createMockService()));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResult).toBeNull();
  });

  it('delegates addFeatures to the service and tracks lastResult', async () => {
    const service = createMockService();
    const { result } = renderHook(() => useFeatureEditing(service));

    let returned: unknown;
    await act(async () => {
      returned = await result.current.addFeatures([FEATURE], { gdbVersion: 'v1' });
    });

    expect(service.addFeatures).toHaveBeenCalledWith([FEATURE], { gdbVersion: 'v1' });
    expect(returned).toEqual(EDIT_RESULT);
    expect(result.current.lastResult).toEqual(EDIT_RESULT);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('delegates updateFeatures and deleteFeatures to the service', async () => {
    const service = createMockService();
    const { result } = renderHook(() => useFeatureEditing(service));

    await act(async () => {
      await result.current.updateFeatures([FEATURE]);
      await result.current.deleteFeatures({ objectIds: [1, 2] });
    });

    expect(service.updateFeatures).toHaveBeenCalledWith([FEATURE], undefined);
    expect(service.deleteFeatures).toHaveBeenCalledWith({ objectIds: [1, 2] });
  });

  it('delegates applyEdits and stores the combined result', async () => {
    const service = createMockService();
    const { result } = renderHook(() => useFeatureEditing(service));

    await act(async () => {
      await result.current.applyEdits({ adds: [FEATURE], deletes: [7] }, { gdbVersion: 'v2' });
    });

    expect(service.applyEdits).toHaveBeenCalledWith(
      { adds: [FEATURE], deletes: [7] },
      { gdbVersion: 'v2' }
    );
    expect(result.current.lastResult).toEqual(APPLY_RESULT);
  });

  it('surfaces operation failures via error state and rethrows', async () => {
    const service = createMockService({
      addFeatures: jest.fn().mockRejectedValue(new Error('edit denied')),
    } as Partial<FeatureService>);
    const { result } = renderHook(() => useFeatureEditing(service));

    await act(async () => {
      await expect(result.current.addFeatures([FEATURE])).rejects.toThrow('edit denied');
    });

    expect(result.current.error?.message).toBe('edit denied');
    expect(result.current.loading).toBe(false);
    expect(result.current.lastResult).toBeNull();
  });

  it('rejects every operation when the service is null', async () => {
    const { result } = renderHook(() => useFeatureEditing(null));

    await act(async () => {
      await expect(result.current.addFeatures([FEATURE])).rejects.toThrow(
        'FeatureService not available'
      );
      await expect(result.current.updateFeatures([FEATURE])).rejects.toThrow(
        'FeatureService not available'
      );
      await expect(result.current.deleteFeatures({ objectIds: [1] })).rejects.toThrow(
        'FeatureService not available'
      );
      await expect(result.current.applyEdits({ adds: [FEATURE] })).rejects.toThrow(
        'FeatureService not available'
      );
    });
  });

  it('clears a previous error when a subsequent operation succeeds', async () => {
    const addFeatures = jest
      .fn()
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce(EDIT_RESULT);
    const service = createMockService({ addFeatures } as Partial<FeatureService>);
    const { result } = renderHook(() => useFeatureEditing(service));

    await act(async () => {
      await expect(result.current.addFeatures([FEATURE])).rejects.toThrow('first failure');
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.addFeatures([FEATURE]);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.lastResult).toEqual(EDIT_RESULT);
  });
});
