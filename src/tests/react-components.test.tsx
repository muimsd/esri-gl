/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { EsriLayer } from '@/react/components/EsriLayer';
import { EsriServiceProvider, useEsriMap } from '@/react/components/EsriServiceProvider';

// Mock map object
const mockMap = {
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getLayer: jest.fn(() => null),
  on: jest.fn(),
  off: jest.fn(),
  hasLayer: jest.fn(() => false),
};

describe('React Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EsriServiceProvider', () => {
    it('should provide map context', () => {
      const TestComponent = () => {
        const map = useEsriMap();
        return <div data-testid="test-component">{map ? 'has-map' : 'no-map'}</div>;
      };

      const { getByTestId } = render(
        <EsriServiceProvider map={mockMap as any}>
          <TestComponent />
        </EsriServiceProvider>
      );

      expect(getByTestId('test-component').textContent).toBe('has-map');
    });

    it('should handle null map', () => {
      const TestComponent = () => {
        const map = useEsriMap();
        return <div data-testid="test-component">{map ? 'has-map' : 'no-map'}</div>;
      };

      const { getByTestId } = render(
        <EsriServiceProvider map={null}>
          <TestComponent />
        </EsriServiceProvider>
      );

      expect(getByTestId('test-component').textContent).toBe('no-map');
    });

    it('should handle useEsriMap outside provider gracefully', () => {
      const TestComponent = () => {
        const map = useEsriMap();
        return <div data-testid="test-component">{map ? 'has-map' : 'no-map'}</div>;
      };

      // This should render without throwing but map should be null/undefined
      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('test-component').textContent).toBe('no-map');
    });
  });

  describe('EsriLayer', () => {
    const TestProviderWrapper = ({ children }: { children: React.ReactNode }) => (
      <EsriServiceProvider map={mockMap as any}>{children}</EsriServiceProvider>
    );

    it('should render without errors', () => {
      render(
        <TestProviderWrapper>
          <EsriLayer sourceId="test-source" layerId="test-layer" type="fill" />
        </TestProviderWrapper>
      );
      // Component should render without throwing
    });

    it('should add layer to map', () => {
      render(
        <TestProviderWrapper>
          <EsriLayer
            sourceId="test-source"
            layerId="test-layer"
            type="fill"
            paint={{ 'fill-color': '#ff0000' }}
            layout={{ visibility: 'visible' }}
          />
        </TestProviderWrapper>
      );

      expect(mockMap.addLayer).toHaveBeenCalledWith({
        id: 'test-layer',
        type: 'fill',
        source: 'test-source',
        paint: { 'fill-color': '#ff0000' },
        layout: { visibility: 'visible' },
      });
    });

    it('should handle beforeId prop', () => {
      render(
        <TestProviderWrapper>
          <EsriLayer
            sourceId="test-source"
            layerId="test-layer"
            type="line"
            beforeId="existing-layer"
          />
        </TestProviderWrapper>
      );

      expect(mockMap.addLayer).toHaveBeenCalledWith(
        {
          id: 'test-layer',
          type: 'line',
          source: 'test-source',
          paint: {},
          layout: {},
        },
        'existing-layer'
      );
    });

    it('should not add layer if it already exists', () => {
      (mockMap.getLayer as jest.Mock).mockReturnValueOnce({ id: 'test-layer' });

      render(
        <TestProviderWrapper>
          <EsriLayer sourceId="test-source" layerId="test-layer" type="fill" />
        </TestProviderWrapper>
      );

      expect(mockMap.addLayer).not.toHaveBeenCalled();
    });

    it('should handle component unmount', () => {
      (mockMap.getLayer as jest.Mock).mockReturnValue({ id: 'test-layer' });

      const { unmount } = render(
        <TestProviderWrapper>
          <EsriLayer sourceId="test-source" layerId="test-layer" type="fill" />
        </TestProviderWrapper>
      );

      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle no map gracefully', () => {
      render(
        <EsriServiceProvider map={null}>
          <EsriLayer sourceId="test-source" layerId="test-layer" type="fill" />
        </EsriServiceProvider>
      );
      // Component should render without throwing even with no map
    });
  });

  describe('useEsriMap hook', () => {
    it('should return map from context', () => {
      const { result } = renderHook(() => useEsriMap(), {
        wrapper: ({ children }) => (
          <EsriServiceProvider map={mockMap as any}>{children}</EsriServiceProvider>
        ),
      });

      expect(result.current).toBe(mockMap);
    });

    it('should return null when no map provided', () => {
      const { result } = renderHook(() => useEsriMap(), {
        wrapper: ({ children }) => <EsriServiceProvider map={null}>{children}</EsriServiceProvider>,
      });

      expect(result.current).toBeNull();
    });
  });
});
