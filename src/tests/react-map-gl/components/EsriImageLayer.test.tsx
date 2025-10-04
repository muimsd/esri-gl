import { render } from '@testing-library/react';
import { EsriImageLayer } from '@/react-map-gl/components/EsriImageLayer';
import { ImageService } from '@/Services/ImageService';
import { useMap } from 'react-map-gl/mapbox';

// Mock react-map-gl
jest.mock('react-map-gl/mapbox');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock ImageService
jest.mock('@/Services/ImageService');
const MockedImageService = ImageService as jest.MockedClass<typeof ImageService>;

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

describe('EsriImageLayer', () => {
  let mockService: jest.Mocked<ImageService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      remove: jest.fn(),
    } as any;

    MockedImageService.mockImplementation(() => mockService);
    mockMap.getMap.mockReturnValue(mockMapInstance);
    mockUseMap.mockReturnValue({ current: mockMap as any });
  });

  const defaultProps = {
    id: 'test-image-layer',
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer',
  };

  it('should render without errors', () => {
    render(<EsriImageLayer {...defaultProps} />);
    expect(MockedImageService).toHaveBeenCalled();
  });

  it('should create ImageService with correct parameters', () => {
    const props = {
      ...defaultProps,
      renderingRule: { rasterFunction: 'Colormap' },
      mosaicRule: { mosaicMethod: 'esriMosaicLockRaster' },
      format: 'jpgpng',
    };

    render(<EsriImageLayer {...props} />);

    expect(MockedImageService).toHaveBeenCalledWith(expect.any(String), mockMapInstance, {
      url: props.url,
      renderingRule: props.renderingRule,
      mosaicRule: props.mosaicRule,
      format: props.format,
    });
  });

  it('should add raster layer to map', () => {
    render(<EsriImageLayer id="test-layer" url="http://test.com" />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith({
      id: 'test-layer',
      type: 'raster',
      source: 'esri-image-test-layer',
      layout: {
        visibility: 'visible',
      },
    });
  });

  it('should add layer with beforeId when provided', () => {
    render(<EsriImageLayer id="test-layer" url="http://test.com" beforeId="other-layer" />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith(
      {
        id: 'test-layer',
        type: 'raster',
        source: 'esri-image-test-layer',
        layout: {
          visibility: 'visible',
        },
      },
      'other-layer'
    );
  });

  it('should set layer visibility to none when visible is false', () => {
    render(<EsriImageLayer id="test-layer" url="http://test.com" visible={false} />);

    expect(mockMapInstance.addLayer).toHaveBeenCalledWith({
      id: 'test-layer',
      type: 'raster',
      source: 'esri-image-test-layer',
      layout: {
        visibility: 'none',
      },
    });
  });

  it('should not add layer if it already exists', () => {
    mockMapInstance.getLayer.mockReturnValue({ id: 'test-layer' });

    render(<EsriImageLayer id="test-layer" url="http://test.com" />);

    expect(mockMapInstance.addLayer).not.toHaveBeenCalled();
  });

  it('should cleanup layer and service on unmount', () => {
    const { unmount } = render(<EsriImageLayer id="test-layer" url="http://test.com" />);

    unmount();

    expect(mockMapInstance.removeLayer).toHaveBeenCalledWith('test-layer');
    expect(mockService.remove).toHaveBeenCalled();
  });

  it('should not remove layer on unmount if it does not exist', () => {
    mockMapInstance.getLayer.mockReturnValue(undefined);

    const { unmount } = render(<EsriImageLayer id="test-layer" url="http://test.com" />);

    unmount();

    expect(mockMapInstance.removeLayer).not.toHaveBeenCalled();
  });

  it('should create service with complex options', () => {
    const renderingRule = { rasterFunction: 'Stretched' };
    const mosaicRule = { mosaicMethod: 'esriMosaicNorthwest' };

    render(
      <EsriImageLayer
        id="test-layer"
        url="http://test.com"
        renderingRule={renderingRule}
        mosaicRule={mosaicRule}
        format="jpgpng"
      />
    );

    expect(ImageService).toHaveBeenCalledWith('esri-image-test-layer', mockMapInstance, {
      url: 'http://test.com',
      renderingRule,
      mosaicRule,
      format: 'jpgpng',
    });
  });
});
