import { DynamicMapService } from '../../Services/DynamicMapService';
import type { EsriServiceOptions, LayerLabelingInfo } from '../../types';

// Mock the utils module to avoid network calls
jest.mock('../../utils', () => ({
  cleanTrailingSlash: (url: string) => url.replace(/\/$/, ''),
  getServiceDetails: jest.fn().mockResolvedValue({ copyrightText: 'Mock copyright' }),
  updateAttribution: jest.fn(),
}));

// Mock map and source for testing
const mockMap = {
  addSource: jest.fn(),
  getSource: jest.fn(() => ({
    tiles: ['mock-tile-url'],
    setTiles: jest.fn(),
  })),
  style: {
    sourceCaches: {
      'test-source': {
        clearTiles: jest.fn(),
        update: jest.fn(),
      },
    },
  },
} as any;

describe('DynamicMapService Labeling', () => {
  let service: DynamicMapService;
  const mockOptions: EsriServiceOptions = {
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer',
    layers: [0, 1, 2],
    getAttributionFromService: false, // Disable attribution fetching for tests
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DynamicMapService('test-source', mockMap, mockOptions);
  });

  describe('setLayerLabels', () => {
    it('should apply labeling configuration correctly', () => {
      const labelConfig: LayerLabelingInfo = {
        labelExpression: '[state_name]',
        symbol: {
          type: 'esriTS',
          color: [255, 255, 255, 255],
          backgroundColor: [0, 0, 0, 128],
          font: {
            family: 'Arial',
            size: 12,
            weight: 'bold'
          }
        },
        minScale: 0,
        maxScale: 25000000
      };

      service.setLayerLabels(2, labelConfig);

      // Check that dynamicLayers was set correctly
      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      expect(Array.isArray(dynamicLayers)).toBe(true);
      
      // Should include the labeled layer
      const labeledLayer = dynamicLayers.find(l => l.id === 2);
      expect(labeledLayer).toBeDefined();
      expect(labeledLayer.drawingInfo.labelingInfo).toEqual([labelConfig]);
      
      // Should include all visible layers (0, 1, 2)
      expect(dynamicLayers).toHaveLength(3);
      expect(dynamicLayers.map(l => l.id).sort()).toEqual([0, 1, 2]);
    });

    it('should use correct field names in label expressions', () => {
      service.setLayerLabels(2, {
        labelExpression: '[state_name]', // Should use actual field name
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] }
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const labeledLayer = dynamicLayers.find(l => l.id === 2);
      expect(labeledLayer.drawingInfo.labelingInfo[0].labelExpression).toBe('[state_name]');
    });

    it('should generate correct URL with dynamicLayers parameter', () => {
      service.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] }
      });

      const source = service._source;
      const tileUrl = source.tiles[0];
      
      expect(tileUrl).toContain('dynamicLayers=');
      expect(tileUrl).toContain(encodeURIComponent('[state_name]'));
    });

    it('should preserve existing layer configurations when adding labels', () => {
      // First apply a renderer
      service.setLayerRenderer(2, {
        type: 'simple',
        symbol: {
          type: 'esriSFS',
          color: [255, 0, 0, 128]
        }
      });

      // Then add labels
      service.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] }
      });

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 2);
      
      // Should have both renderer and labels
      expect(layer.drawingInfo.renderer).toBeDefined();
      expect(layer.drawingInfo.labelingInfo).toBeDefined();
    });
  });

  describe('setLayerLabelsVisible', () => {
    it('should disable labels by removing labelingInfo', () => {
      // First apply labels
      service.setLayerLabels(2, {
        labelExpression: '[state_name]',
        symbol: { type: 'esriTS', color: [0, 0, 0, 255] }
      });

      // Then disable them
      service.setLayerLabelsVisible(2, false);

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 2);
      
      // labelingInfo should be removed or empty
      expect(layer.drawingInfo.labelingInfo).toBeUndefined();
    });

    it('should enable default labels when none exist', () => {
      service.setLayerLabelsVisible(2, true);

      const dynamicLayers = service.esriServiceOptions.dynamicLayers as any[];
      const layer = dynamicLayers.find(l => l.id === 2);
      
      // Should have default labelingInfo
      expect(layer.drawingInfo.labelingInfo).toBeDefined();
      expect(layer.drawingInfo.labelingInfo).toHaveLength(1);
    });
  });

  describe('Multiple label types', () => {
    it('should apply state abbreviation labels correctly', () => {
      service.setLayerLabels(0, {
        labelExpression: '[state_abbr]',
        symbol: {
          type: 'esriTS',
          color: [0, 0, 0, 255],
          backgroundColor: [255, 255, 255, 180],
          font: {
            family: 'Arial',
            size: 12,
            style: 'normal',
            weight: 'bold'
          }
        }
      });

      const source = mockMap.getSource('test-source');
      expect(source.setTiles).toHaveBeenCalled();
      
      const lastCall = source.setTiles.mock.calls[source.setTiles.mock.calls.length - 1];
      const url = lastCall[0][0];
      expect(url).toContain('dynamicLayers=');
      expect(url).toContain('[state_abbr]');
    });

    it('should apply population labels correctly', () => {
      service.setLayerLabels(0, {
        labelExpression: '[pop2000]',
        symbol: {
          type: 'esriTS',
          color: [0, 255, 0, 255],
          backgroundColor: [0, 0, 0, 140],
          font: {
            family: 'Arial',
            size: 9,
            style: 'normal',
            weight: 'bold'
          }
        }
      });

      const source = mockMap.getSource('test-source');
      expect(source.setTiles).toHaveBeenCalled();
      
      const lastCall = source.setTiles.mock.calls[source.setTiles.mock.calls.length - 1];
      const url = lastCall[0][0];
      expect(url).toContain('[pop2000]');
    });

    it('should apply sub-region labels correctly', () => {
      service.setLayerLabels(0, {
        labelExpression: '[sub_region]',
        symbol: {
          type: 'esriTS',
          color: [255, 255, 0, 255],
          backgroundColor: [0, 0, 0, 160],
          font: {
            family: 'Arial',
            size: 8,
            style: 'normal',
            weight: 'bold'
          }
        }
      });

      const source = mockMap.getSource('test-source');
      expect(source.setTiles).toHaveBeenCalled();
      
      const lastCall = source.setTiles.mock.calls[source.setTiles.mock.calls.length - 1];
      const url = lastCall[0][0];
      expect(url).toContain('[sub_region]');
    });
  });
});