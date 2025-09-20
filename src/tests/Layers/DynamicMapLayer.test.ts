import { DynamicMapLayer, dynamicMapLayer, DynamicMapLayerOptions } from '@/Layers/DynamicMapLayer';

// Mock the dependencies
jest.mock('@/Services/MapService', () => ({
  MapService: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockReturnValue('query-task'),
    identify: jest.fn().mockReturnValue('identify-task'),
    find: jest.fn().mockReturnValue('find-task'),
  })),
}));
jest.mock('@/Layers/RasterLayer', () => ({
  RasterLayer: jest.fn().mockImplementation(function (options) {
    this.options = options;
    return this;
  }),
}));

describe('DynamicMapLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create DynamicMapLayer instance with required options', () => {
      const options: DynamicMapLayerOptions = {
        url: 'https://example.com/MapServer',
      };

      const layer = new DynamicMapLayer(options);
      expect(layer).toBeInstanceOf(DynamicMapLayer);
    });

    it('should merge options with defaults', () => {
      const options: DynamicMapLayerOptions = {
        url: 'https://example.com/MapServer',
        layers: [0, 1],
        transparent: false,
      };

      const layer = new DynamicMapLayer(options);

      expect(layer.options).toMatchObject({
        url: 'https://example.com/MapServer',
        updateInterval: 150,
        layers: [0, 1],
        layerDefs: false,
        timeOptions: false,
        format: 'png32',
        transparent: false,
        f: 'json',
      });
    });
  });

  describe('dynamic layers methods', () => {
    let layer: DynamicMapLayer;

    beforeEach(() => {
      layer = new DynamicMapLayer({ url: 'https://example.com/MapServer' });
    });

    it('should get dynamic layers - returns false when not set', () => {
      const result = layer.getDynamicLayers();
      expect(result).toBe(false);
    });

    it('should set and get dynamic layers', () => {
      const dynamicLayers = [{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }];

      const result = layer.setDynamicLayers(dynamicLayers);
      expect(result).toBe(layer);
      expect(layer.getDynamicLayers()).toEqual(dynamicLayers);
    });
  });

  describe('layers methods', () => {
    let layer: DynamicMapLayer;

    beforeEach(() => {
      layer = new DynamicMapLayer({ url: 'https://example.com/MapServer' });
    });

    it('should get and set layers with array', () => {
      const layers = [0, 1, 2];

      const result = layer.setLayers(layers);
      expect(result).toBe(layer);
      expect(layer.getLayers()).toEqual(layers);
    });

    it('should set layers to false', () => {
      const result = layer.setLayers(false);
      expect(result).toBe(layer);
      expect(layer.getLayers()).toBe(false);
    });
  });

  describe('layer definitions methods', () => {
    let layer: DynamicMapLayer;

    beforeEach(() => {
      layer = new DynamicMapLayer({ url: 'https://example.com/MapServer' });
    });

    it('should get and set layer definitions', () => {
      const layerDefs = { '0': 'STATE_NAME=California', '1': 'POP2000 > 100000' };

      const result = layer.setLayerDefs(layerDefs);
      expect(result).toBe(layer);
      expect(layer.getLayerDefs()).toEqual(layerDefs);
    });

    it('should set layer definitions to false', () => {
      const result = layer.setLayerDefs(false);
      expect(result).toBe(layer);
      expect(layer.getLayerDefs()).toBe(false);
    });
  });

  describe('time options methods', () => {
    let layer: DynamicMapLayer;

    beforeEach(() => {
      layer = new DynamicMapLayer({ url: 'https://example.com/MapServer' });
    });

    it('should get and set time options', () => {
      const timeOptions = { timeExtent: [1577836800000, 1609459200000] };

      const result = layer.setTimeOptions(timeOptions);
      expect(result).toBe(layer);
      expect(layer.getTimeOptions()).toEqual(timeOptions);
    });

    it('should set time options to false', () => {
      const result = layer.setTimeOptions(false);
      expect(result).toBe(layer);
      expect(layer.getTimeOptions()).toBe(false);
    });
  });

  describe('task methods', () => {
    let layer: DynamicMapLayer;

    beforeEach(() => {
      layer = new DynamicMapLayer({ url: 'https://example.com/MapServer' });
    });

    it('should create query task from service', () => {
      const result = layer.query();
      expect(result).toBe('query-task');
    });

    it('should create identify task from service', () => {
      const result = layer.identify();
      expect(result).toBe('identify-task');
    });

    it('should create find task from service', () => {
      const result = layer.find();
      expect(result).toBe('find-task');
    });
  });

  describe('factory function', () => {
    it('should create DynamicMapLayer instance', () => {
      const options: DynamicMapLayerOptions = {
        url: 'https://example.com/MapServer',
      };

      const layer = dynamicMapLayer(options);
      expect(layer).toBeInstanceOf(DynamicMapLayer);
    });
  });

  describe('integration with different option combinations', () => {
    it('should handle complex configuration', () => {
      const options: DynamicMapLayerOptions = {
        url: 'https://example.com/MapServer',
        layers: [0, 1, 2],
        layerDefs: { '0': 'STATE_NAME=California' },
        timeOptions: { timeExtent: [1577836800000, 1609459200000] },
        dynamicLayers: [{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }],
        format: 'png24',
        transparent: false,
      };

      const layer = new DynamicMapLayer(options);

      expect(layer.getLayers()).toEqual([0, 1, 2]);
      expect(layer.getLayerDefs()).toEqual({ '0': 'STATE_NAME=California' });
      expect(layer.getTimeOptions()).toEqual({ timeExtent: [1577836800000, 1609459200000] });
      expect(layer.getDynamicLayers()).toEqual([
        { id: 0, source: { type: 'mapLayer', mapLayerId: 0 } },
      ]);
      // Note: format and transparent are in options but may not be accessible due to typing
    });

    it('should handle method chaining', () => {
      const layer = new DynamicMapLayer({ url: 'https://example.com/MapServer' });

      const result = layer
        .setLayers([0, 1])
        .setLayerDefs({ '0': 'STATE_NAME=California' })
        .setTimeOptions({ timeExtent: [1577836800000, 1609459200000] })
        .setDynamicLayers([{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }]);

      expect(result).toBe(layer);
      expect(layer.getLayers()).toEqual([0, 1]);
      expect(layer.getLayerDefs()).toEqual({ '0': 'STATE_NAME=California' });
      expect(layer.getTimeOptions()).toEqual({ timeExtent: [1577836800000, 1609459200000] });
      expect(layer.getDynamicLayers()).toEqual([
        { id: 0, source: { type: 'mapLayer', mapLayerId: 0 } },
      ]);
    });
  });

  describe('protected methods', () => {
    let layer: DynamicMapLayer;

    beforeEach(() => {
      layer = new DynamicMapLayer({
        url: 'https://example.com/MapServer',
        layers: [0, 1, 2],
        layerDefs: { '0': 'STATE_NAME=California', '1': 'POP2000 > 100000' },
        format: 'png24',
        transparent: true,
        f: 'json',
      });

      // Mock the inherited methods that _buildExportParams uses
      (layer as any)._calculateBbox = jest.fn().mockReturnValue('10,20,30,40');
      (layer as any)._calculateImageSize = jest.fn().mockReturnValue('512,512');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('_buildExportParams method', () => {
      it('should build basic export parameters', () => {
        const params = (layer as any)._buildExportParams();

        expect(params).toMatchObject({
          bbox: '10,20,30,40',
          size: '512,512',
          dpi: 96,
          format: 'png24',
          transparent: true,
          bboxSR: 4326,
          imageSR: 4326,
          layers: 'show:0,1,2',
          layerDefs: '{"0":"STATE_NAME=California","1":"POP2000 > 100000"}',
        });
      });

      it('should handle empty layers array', () => {
        const emptyLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer',
          layers: [],
        });
        (emptyLayer as any)._calculateBbox = jest.fn().mockReturnValue('10,20,30,40');
        (emptyLayer as any)._calculateImageSize = jest.fn().mockReturnValue('512,512');

        const params = (emptyLayer as any)._buildExportParams();

        expect(params).toEqual({});
      });

      it('should handle layers as string', () => {
        const stringLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer',
          layers: 'show:0,1,2,3' as any, // Test internal string handling
        });
        (stringLayer as any)._calculateBbox = jest.fn().mockReturnValue('10,20,30,40');
        (stringLayer as any)._calculateImageSize = jest.fn().mockReturnValue('512,512');

        const params = (stringLayer as any)._buildExportParams();

        expect(params.layers).toBe('show:0,1,2,3');
      });

      it('should handle layerDefs as string', () => {
        const stringDefLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer',
          layerDefs: '0:STATE_NAME=California;1:POP2000 > 100000' as any, // Test internal string handling
        });
        (stringDefLayer as any)._calculateBbox = jest.fn().mockReturnValue('10,20,30,40');
        (stringDefLayer as any)._calculateImageSize = jest.fn().mockReturnValue('512,512');

        const params = (stringDefLayer as any)._buildExportParams();

        expect(params.layerDefs).toBe('0:STATE_NAME=California;1:POP2000 > 100000');
      });

      it('should include dynamicLayers when set', () => {
        const dynamicLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer',
          dynamicLayers: [{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }],
        });
        (dynamicLayer as any)._calculateBbox = jest.fn().mockReturnValue('10,20,30,40');
        (dynamicLayer as any)._calculateImageSize = jest.fn().mockReturnValue('512,512');

        const params = (dynamicLayer as any)._buildExportParams();

        expect(params.dynamicLayers).toEqual([
          { id: 0, source: { type: 'mapLayer', mapLayerId: 0 } },
        ]);
      });

      it('should include timeOptions when set', () => {
        const timeLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer',
          timeOptions: { timeExtent: [1577836800000, 1609459200000] },
        });
        (timeLayer as any)._calculateBbox = jest.fn().mockReturnValue('10,20,30,40');
        (timeLayer as any)._calculateImageSize = jest.fn().mockReturnValue('512,512');

        const params = (timeLayer as any)._buildExportParams();

        expect(params.timeOptions).toBe('{"timeExtent":[1577836800000,1609459200000]}');
      });

      it('should include time range when from/to dates are set', () => {
        const fromDate = new Date('2020-01-01');
        const toDate = new Date('2020-12-31');
        const timeRangeLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer',
          from: fromDate,
          to: toDate,
        });
        (timeRangeLayer as any)._calculateBbox = jest.fn().mockReturnValue('10,20,30,40');
        (timeRangeLayer as any)._calculateImageSize = jest.fn().mockReturnValue('512,512');

        const params = (timeRangeLayer as any)._buildExportParams();

        expect(params.time).toBe(`${fromDate.valueOf()},${toDate.valueOf()}`);
      });
    });

    describe('_requestExport method', () => {
      let mockService: any;

      beforeEach(() => {
        mockService = {
          export: jest.fn().mockResolvedValue({ href: 'https://example.com/image.png' }),
        };
        (layer as any).service = mockService;
        (layer as any)._renderImage = jest.fn();
      });

      it('should request export with json format', async () => {
        const params = { layers: 'show:0,1,2' };
        const bounds: [number, number, number, number] = [10, 20, 30, 40];

        await (layer as any)._requestExport(params, bounds);

        expect(mockService.export).toHaveBeenCalledWith(params);
        expect((layer as any)._renderImage).toHaveBeenCalledWith(
          'https://example.com/image.png',
          bounds
        );
      });

      it('should append token to image URL if present in original URL', async () => {
        const tokenLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer?token=abc123',
          f: 'json',
        });
        (tokenLayer as any).service = mockService;
        (tokenLayer as any)._renderImage = jest.fn();

        const params = { layers: 'show:0,1,2' };
        const bounds: [number, number, number, number] = [10, 20, 30, 40];

        await (tokenLayer as any)._requestExport(params, bounds);

        expect((tokenLayer as any)._renderImage).toHaveBeenCalledWith(
          'https://example.com/image.png?abc123',
          bounds
        );
      });

      it('should handle export request failure gracefully', async () => {
        mockService.export.mockRejectedValue(new Error('Export failed'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const params = { layers: 'show:0,1,2' };
        const bounds: [number, number, number, number] = [10, 20, 30, 40];

        await (layer as any)._requestExport(params, bounds);

        expect(consoleSpy).toHaveBeenCalledWith('Export request failed:', expect.any(Error));
        consoleSpy.mockRestore();
      });

      it('should handle direct image request when f is not json', async () => {
        const directLayer = new DynamicMapLayer({
          url: 'https://example.com/MapServer',
          f: 'image',
        });
        (directLayer as any).service = mockService;
        (directLayer as any)._renderImage = jest.fn();

        const params = { layers: 'show:0,1,2', format: 'png32' };
        const bounds: [number, number, number, number] = [10, 20, 30, 40];

        await (directLayer as any)._requestExport(params, bounds);

        expect(mockService.export).not.toHaveBeenCalled();
        expect((directLayer as any)._renderImage).toHaveBeenCalledWith(
          'https://example.com/MapServer/export?layers=show%3A0%2C1%2C2&format=png32',
          bounds
        );
      });

      it('should return early if no service is available', async () => {
        (layer as any).service = null;

        const params = { layers: 'show:0,1,2' };
        const bounds: [number, number, number, number] = [10, 20, 30, 40];

        await (layer as any)._requestExport(params, bounds);

        expect((layer as any)._renderImage).not.toHaveBeenCalled();
      });
    });

    describe('_update method', () => {
      beforeEach(() => {
        (layer as any)._map = { mockMap: true };
        (layer as any)._buildExportParams = jest.fn().mockReturnValue({ layers: 'show:0,1,2' });
        (layer as any)._requestExport = jest.fn();
      });

      it('should update layer when map is available and params exist', () => {
        (layer as any)._update();

        expect((layer as any)._buildExportParams).toHaveBeenCalled();
        expect((layer as any)._requestExport).toHaveBeenCalledWith(
          { layers: 'show:0,1,2' },
          [0, 0, 0, 0]
        );
      });

      it('should return early if no map is available', () => {
        (layer as any)._map = null;

        (layer as any)._update();

        expect((layer as any)._buildExportParams).not.toHaveBeenCalled();
        expect((layer as any)._requestExport).not.toHaveBeenCalled();
      });

      it('should not request export if params are empty', () => {
        (layer as any)._buildExportParams = jest.fn().mockReturnValue({});

        (layer as any)._update();

        expect((layer as any)._buildExportParams).toHaveBeenCalled();
        expect((layer as any)._requestExport).not.toHaveBeenCalled();
      });
    });
  });
});
