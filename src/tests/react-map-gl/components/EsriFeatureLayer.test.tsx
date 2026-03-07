import { render, act } from '@testing-library/react';
import { EsriFeatureLayer } from '@/react-map-gl/components/EsriFeatureLayer';
import { FeatureService } from '@/Services/FeatureService';
import { useMap } from 'react-map-gl/mapbox';

// Mock react-map-gl
jest.mock('react-map-gl/mapbox');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock FeatureService
jest.mock('@/Services/FeatureService');
const MockedFeatureService = FeatureService as jest.MockedClass<typeof FeatureService>;

// Mock map instance
const mockMap = {
  getMap: jest.fn(() => ({
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    getLayer: jest.fn(),
  })),
};

const mockMapInstance = {
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getLayer: jest.fn(),
  isStyleLoaded: jest.fn(() => true),
  getStyle: jest.fn(() => ({ layers: [] })),
};

describe('EsriFeatureLayer', () => {
  let mockService: jest.Mocked<FeatureService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      remove: jest.fn(),
    } as any;

    MockedFeatureService.mockImplementation(() => mockService);
    mockMap.getMap.mockReturnValue(mockMapInstance);
    mockUseMap.mockReturnValue({ current: mockMap as any });
  });

  const defaultProps = {
    id: 'test-feature-layer',
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/FeatureServer/0',
  };

  it('should render without errors', async () => {
    await act(async () => {
      render(<EsriFeatureLayer {...defaultProps} />);
    });
    expect(MockedFeatureService).toHaveBeenCalled();
  });

  it('should create FeatureService with correct parameters', async () => {
    const props = {
      ...defaultProps,
      sourceId: 'custom-feature-source',
      where: 'STATE_NAME = "California"',
      outFields: ['*'],
    };

    await act(async () => {
      render(<EsriFeatureLayer {...props} />);
    });

    expect(MockedFeatureService).toHaveBeenCalledWith('custom-feature-source', mockMapInstance, {
      url: props.url,
      where: props.where,
      outFields: props.outFields,
    });
  });

  it('should add fill layer with default paint', async () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    await act(async () => {
      render(<EsriFeatureLayer {...defaultProps} />);
    });

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith({
      id: 'test-feature-layer',
      type: 'fill',
      source: 'esri-feature-test-feature-layer',
      paint: {
        'fill-color': '#888888',
        'fill-opacity': 0.5,
      },
      layout: {
        visibility: 'visible',
      },
    });
  });

  it('should add layer with custom paint and layout', async () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    const customPaint = { 'fill-color': '#ff0000' };
    const customLayout = { 'fill-sort-key': 1 };

    await act(async () => {
      render(<EsriFeatureLayer {...defaultProps} paint={customPaint} layout={customLayout} />);
    });

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        paint: customPaint,
        layout: expect.objectContaining({
          ...customLayout,
          visibility: 'visible',
        }),
      })
    );
  });

  it('should handle visibility prop', async () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    await act(async () => {
      render(<EsriFeatureLayer {...defaultProps} visible={false} />);
    });

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({
          visibility: 'none',
        }),
      })
    );
  });

  it('should cleanup on unmount', async () => {
    mockMapInstance.getLayer.mockReturnValue({ id: 'test-feature-layer' });

    let unmount: () => void;
    await act(async () => {
      const result = render(<EsriFeatureLayer {...defaultProps} />);
      unmount = result.unmount;
    });

    act(() => {
      unmount!();
    });

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('test-feature-layer');
    expect(mockService.remove).toHaveBeenCalled();
  });
});
