import { render, waitFor } from '@testing-library/react';
import { EsriPortalLayer } from '@/react-map-gl/components/EsriPortalLayer';
import { serviceFromPortalItem } from '@/Portal';
import { useMap } from 'react-map-gl/mapbox';

jest.mock('react-map-gl/mapbox');
jest.mock('@/Portal');

const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;
const mockResolve = serviceFromPortalItem as jest.MockedFunction<typeof serviceFromPortalItem>;

const mockMapInstance = {
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getLayer: jest.fn(() => undefined),
  isStyleLoaded: jest.fn(() => true),
  getStyle: jest.fn(() => ({ layers: [] })),
};

const mockMap = { getMap: jest.fn(() => mockMapInstance) };

describe('EsriPortalLayer', () => {
  let removeSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    removeSpy = jest.fn();
    mockResolve.mockResolvedValue({
      service: { remove: removeSpy } as any,
      kind: 'tiled',
      sourceId: 'esri-portal-test',
      url: 'https://example.com/World_Imagery/MapServer',
      title: 'World Imagery',
    } as any);
    mockMapInstance.getLayer.mockReturnValue(undefined);
    mockMap.getMap.mockReturnValue(mockMapInstance);

    mockUseMap.mockReturnValue({ current: mockMap as any });
  });

  const props = { id: 'portal', itemId: '10df2279f9684e4a9f6a7f08febac2a9' };

  it('renders nothing and resolves the portal item', async () => {
    const { container } = render(<EsriPortalLayer {...props} />);
    expect(container.firstChild).toBeNull();
    await waitFor(() =>
      expect(mockResolve).toHaveBeenCalledWith(
        'esri-portal-portal',
        mockMapInstance,
        props.itemId,
        expect.any(Object)
      )
    );
  });

  it('adds a raster layer for a tiled item', async () => {
    render(<EsriPortalLayer {...props} />);
    await waitFor(() => expect(mockMapInstance.addLayer).toHaveBeenCalled());
    const layerConfig = mockMapInstance.addLayer.mock.calls[0][0];
    expect(layerConfig).toEqual(
      expect.objectContaining({ id: 'portal', type: 'raster', source: 'esri-portal-portal' })
    );
  });

  it('forwards auth options, fires onResolve, and cleans up on unmount', async () => {
    const onResolve = jest.fn();
    const { unmount } = render(
      <EsriPortalLayer {...props} token="my-token" onResolve={onResolve} />
    );

    await waitFor(() => expect(onResolve).toHaveBeenCalled());
    expect(mockResolve.mock.calls[0][3]).toEqual(expect.objectContaining({ token: 'my-token' }));

    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });
});
