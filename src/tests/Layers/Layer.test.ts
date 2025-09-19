import { Layer } from '@/Layers/Layer';
import type { Map } from '@/types';

// Create a testable subclass to access protected methods
class TestableLayer extends Layer {
  public _createSource(): void {
    super._createSource();
  }
  
  public _createLayer(): void {
    super._createLayer();
  }
  
  public _updateSource(): void {
    super._updateSource();
  }
}

// Mock Map interface
const mockMap: Partial<Map> = {
  getLayer: jest.fn(),
  removeLayer: jest.fn(),
  getSource: jest.fn(),
  removeSource: jest.fn(),
  setPaintProperty: jest.fn(),
  moveLayer: jest.fn(),
};

describe('Layer', () => {
  let layer: TestableLayer;
  let map: Map;

  beforeEach(() => {
    layer = new TestableLayer();
    map = mockMap as Map;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create layer with default options', () => {
      const defaultLayer = new Layer();
      
      expect(defaultLayer.options.opacity).toBe(1);
      expect(defaultLayer.options.interactive).toBe(false);
      expect(defaultLayer.options.zIndex).toBe(0);
    });

    it('should create layer with custom options', () => {
      const options = {
        opacity: 0.8,
        interactive: true,
        zIndex: 10,
        attribution: 'Test Attribution',
        url: 'https://example.com',
        className: 'test-layer'
      };
      
      const customLayer = new Layer(options);
      
      expect(customLayer.options.opacity).toBe(0.8);
      expect(customLayer.options.interactive).toBe(true);
      expect(customLayer.options.zIndex).toBe(10);
      expect(customLayer.options.attribution).toBe('Test Attribution');
      expect(customLayer.options.url).toBe('https://example.com');
      expect(customLayer.options.className).toBe('test-layer');
    });

    it('should generate unique source and layer IDs', () => {
      const layer1 = new Layer();
      const layer2 = new Layer();
      
      expect(layer1.getSourceId()).not.toBe(layer2.getSourceId());
      expect(layer1.getLayerId()).not.toBe(layer2.getLayerId());
      expect(layer1.getSourceId()).toMatch(/^layer-source-/);
      expect(layer1.getLayerId()).toMatch(/^layer-/);
    });
  });

  describe('addTo', () => {
    it('should add layer to map and return self', () => {
      const result = layer.addTo(map);
      
      expect(result).toBe(layer);
      expect(layer['_map']).toBe(map);
    });

    it('should call _createSource and _createLayer', () => {
      const createSourceSpy = jest.spyOn(layer, '_createSource');
      const createLayerSpy = jest.spyOn(layer, '_createLayer');
      
      layer.addTo(map);
      
      expect(createSourceSpy).toHaveBeenCalled();
      expect(createLayerSpy).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      layer.addTo(map);
    });

    it('should remove layer when layer exists', () => {
      (map.getLayer as jest.Mock).mockReturnValue({}); // Layer exists
      (map.getSource as jest.Mock).mockReturnValue({}); // Source exists
      
      const result = layer.remove();
      
      expect(result).toBe(layer);
      expect(map.removeLayer).toHaveBeenCalledWith(layer.getLayerId());
      expect(map.removeSource).toHaveBeenCalledWith(layer.getSourceId());
      expect(layer['_map']).toBeUndefined();
    });

    it('should handle when layer does not exist', () => {
      (map.getLayer as jest.Mock).mockReturnValue(null); // Layer doesn't exist
      (map.getSource as jest.Mock).mockReturnValue({}); // Source exists
      
      layer.remove();
      
      expect(map.removeLayer).not.toHaveBeenCalled();
      expect(map.removeSource).toHaveBeenCalledWith(layer.getSourceId());
    });

    it('should handle when source does not exist', () => {
      (map.getLayer as jest.Mock).mockReturnValue({}); // Layer exists
      (map.getSource as jest.Mock).mockReturnValue(null); // Source doesn't exist
      
      layer.remove();
      
      expect(map.removeLayer).toHaveBeenCalledWith(layer.getLayerId());
      expect(map.removeSource).not.toHaveBeenCalled();
    });

    it('should return self when no map is attached', () => {
      const orphanLayer = new Layer();
      const result = orphanLayer.remove();
      
      expect(result).toBe(orphanLayer);
      expect(map.removeLayer).not.toHaveBeenCalled();
      expect(map.removeSource).not.toHaveBeenCalled();
    });
  });

  describe('opacity management', () => {
    beforeEach(() => {
      layer.addTo(map);
    });

    it('should set opacity and update paint property when layer exists', () => {
      (map.getLayer as jest.Mock).mockReturnValue({}); // Layer exists
      
      const result = layer.setOpacity(0.5);
      
      expect(result).toBe(layer);
      expect(layer.options.opacity).toBe(0.5);
      expect(map.setPaintProperty).toHaveBeenCalledWith(
        layer.getLayerId(),
        'raster-opacity',
        0.5
      );
    });

    it('should set opacity but not update paint property when layer does not exist', () => {
      (map.getLayer as jest.Mock).mockReturnValue(null); // Layer doesn't exist
      
      layer.setOpacity(0.3);
      
      expect(layer.options.opacity).toBe(0.3);
      expect(map.setPaintProperty).not.toHaveBeenCalled();
    });

    it('should set opacity but not update paint property when no map is attached', () => {
      const orphanLayer = new Layer();
      orphanLayer.setOpacity(0.7);
      
      expect(orphanLayer.options.opacity).toBe(0.7);
      expect(map.setPaintProperty).not.toHaveBeenCalled();
    });

    it('should get opacity', () => {
      layer.setOpacity(0.8);
      expect(layer.getOpacity()).toBe(0.8);
    });

    it('should return default opacity when not set', () => {
      const defaultLayer = new Layer({ opacity: undefined });
      expect(defaultLayer.getOpacity()).toBe(1);
    });
  });

  describe('z-index management', () => {
    beforeEach(() => {
      layer.addTo(map);
    });

    it('should set z-index', () => {
      const result = layer.setZIndex(5);
      
      expect(result).toBe(layer);
      expect(layer.options.zIndex).toBe(5);
      // Note: MapLibre GL JS z-index implementation would be more complex
      // This test verifies the option is stored correctly
    });

    it('should handle z-index when no map is attached', () => {
      const orphanLayer = new Layer();
      orphanLayer.setZIndex(10);
      
      expect(orphanLayer.options.zIndex).toBe(10);
    });
  });

  describe('ID and attribution getters', () => {
    it('should return source ID', () => {
      const sourceId = layer.getSourceId();
      expect(typeof sourceId).toBe('string');
      expect(sourceId).toMatch(/^layer-source-/);
    });

    it('should return layer ID', () => {
      const layerId = layer.getLayerId();
      expect(typeof layerId).toBe('string');
      expect(layerId).toMatch(/^layer-/);
    });

    it('should return attribution when set', () => {
      const layerWithAttribution = new Layer({ 
        attribution: 'Custom Attribution' 
      });
      expect(layerWithAttribution.getAttribution()).toBe('Custom Attribution');
    });

    it('should return undefined when no attribution set', () => {
      expect(layer.getAttribution()).toBeUndefined();
    });
  });

  describe('protected methods (base implementations)', () => {
    it('should have _createSource method that does nothing by default', () => {
      expect(() => {
        layer._createSource();
      }).not.toThrow();
    });

    it('should have _createLayer method that does nothing by default', () => {
      expect(() => {
        layer._createLayer();
      }).not.toThrow();
    });

    it('should have _updateSource method that does nothing by default', () => {
      expect(() => {
        layer._updateSource();
      }).not.toThrow();
    });
  });
});