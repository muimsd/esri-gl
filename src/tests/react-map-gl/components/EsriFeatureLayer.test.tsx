import { render } from '@testing-library/react';
import { EsriFeatureLayer } from '@/react-map-gl/components/EsriFeatureLayer';
import { FeatureService } from '@/Services/FeatureService';
import { useMap } from 'react-map-gl';

// Mock react-map-gl
jest.mock('react-map-gl');
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

  it('should render without errors', () => {
    render(<EsriFeatureLayer {...defaultProps} />);
    expect(MockedFeatureService).toHaveBeenCalled();
  });

  it('should create FeatureService with correct parameters', () => {
    const props = {
      ...defaultProps,
      sourceId: 'custom-feature-source',
      where: 'STATE_NAME = "California"',
      outFields: ['*'],
    };

    render(<EsriFeatureLayer {...props} />);

    expect(MockedFeatureService).toHaveBeenCalledWith('custom-feature-source', mockMapInstance, {
      url: props.url,
      where: props.where,
      outFields: props.outFields,
    });
  });

  it('should add fill layer with default paint', () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    render(<EsriFeatureLayer {...defaultProps} />);

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

  it('should add layer with custom paint and layout', () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    const customPaint = { 'fill-color': '#ff0000' };
    const customLayout = { 'fill-sort-key': 1 };

    render(<EsriFeatureLayer {...defaultProps} paint={customPaint} layout={customLayout} />);

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

  it('should handle visibility prop', () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    render(<EsriFeatureLayer {...defaultProps} visible={false} />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: expect.objectContaining({
          visibility: 'none',
        }),
      })
    );
  });

  it('should cleanup on unmount', () => {
    mockMapInstance.getLayer.mockReturnValue({ id: 'test-feature-layer' });

    const { unmount } = render(<EsriFeatureLayer {...defaultProps} />);
    unmount();

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('test-feature-layer');
    expect(mockService.remove).toHaveBeenCalled();
  });
});
