import { RasterLayer, type RasterLayerOptions } from '../../Layers/RasterLayer';
import { Service } from '../../Services/Service';
import type { Map } from '../../types';

// Mock map object
const createMockMap = () =>
  ({
    addSource: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    removeSource: jest.fn(),
    getSource: jest.fn(),
    getLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
    listens: jest.fn(),
    once: jest.fn(),
  }) as unknown as Map;

// Mock service
const createMockService = () =>
  ({
    authenticate: jest.fn(),
    metadata: jest.fn().mockResolvedValue({ name: 'Test Service' }),
  }) as unknown as Service;

describe('RasterLayer', () => {
  let mockMap: Map;
  let mockService: Service;

  beforeEach(() => {
    mockMap = createMockMap();
    mockService = createMockService();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const layer = new RasterLayer();
      expect(layer).toBeInstanceOf(RasterLayer);
      expect(layer.options).toBeDefined();
    });

    it('should create instance with custom options', () => {
      const options: RasterLayerOptions = {
        opacity: 0.7,
        format: 'jpg',
        transparent: false,
        updateInterval: 200,
      };
      const layer = new RasterLayer(options);

      expect(layer.options.opacity).toBe(0.7);
      expect((layer.options as RasterLayerOptions).format).toBe('jpg');
      expect((layer.options as RasterLayerOptions).transparent).toBe(false);
      expect((layer.options as RasterLayerOptions).updateInterval).toBe(200);
    });

    it('should apply default values', () => {
      const layer = new RasterLayer();

      expect(layer.options.opacity).toBe(1);
      expect((layer.options as RasterLayerOptions).updateInterval).toBe(150);
      expect((layer.options as RasterLayerOptions).format).toBe('png');
      expect((layer.options as RasterLayerOptions).transparent).toBe(true);
      expect((layer.options as RasterLayerOptions).f).toBe('image');
      expect((layer.options as RasterLayerOptions).useCors).toBe(true);
    });

    it('should set service when provided', () => {
      const layer = new RasterLayer({ service: mockService });
      expect((layer as unknown as { service?: Service }).service).toBe(mockService);
    });

    it('should handle date options', () => {
      const from = new Date('2023-01-01');
      const to = new Date('2023-12-31');
      const layer = new RasterLayer({ from, to });

      const options = layer.options as RasterLayerOptions;
      expect(options.from).toBe(from);
      expect(options.to).toBe(to);
    });
  });

  describe('addTo', () => {
    it('should add source and layer to map', () => {
      const layer = new RasterLayer();
      layer.addTo(mockMap);

      expect(mockMap.addSource).toHaveBeenCalled();
      expect(mockMap.addLayer).toHaveBeenCalled();
    });

    it('should create raster source with correct properties', () => {
      const layer = new RasterLayer();
      layer.addTo(mockMap);

      expect(mockMap.addSource).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'raster',
          tiles: [],
          tileSize: 512,
        })
      );
    });

    it('should create raster layer with correct properties', () => {
      const layer = new RasterLayer({ opacity: 0.8 });
      layer.addTo(mockMap);

      expect(mockMap.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'raster',
          source: expect.any(String),
          paint: {
            'raster-opacity': 0.8,
          },
        })
      );
    });

    it('should use default opacity when not specified', () => {
      const layer = new RasterLayer();
      layer.addTo(mockMap);

      expect(mockMap.addLayer).toHaveBeenCalledWith(
        expect.objectContaining({
          paint: {
            'raster-opacity': 1,
          },
        })
      );
    });
  });

  describe('setTimeRange', () => {
    it('should set time range and update layer', () => {
      const layer = new RasterLayer();
      const from = new Date('2023-06-01');
      const to = new Date('2023-06-30');

      // Mock _update method to verify it's called
      const updateSpy = jest
        .spyOn(layer as unknown as { _update: () => void }, '_update')
        .mockImplementation();

      const result = layer.setTimeRange(from, to);

      expect(result).toBe(layer); // Should return self for chaining
      expect((layer.options as RasterLayerOptions).from).toBe(from);
      expect((layer.options as RasterLayerOptions).to).toBe(to);
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should handle different date formats', () => {
      const layer = new RasterLayer();
      const from = new Date('2023-01-15T10:30:00Z');
      const to = new Date('2023-01-15T16:45:00Z');

      layer.setTimeRange(from, to);

      const [getFrom, getTo] = layer.getTimeRange();
      expect(getFrom).toBe(from);
      expect(getTo).toBe(to);
    });
  });

  describe('getTimeRange', () => {
    it('should return empty array when no time range set', () => {
      const layer = new RasterLayer();
      const [from, to] = layer.getTimeRange();

      expect(from).toBeUndefined();
      expect(to).toBeUndefined();
    });

    it('should return current time range', () => {
      const from = new Date('2023-03-01');
      const to = new Date('2023-03-31');
      const layer = new RasterLayer({ from, to });

      const [getFrom, getTo] = layer.getTimeRange();
      expect(getFrom).toBe(from);
      expect(getTo).toBe(to);
    });

    it('should return updated time range after setTimeRange', () => {
      const layer = new RasterLayer();
      const newFrom = new Date('2023-05-01');
      const newTo = new Date('2023-05-31');

      layer.setTimeRange(newFrom, newTo);
      const [from, to] = layer.getTimeRange();

      expect(from).toBe(newFrom);
      expect(to).toBe(newTo);
    });
  });

  describe('authenticate', () => {
    it('should call service authenticate when service exists', () => {
      const layer = new RasterLayer({ service: mockService });
      const token = 'test-token-123';

      const result = layer.authenticate(token);

      expect(result).toBe(layer); // Should return self for chaining
      expect(mockService.authenticate).toHaveBeenCalledWith(token);
    });

    it('should handle case when no service exists', () => {
      const layer = new RasterLayer();

      expect(() => {
        layer.authenticate('test-token');
      }).not.toThrow();
    });

    it('should work with different token formats', () => {
      const layer = new RasterLayer({ service: mockService });

      layer.authenticate('Bearer abc123');
      layer.authenticate('simple-token');
      layer.authenticate('');

      expect(mockService.authenticate).toHaveBeenCalledTimes(3);
      expect(mockService.authenticate).toHaveBeenNthCalledWith(1, 'Bearer abc123');
      expect(mockService.authenticate).toHaveBeenNthCalledWith(2, 'simple-token');
      expect(mockService.authenticate).toHaveBeenNthCalledWith(3, '');
    });
  });

  describe('metadata', () => {
    it('should call service metadata and return result via callback', async () => {
      const layer = new RasterLayer({ service: mockService });
      const callback = jest.fn();

      layer.metadata(callback);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockService.metadata).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(null, { name: 'Test Service' });
    });

    it('should handle metadata errors via callback', async () => {
      const errorService = {
        metadata: jest.fn().mockRejectedValue(new Error('Service error')),
      } as unknown as Service;

      const layer = new RasterLayer({ service: errorService });
      const callback = jest.fn();

      layer.metadata(callback);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle non-Error rejections', async () => {
      const errorService = {
        metadata: jest.fn().mockRejectedValue('String error'),
      } as unknown as Service;

      const layer = new RasterLayer({ service: errorService });
      const callback = jest.fn();

      layer.metadata(callback);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith(expect.any(Error));
      const [error] = callback.mock.calls[0];
      expect(error.message).toBe('String error');
    });

    it('should handle case when no service exists', () => {
      const layer = new RasterLayer();
      const callback = jest.fn();

      const result = layer.metadata(callback);

      expect(result).toBe(layer); // Should return self for chaining
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return layer for chaining', () => {
      const layer = new RasterLayer({ service: mockService });
      const callback = jest.fn();

      const result = layer.metadata(callback);
      expect(result).toBe(layer);
    });
  });

  describe('redraw', () => {
    it('should call _update method', () => {
      const layer = new RasterLayer();

      // Mock _update method to verify it's called
      const updateSpy = jest
        .spyOn(layer as unknown as { _update: () => void }, '_update')
        .mockImplementation();

      const result = layer.redraw();

      expect(result).toBe(layer); // Should return self for chaining
      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('protected methods', () => {
    describe('_createSource', () => {
      it('should not create source without map', () => {
        const layer = new RasterLayer();
        // Call protected method directly to test
        (layer as unknown as { _createSource: () => void })._createSource();

        // Should not throw error, just return early
        expect(mockMap.addSource).not.toHaveBeenCalled();
      });

      it('should create raster source when map exists', () => {
        const layer = new RasterLayer();
        (layer as unknown as { _map?: Map })._map = mockMap;

        (layer as unknown as { _createSource: () => void })._createSource();

        expect(mockMap.addSource).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            type: 'raster',
            tiles: [],
            tileSize: 512,
          })
        );
      });
    });

    describe('_createLayer', () => {
      it('should not create layer without map', () => {
        const layer = new RasterLayer();
        // Call protected method directly to test
        (layer as unknown as { _createLayer: () => void })._createLayer();

        // Should not throw error, just return early
        expect(mockMap.addLayer).not.toHaveBeenCalled();
      });

      it('should create raster layer when map exists', () => {
        const layer = new RasterLayer({ opacity: 0.5 });
        (layer as unknown as { _map?: Map })._map = mockMap;

        (layer as unknown as { _createLayer: () => void })._createLayer();

        expect(mockMap.addLayer).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'raster',
            paint: {
              'raster-opacity': 0.5,
            },
          })
        );
      });
    });

    describe('_update', () => {
      it('should be callable (base implementation does nothing)', () => {
        const layer = new RasterLayer();

        expect(() => {
          (layer as unknown as { _update: () => void })._update();
        }).not.toThrow();
      });
    });

    describe('_buildExportParams', () => {
      it('should return empty object (base implementation)', () => {
        const layer = new RasterLayer();

        const params = (
          layer as unknown as { _buildExportParams: () => Record<string, unknown> }
        )._buildExportParams();

        expect(params).toEqual({});
      });
    });

    describe('_requestExport', () => {
      it('should be callable without error (base implementation does nothing)', () => {
        const layer = new RasterLayer();

        expect(() => {
          (
            layer as unknown as {
              _requestExport: (
                params: Record<string, unknown>,
                bounds: [number, number, number, number]
              ) => void;
            }
          )._requestExport({}, [0, 0, 1, 1]);
        }).not.toThrow();
      });
    });

    describe('_calculateBbox', () => {
      it('should return empty string without map', () => {
        const layer = new RasterLayer();

        const bbox = (layer as unknown as { _calculateBbox: () => string })._calculateBbox();

        expect(bbox).toBe('');
      });

      it('should return empty string even with map (base implementation)', () => {
        const layer = new RasterLayer();
        (layer as unknown as { _map?: Map })._map = mockMap;

        const bbox = (layer as unknown as { _calculateBbox: () => string })._calculateBbox();

        expect(bbox).toBe('');
      });
    });

    describe('_calculateImageSize', () => {
      it('should return default size without map', () => {
        const layer = new RasterLayer();

        const size = (
          layer as unknown as { _calculateImageSize: () => string }
        )._calculateImageSize();

        expect(size).toBe('256,256');
      });

      it('should return default size with map (base implementation)', () => {
        const layer = new RasterLayer();
        (layer as unknown as { _map?: Map })._map = mockMap;

        const size = (
          layer as unknown as { _calculateImageSize: () => string }
        )._calculateImageSize();

        expect(size).toBe('256,256');
      });
    });

    describe('_renderImage', () => {
      it('should not error without map', () => {
        const layer = new RasterLayer();

        expect(() => {
          (
            layer as unknown as {
              _renderImage: (url: string, bounds: [number, number, number, number]) => void;
            }
          )._renderImage('http://example.com/image.png', [0, 0, 1, 1]);
        }).not.toThrow();
      });

      it('should store image info when map exists', () => {
        const layer = new RasterLayer();
        (layer as unknown as { _map?: Map })._map = mockMap;

        const url = 'http://example.com/test.png';
        const bounds: [number, number, number, number] = [-120, 30, -100, 50];

        (
          layer as unknown as {
            _renderImage: (url: string, bounds: [number, number, number, number]) => void;
          }
        )._renderImage(url, bounds);

        const currentImage = (
          layer as unknown as {
            _currentImage?: { url: string; bounds: [number, number, number, number] };
          }
        )._currentImage;

        expect(currentImage).toEqual({ url, bounds });
      });
    });
  });

  describe('inheritance', () => {
    it('should extend Layer class', () => {
      const layer = new RasterLayer();
      expect(layer).toHaveProperty('options');
      expect(layer).toHaveProperty('addTo');
      expect(layer).toHaveProperty('remove');
    });

    it('should have unique source and layer IDs', () => {
      const layer1 = new RasterLayer();
      const layer2 = new RasterLayer();

      expect((layer1 as unknown as { _sourceId: string })._sourceId).not.toBe(
        (layer2 as unknown as { _sourceId: string })._sourceId
      );
      expect((layer1 as unknown as { _layerId: string })._layerId).not.toBe(
        (layer2 as unknown as { _layerId: string })._layerId
      );
    });
  });

  describe('options validation', () => {
    it('should handle all supported options', () => {
      const options: RasterLayerOptions = {
        service: mockService,
        updateInterval: 500,
        format: 'jpg',
        transparent: false,
        f: 'json',
        useCors: false,
        from: new Date('2023-01-01'),
        to: new Date('2023-12-31'),
        opacity: 0.75,
        attribution: 'Custom attribution',
        interactive: true,
        zIndex: 10,
        className: 'custom-layer',
      };

      const layer = new RasterLayer(options);

      expect((layer.options as RasterLayerOptions).updateInterval).toBe(500);
      expect((layer.options as RasterLayerOptions).format).toBe('jpg');
      expect((layer.options as RasterLayerOptions).transparent).toBe(false);
      expect((layer.options as RasterLayerOptions).f).toBe('json');
      expect((layer.options as RasterLayerOptions).useCors).toBe(false);
      expect(layer.options.opacity).toBe(0.75);
      expect(layer.options.attribution).toBe('Custom attribution');
      expect(layer.options.interactive).toBe(true);
      expect(layer.options.zIndex).toBe(10);
      expect(layer.options.className).toBe('custom-layer');
    });

    it('should override defaults with user options', () => {
      const layer = new RasterLayer({
        opacity: 0.5,
        transparent: false,
        updateInterval: 300,
      });

      expect(layer.options.opacity).toBe(0.5);
      expect((layer.options as RasterLayerOptions).transparent).toBe(false);
      expect((layer.options as RasterLayerOptions).updateInterval).toBe(300);
      // Should keep other defaults
      expect((layer.options as RasterLayerOptions).format).toBe('png');
      expect((layer.options as RasterLayerOptions).useCors).toBe(true);
    });
  });
});
