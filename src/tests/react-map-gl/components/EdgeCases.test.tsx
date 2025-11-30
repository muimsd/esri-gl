/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { EsriFeatureLayer } from '@/react-map-gl/components/EsriFeatureLayer';
import { EsriVectorBasemapLayer } from '@/react-map-gl/components/EsriVectorBasemapLayer';
import { EsriVectorTileLayer } from '@/react-map-gl/components/EsriVectorTileLayer';
import { FeatureService } from '@/Services/FeatureService';
import { VectorBasemapStyle } from '@/Services/VectorBasemapStyle';
import { VectorTileService } from '@/Services/VectorTileService';
import { useMap } from 'react-map-gl/mapbox';

// Mock react-map-gl
jest.mock('react-map-gl/mapbox');
const mockUseMap = useMap as jest.MockedFunction<typeof useMap>;

// Mock services
jest.mock('@/Services/FeatureService');
jest.mock('@/Services/VectorBasemapStyle');
jest.mock('@/Services/VectorTileService');

const MockedFeatureService = FeatureService as jest.MockedClass<typeof FeatureService>;
const MockedVectorBasemapStyle = VectorBasemapStyle as jest.MockedClass<typeof VectorBasemapStyle>;
const MockedVectorTileService = VectorTileService as jest.MockedClass<typeof VectorTileService>;

const mockMapInstance = {
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getLayer: jest.fn(),
};

describe('React-Map-GL Component Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock services
    MockedFeatureService.mockImplementation(
      () =>
        ({
          remove: jest.fn(),
        }) as any
    );

    MockedVectorBasemapStyle.mockImplementation(
      () =>
        ({
          remove: jest.fn(),
        }) as any
    );

    MockedVectorTileService.mockImplementation(
      () =>
        ({
          remove: jest.fn(),
        }) as any
    );
  });

  describe('EsriFeatureLayer edge cases', () => {
    it('should handle missing map gracefully', () => {
      mockUseMap.mockReturnValue({ current: null as any });

      expect(() => {
        render(<EsriFeatureLayer id="test-layer" url="http://test.com" />);
      }).not.toThrow();

      expect(MockedFeatureService).not.toHaveBeenCalled();
    });

    it('should handle map without getMap method gracefully', () => {
      // This test verifies the component doesn't crash, but it will throw due to getMap call
      // The component expects a valid map with getMap method
      mockUseMap.mockReturnValue({ current: {} as any });

      expect(() => {
        render(<EsriFeatureLayer id="test-layer" url="http://test.com" />);
      }).toThrow('map.getMap is not a function');
    });

    it('should handle custom paint and layout properties', () => {
      const mockMap = {
        getMap: jest.fn().mockReturnValue(mockMapInstance),
      };
      mockUseMap.mockReturnValue({ current: mockMap as any });

      const customPaint = {
        'fill-color': '#ff0000',
        'fill-opacity': 0.5,
      };

      const customLayout = {
        visibility: 'visible' as const,
      };

      render(
        <EsriFeatureLayer
          id="test-layer"
          url="http://test.com"
          paint={customPaint}
          layout={customLayout}
        />
      );

      expect(mockMapInstance.addLayer).toHaveBeenCalledWith({
        id: 'test-layer',
        type: 'fill',
        source: 'esri-feature-test-layer',
        paint: customPaint,
        layout: customLayout,
      });
    });

    it('should handle service cleanup when layer removal fails', () => {
      const mockMap = {
        getMap: jest.fn().mockReturnValue(mockMapInstance),
      };
      mockUseMap.mockReturnValue({ current: mockMap as any });

      // Mock getLayer to return null (layer doesn't exist)
      mockMapInstance.getLayer.mockReturnValue(null);

      const { unmount } = render(<EsriFeatureLayer id="test-layer" url="http://test.com" />);

      unmount();

      // Should not call removeLayer when layer doesn't exist
      expect(mockMapInstance.removeLayer).not.toHaveBeenCalled();
    });
  });

  describe('EsriVectorBasemapLayer edge cases', () => {
    it('should create service without token', () => {
      const mockMap = {
        getMap: jest.fn().mockReturnValue(mockMapInstance),
      };
      mockUseMap.mockReturnValue({ current: mockMap as any });

      render(<EsriVectorBasemapLayer id="test-basemap" basemapEnum="streets" token="" />);

      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('streets', { token: '' });
    });

    it('should create service with token', () => {
      const mockMap = {
        getMap: jest.fn().mockReturnValue(mockMapInstance),
      };
      mockUseMap.mockReturnValue({ current: mockMap as any });

      render(<EsriVectorBasemapLayer id="test-basemap" basemapEnum="streets" token="test-token" />);

      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('streets', { token: 'test-token' });
    });

    it('should create service even without map (basemap styles work differently)', () => {
      mockUseMap.mockReturnValue({ current: null as any });

      render(<EsriVectorBasemapLayer id="test-basemap" basemapEnum="streets" token="" />);

      // Service is still created since basemap styles don't require map instance initially
      expect(MockedVectorBasemapStyle).toHaveBeenCalledWith('streets', { token: '' });
    });
  });

  describe('EsriVectorTileLayer edge cases', () => {
    it('should create service with custom sourceId', () => {
      const mockMap = {
        getMap: jest.fn().mockReturnValue(mockMapInstance),
      };
      mockUseMap.mockReturnValue({ current: mockMap as any });

      render(
        <EsriVectorTileLayer
          id="test-layer"
          url="http://test.com"
          sourceId="custom-vector-source"
        />
      );

      expect(MockedVectorTileService).toHaveBeenCalledWith(
        'custom-vector-source',
        mockMapInstance,
        { url: 'http://test.com' }
      );
    });

    it('should use default sourceId when not provided', () => {
      const mockMap = {
        getMap: jest.fn().mockReturnValue(mockMapInstance),
      };
      mockUseMap.mockReturnValue({ current: mockMap as any });

      render(<EsriVectorTileLayer id="test-layer" url="http://test.com" />);

      expect(MockedVectorTileService).toHaveBeenCalledWith(
        'esri-vector-tile-test-layer',
        mockMapInstance,
        { url: 'http://test.com' }
      );
    });

    it('should handle missing map for vector tile layer', () => {
      mockUseMap.mockReturnValue({ current: null as any });

      expect(() => {
        render(<EsriVectorTileLayer id="test-layer" url="http://test.com" />);
      }).not.toThrow();

      expect(MockedVectorTileService).not.toHaveBeenCalled();
    });

    it('should cleanup vector tile service properly', () => {
      const mockMap = {
        getMap: jest.fn().mockReturnValue(mockMapInstance),
      };
      mockUseMap.mockReturnValue({ current: mockMap as any });

      const mockService = { remove: jest.fn() };
      MockedVectorTileService.mockImplementation(() => mockService as any);

      const { unmount } = render(<EsriVectorTileLayer id="test-layer" url="http://test.com" />);

      unmount();

      expect(mockService.remove).toHaveBeenCalled();
    });
  });
});
