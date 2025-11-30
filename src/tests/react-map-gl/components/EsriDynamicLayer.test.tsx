import { render } from '@testing-library/react';
import { EsriDynamicLayer } from '@/react-map-gl/components/EsriDynamicLayer';
import { DynamicMapService } from '@/Services/DynamicMapService';
import { useMap } from 'react-map-gl/mapbox';

// Mock react-map-gl
jest.mock('react-map-gl/mapbox');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock DynamicMapService
jest.mock('@/Services/DynamicMapService');
const MockedDynamicMapService = DynamicMapService as jest.MockedClass<typeof DynamicMapService>;

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

describe('EsriDynamicLayer', () => {
  let mockService: jest.Mocked<DynamicMapService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      remove: jest.fn(),
    } as any;

    MockedDynamicMapService.mockImplementation(() => mockService);
    mockMap.getMap.mockReturnValue(mockMapInstance);
    mockUseMap.mockReturnValue({ current: mockMap as any });
  });

  const defaultProps = {
    id: 'test-layer',
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Highways/MapServer',
  };

  it('should render without errors', () => {
    render(<EsriDynamicLayer {...defaultProps} />);
    expect(MockedDynamicMapService).toHaveBeenCalled();
  });

  it('should create DynamicMapService with correct parameters', () => {
    const props = {
      ...defaultProps,
      sourceId: 'custom-source',
      layers: [0, 1, 2],
      layerDefs: { '0': 'STATE_NAME = "Texas"' },
      format: 'png24',
      dpi: 96,
      transparent: true,
    };

    render(<EsriDynamicLayer {...props} />);

    expect(MockedDynamicMapService).toHaveBeenCalledWith('custom-source', mockMapInstance, {
      url: props.url,
      layers: props.layers,
      layerDefs: props.layerDefs,
      format: props.format,
      dpi: props.dpi,
      transparent: props.transparent,
    });
  });

  it('should use default sourceId when not provided', () => {
    render(<EsriDynamicLayer {...defaultProps} />);

    expect(MockedDynamicMapService).toHaveBeenCalledWith(
      'esri-dynamic-test-layer',
      mockMapInstance,
      expect.any(Object)
    );
  });

  it('should add layer to map with correct configuration', () => {
    mockMapInstance.getLayer.mockReturnValue(null); // Layer doesn't exist

    render(<EsriDynamicLayer {...defaultProps} />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith({
      id: 'test-layer',
      type: 'raster',
      source: 'esri-dynamic-test-layer',
      layout: {
        visibility: 'visible',
      },
    });
  });

  it('should add layer with beforeId when provided', () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    render(<EsriDynamicLayer {...defaultProps} beforeId="existing-layer" />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'test-layer',
        type: 'raster',
        source: 'esri-dynamic-test-layer',
      }),
      'existing-layer'
    );
  });

  it('should set layer visibility to none when visible is false', () => {
    mockMapInstance.getLayer.mockReturnValue(null);

    render(<EsriDynamicLayer {...defaultProps} visible={false} />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: {
          visibility: 'none',
        },
      })
    );
  });

  it('should not add layer if it already exists', () => {
    mockMapInstance.getLayer.mockReturnValue({ id: 'test-layer' }); // Layer exists

    render(<EsriDynamicLayer {...defaultProps} />);

    expect(mockMapInstance.addLayer).not.toHaveBeenCalled();
  });

  it('should not create service when map is not available', () => {
    mockUseMap.mockReturnValue({ current: undefined });

    render(<EsriDynamicLayer {...defaultProps} />);

    expect(MockedDynamicMapService).not.toHaveBeenCalled();
  });

  it('should cleanup layer and service on unmount', () => {
    mockMapInstance.getLayer.mockReturnValue({ id: 'test-layer' }); // Layer exists for cleanup

    const { unmount } = render(<EsriDynamicLayer {...defaultProps} />);

    unmount();

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('test-layer');
    expect(mockService.remove).toHaveBeenCalled();
  });

  it('should not remove layer on unmount if it does not exist', () => {
    mockMapInstance.getLayer.mockReturnValue(null); // Layer doesn't exist

    const { unmount } = render(<EsriDynamicLayer {...defaultProps} />);

    unmount();

    expect(mockMapInstance.removeLayer).not.toHaveBeenCalled();
    expect(mockService.remove).toHaveBeenCalled();
  });

  it('should handle service recreation when props change', () => {
    const { rerender } = render(<EsriDynamicLayer {...defaultProps} />);

    expect(MockedDynamicMapService).toHaveBeenCalledTimes(1);

    // Change URL prop
    rerender(<EsriDynamicLayer {...defaultProps} url="https://different-url.com" />);

    expect(MockedDynamicMapService).toHaveBeenCalledTimes(2);
  });

  it('should handle complex layer definitions', () => {
    const props = {
      ...defaultProps,
      layers: [0, 1, 2],
      layerDefs: {
        '0': 'STATE_NAME = "California"',
        '1': 'POP2000 > 1000000',
      },
    };

    render(<EsriDynamicLayer {...props} />);

    expect(MockedDynamicMapService).toHaveBeenCalledWith(
      expect.any(String),
      mockMapInstance,
      expect.objectContaining({
        layers: props.layers,
        layerDefs: props.layerDefs,
      })
    );
  });
});
