import { render } from '@testing-library/react';
import { EsriVectorTileLayer } from '@/react-map-gl/components/EsriVectorTileLayer';
import { VectorTileService } from '@/Services/VectorTileService';
import { useMap } from 'react-map-gl/mapbox';

// Mock react-map-gl
jest.mock('react-map-gl/mapbox');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock VectorTileService
jest.mock('@/Services/VectorTileService');
const MockedVectorTileService = VectorTileService as jest.MockedClass<typeof VectorTileService>;

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

describe('EsriVectorTileLayer', () => {
  let mockService: jest.Mocked<VectorTileService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      remove: jest.fn(),
    } as any;

    MockedVectorTileService.mockImplementation(() => mockService);
    mockMap.getMap.mockReturnValue(mockMapInstance);
    mockUseMap.mockReturnValue({ current: mockMap as any });
  });

  const defaultProps = {
    id: 'test-vector-tile-layer',
    url: 'https://basemaps.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer',
  };

  it('should render without errors', () => {
    render(<EsriVectorTileLayer {...defaultProps} />);
    expect(MockedVectorTileService).toHaveBeenCalled();
  });

  it('should create VectorTileService with correct parameters', () => {
    render(<EsriVectorTileLayer {...defaultProps} sourceId="custom-vector-source" />);

    expect(MockedVectorTileService).toHaveBeenCalledWith('custom-vector-source', mockMapInstance, {
      url: defaultProps.url,
    });
  });

  it('should create service and handle cleanup', () => {
    const { unmount } = render(<EsriVectorTileLayer {...defaultProps} />);

    expect(MockedVectorTileService).toHaveBeenCalledWith(
      'esri-vector-tile-test-vector-tile-layer',
      mockMapInstance,
      { url: defaultProps.url }
    );

    unmount();
    expect(mockService.remove).toHaveBeenCalled();
  });
});
