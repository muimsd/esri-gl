import { render } from '@testing-library/react';
import { EsriTiledLayer } from '@/react-map-gl/components/EsriTiledLayer';
import { TiledMapService } from '@/Services/TiledMapService';
import { useMap } from 'react-map-gl/mapbox';

// Mock react-map-gl
jest.mock('react-map-gl/mapbox');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock TiledMapService
jest.mock('@/Services/TiledMapService');
const MockedTiledMapService = TiledMapService as jest.MockedClass<typeof TiledMapService>;

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

describe('EsriTiledLayer', () => {
  let mockService: jest.Mocked<TiledMapService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      remove: jest.fn(),
    } as any;

    MockedTiledMapService.mockImplementation(() => mockService);
    mockMap.getMap.mockReturnValue(mockMapInstance);
    mockUseMap.mockReturnValue({ current: mockMap as any });
  });

  const defaultProps = {
    id: 'test-tiled-layer',
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer',
  };

  it('should render without errors', () => {
    render(<EsriTiledLayer {...defaultProps} />);
    expect(MockedTiledMapService).toHaveBeenCalled();
  });

  it('should create TiledMapService with correct parameters', () => {
    render(<EsriTiledLayer {...defaultProps} sourceId="custom-tiled-source" />);

    expect(MockedTiledMapService).toHaveBeenCalledWith('custom-tiled-source', mockMapInstance, {
      url: defaultProps.url,
    });
  });

  it('should add raster layer to map', () => {
    render(<EsriTiledLayer id="test-layer" url="http://test.com" />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith({
      id: 'test-layer',
      type: 'raster',
      source: 'esri-tiled-test-layer',
      layout: {
        visibility: 'visible',
      },
    });
  });

  it('should add layer with beforeId when provided', () => {
    render(<EsriTiledLayer id="test-layer" url="http://test.com" beforeId="other-layer" />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      {
        id: 'test-layer',
        type: 'raster',
        source: 'esri-tiled-test-layer',
        layout: {
          visibility: 'visible',
        },
      },
      'other-layer'
    );
  });

  it('should set layer visibility to none when visible is false', () => {
    render(<EsriTiledLayer id="test-layer" url="http://test.com" visible={false} />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith({
      id: 'test-layer',
      type: 'raster',
      source: 'esri-tiled-test-layer',
      layout: {
        visibility: 'none',
      },
    });
  });

  it('should not add layer if it already exists', () => {
    mockMapInstance.getLayer.mockReturnValue({ id: 'test-layer' });

    render(<EsriTiledLayer id="test-layer" url="http://test.com" />);

    expect(mockMapInstance.addLayer).not.toHaveBeenCalled();
  });

  it('should cleanup layer and service on unmount', () => {
    const { unmount } = render(<EsriTiledLayer id="test-layer" url="http://test.com" />);

    unmount();

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('test-layer');
    expect(mockService.remove).toHaveBeenCalled();
  });

  it('should not remove layer on unmount if it does not exist', () => {
    mockMapInstance.getLayer.mockReturnValue(undefined);

    const { unmount } = render(<EsriTiledLayer id="test-layer" url="http://test.com" />);

    unmount();

    expect(mockMapInstance.removeLayer).not.toHaveBeenCalled();
  });
});
