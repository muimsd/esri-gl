import { DynamicMapLayer, dynamicMapLayer, DynamicMapLayerOptions } from '@/Layers/DynamicMapLayer';

// Mock the dependencies
jest.mock('@/Services/MapService');
jest.mock('@/Layers/RasterLayer', () => ({
  RasterLayer: jest.fn().mockImplementation(function(options) {
    this.options = options;
    return this;
  })
}));

describe('DynamicMapLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create DynamicMapLayer instance with required options', () => {
      const options: DynamicMapLayerOptions = {
        url: 'https://example.com/MapServer'
      };

      const layer = new DynamicMapLayer(options);
      expect(layer).toBeInstanceOf(DynamicMapLayer);
    });

    it('should merge options with defaults', () => {
      const options: DynamicMapLayerOptions = {
        url: 'https://example.com/MapServer',
        layers: [0, 1],
        transparent: false
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
        f: 'json'
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
      expect(result).toBeDefined();
    });

    it('should create identify task from service', () => {
      const result = layer.identify();
      expect(result).toBeDefined();
    });

    it('should create find task from service', () => {
      const result = layer.find();
      expect(result).toBeDefined();
    });
  });

  describe('factory function', () => {
    it('should create DynamicMapLayer instance', () => {
      const options: DynamicMapLayerOptions = {
        url: 'https://example.com/MapServer'
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
        transparent: false
      };

      const layer = new DynamicMapLayer(options);

      expect(layer.getLayers()).toEqual([0, 1, 2]);
      expect(layer.getLayerDefs()).toEqual({ '0': 'STATE_NAME=California' });
      expect(layer.getTimeOptions()).toEqual({ timeExtent: [1577836800000, 1609459200000] });
      expect(layer.getDynamicLayers()).toEqual([{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }]);
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
      expect(layer.getDynamicLayers()).toEqual([{ id: 0, source: { type: 'mapLayer', mapLayerId: 0 } }]);
    });
  });
});