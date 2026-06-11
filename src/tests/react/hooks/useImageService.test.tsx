/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useImageService } from '@/react/hooks/useImageService';
import { ImageService } from '@/Services/ImageService';
import type { ImageServiceOptions } from '@/types';
import type { Map } from '@/types';

jest.mock('@/Services/ImageService');

const MockedImageService = ImageService as jest.MockedClass<typeof ImageService>;

const mockMap = {
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
} as unknown as Map;

const BASE_OPTIONS: ImageServiceOptions = {
  url: 'https://example.com/arcgis/rest/services/Test/ImageServer',
};

function lastInstance() {
  return MockedImageService.mock.instances[MockedImageService.mock.instances.length - 1];
}

describe('useImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the service once the map is available', async () => {
    const { result } = renderHook(() =>
      useImageService({ sourceId: 'img', map: mockMap, options: BASE_OPTIONS })
    );

    await waitFor(() => expect(result.current.service).not.toBeNull());

    expect(MockedImageService).toHaveBeenCalledTimes(1);
    expect(MockedImageService).toHaveBeenCalledWith('img', mockMap, BASE_OPTIONS, undefined);
  });

  it('applies a renderingRule change in place without rebuilding the service', async () => {
    const { result, rerender } = renderHook(
      ({ options }) => useImageService({ sourceId: 'img', map: mockMap, options }),
      { initialProps: { options: BASE_OPTIONS } }
    );
    await waitFor(() => expect(result.current.service).not.toBeNull());

    const renderingRule = { rasterFunction: 'Hillshade' };
    rerender({ options: { ...BASE_OPTIONS, renderingRule } });

    await waitFor(() =>
      expect(lastInstance().setRenderingRule).toHaveBeenCalledWith(renderingRule)
    );
    expect(MockedImageService).toHaveBeenCalledTimes(1);
  });

  it('applies a mosaicRule change in place without rebuilding the service', async () => {
    const { result, rerender } = renderHook(
      ({ options }) => useImageService({ sourceId: 'img', map: mockMap, options }),
      { initialProps: { options: BASE_OPTIONS } }
    );
    await waitFor(() => expect(result.current.service).not.toBeNull());

    const mosaicRule = { mosaicMethod: 'esriMosaicLockRaster' };
    rerender({ options: { ...BASE_OPTIONS, mosaicRule } });

    await waitFor(() => expect(lastInstance().setMosaicRule).toHaveBeenCalledWith(mosaicRule));
    expect(MockedImageService).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the service (removing the old source) when the url changes', async () => {
    const { result, rerender } = renderHook(
      ({ options }) => useImageService({ sourceId: 'img', map: mockMap, options }),
      { initialProps: { options: BASE_OPTIONS } }
    );
    await waitFor(() => expect(result.current.service).not.toBeNull());
    const firstInstance = lastInstance();

    rerender({
      options: { url: 'https://example.com/arcgis/rest/services/Other/ImageServer' },
    });

    await waitFor(() => expect(MockedImageService).toHaveBeenCalledTimes(2));
    expect(firstInstance.remove).toHaveBeenCalled();
    expect(MockedImageService).toHaveBeenLastCalledWith(
      'img',
      mockMap,
      expect.objectContaining({
        url: 'https://example.com/arcgis/rest/services/Other/ImageServer',
      }),
      undefined
    );
  });

  it('rebuilds the service when the format changes', async () => {
    const { result, rerender } = renderHook(
      ({ options }) => useImageService({ sourceId: 'img', map: mockMap, options }),
      { initialProps: { options: BASE_OPTIONS } }
    );
    await waitFor(() => expect(result.current.service).not.toBeNull());

    rerender({ options: { ...BASE_OPTIONS, format: 'png32' } });

    await waitFor(() => expect(MockedImageService).toHaveBeenCalledTimes(2));
    expect(MockedImageService).toHaveBeenLastCalledWith(
      'img',
      mockMap,
      expect.objectContaining({ format: 'png32' }),
      undefined
    );
  });

  it('does nothing when rerendered with the same options object', async () => {
    const { result, rerender } = renderHook(
      ({ options }) => useImageService({ sourceId: 'img', map: mockMap, options }),
      { initialProps: { options: BASE_OPTIONS } }
    );
    await waitFor(() => expect(result.current.service).not.toBeNull());

    rerender({ options: BASE_OPTIONS });

    expect(MockedImageService).toHaveBeenCalledTimes(1);
    expect(lastInstance().setRenderingRule).not.toHaveBeenCalled();
    expect(lastInstance().setMosaicRule).not.toHaveBeenCalled();
  });
});
