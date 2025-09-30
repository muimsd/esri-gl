import { render } from '@testing-library/react';
import { EsriVectorBasemapLayer } from '@/react-map-gl/components/EsriVectorBasemapLayer';
import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';
import { useMap } from 'react-map-gl';

// Mock react-map-gl
jest.mock('react-map-gl');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock VectorBasemapStyle
jest.mock('@/Services/VectorBasemapStyle');
const MockedVectorBasemapStyle = VectorBasemapStyle as jest.MockedClass<typeof VectorBasemapStyle>;

const mockMap = {
  getMap: jest.fn(() => ({
    setStyle: jest.fn(),
  })),
};

const mockMapInstance = {
  setStyle: jest.fn(),
};

describe('EsriVectorBasemapLayer', () => {
  let mockService: jest.Mocked<VectorBasemapStyle>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      styleUrl:
        'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/v1/styles/arcgis/streets',
      remove: jest.fn(),
    } as any;

    MockedVectorBasemapStyle.mockImplementation(() => mockService);
    mockMap.getMap.mockReturnValue(mockMapInstance);
    mockUseMap.mockReturnValue({ current: mockMap as any });
  });

  const defaultProps = {
    id: 'test-vector-basemap',
    basemapEnum: 'arcgis/streets',
    token: 'test-token',
  };

  it('should render without errors', () => {
    render(<EsriVectorBasemapLayer {...defaultProps} />);
    expect(MockedVectorBasemapStyle).toHaveBeenCalled();
  });

  it('should create VectorBasemapStyle with correct parameters', () => {
    render(<EsriVectorBasemapLayer {...defaultProps} />);

    expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/streets', {
      token: 'test-token',
    });
  });

  it('should create service and handle cleanup', () => {
    const { unmount } = render(<EsriVectorBasemapLayer {...defaultProps} />);

    expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('arcgis/streets', {
      token: 'test-token',
    });

    unmount();
    expect(mockService.remove).toHaveBeenCalled();
  });
});
