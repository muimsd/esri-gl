import { DynamicMapService } from '@/Services/DynamicMapService';
import type { Map } from '@/types';

// Mock fetch for Node.js environment
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({}),
  ok: true,
  status: 200,
}) as jest.Mock;

// Minimal stub of MapLibre/Mapbox Map APIs used by DynamicMapService
class StubMap {
  // Leave these as loose shapes; we'll cast the instance when needed
  style: any = { sourceCaches: {}, _otherSourceCaches: {} };
  transform: any = {};
  public sources: Record<string, any> = {};

  addSource(id: string, source: any) {
    this.sources[id] = { ...source };
    // Mock the sourceCache that _updateSource expects
    this.style.sourceCaches[id] = {
      clearTiles: jest.fn(),
      update: jest.fn(),
    };
  }
  getSource(id: string) {
    return this.sources[id];
  }
  removeSource(id: string) {
    delete this.sources[id];
  }
}

describe('DynamicMapService dynamicLayers and filters', () => {
  test('appends dynamicLayers param when set', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
    });

    // Initially no dynamicLayers
    const src0: any = (map as any).sources?.['dyn-src'] ?? (map as any).getSource('dyn-src');
    expect(src0.tiles[0]).not.toContain('dynamicLayers=');

    // Set dynamic layers - one visible layer with empty renderer
    svc.setDynamicLayers([{ id: 3, visible: true, drawingInfo: { renderer: { type: 'simple' } } }]);

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    expect(src.tiles[0]).toContain('dynamicLayers=');
    // Ensure value is encoded JSON
    const encoded = decodeURIComponent(src.tiles[0]);
    expect(encoded).toContain('"id":3');
    expect(encoded).toContain('"renderer"');
  });

  test('builds and applies filter as definitionExpression', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
    });

    // Apply a comparison filter
    svc.setLayerFilter(2, { field: 'STATE_NAME', op: '=', value: 'California' });

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    expect(src.tiles[0]).toContain('dynamicLayers=');
    const encoded = decodeURIComponent(src.tiles[0]);
    expect(encoded).toContain('"id":2');
    expect(encoded).toContain("STATE_NAME+=+'California'");
    expect(encoded).toContain('"source":{"type":"mapLayer","mapLayerId":2}');
  });

  test('builds IN filter correctly', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
    });

    svc.setLayerFilter(1, { field: 'STATE_ABBR', op: 'IN', values: ['CA', 'OR', 'WA'] });

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    const encoded = decodeURIComponent(src.tiles[0]);
    expect(encoded).toContain("STATE_ABBR+IN+('CA',+'OR',+'WA')");
  });

  test('builds BETWEEN filter correctly', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
    });

    svc.setLayerFilter(3, { field: 'POP2000', op: 'BETWEEN', from: 1000000, to: 5000000 });

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    const encoded = decodeURIComponent(src.tiles[0]);
    expect(encoded).toContain('POP2000+BETWEEN+1000000+AND+5000000');
  });

  test('builds grouped AND filter correctly', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
    });

    svc.setLayerFilter(2, {
      op: 'AND',
      filters: [
        { field: 'POP2000', op: '>', value: 1000000 },
        { field: 'SUB_REGION', op: '=', value: 'Pacific' },
      ],
    });

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    const encoded = decodeURIComponent(src.tiles[0]);
    expect(encoded).toContain("(POP2000+>+1000000+AND+SUB_REGION+=+'Pacific')");
  });

  test('maps visible to visibility and adds default source', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
    });

    svc.setDynamicLayers([{ id: 5, visible: false }]);

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    const encoded = decodeURIComponent(src.tiles[0]);
    expect(encoded).toContain('"visibility":false');
    expect(encoded).not.toContain('"visible"');
    expect(encoded).toContain('"source":{"type":"mapLayer","mapLayerId":5}');
  });

  test('preserves all visible layers when applying style to one layer', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      layers: [0, 1, 2], // Multiple layers visible
    });

    // Apply style to layer 2 only
    svc.setLayerRenderer(2, {
      type: 'simple',
      symbol: { type: 'esriSFS', color: [0, 122, 255, 90] },
    });

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    const encoded = decodeURIComponent(src.tiles[0]);

    // Should contain styled layer 2
    expect(encoded).toContain('"id":2');
    expect(encoded).toContain('"symbol":{"type":"esriSFS","color":[0,122,255,90]}');

    // Should also contain entries for other visible layers (0, 1)
    expect(encoded).toContain('"id":0');
    expect(encoded).toContain('"id":1');
    expect(encoded).toContain('"visibility":true');
  });

  test('preserves all visible layers when applying filter to one layer', async () => {
    const map = new StubMap() as unknown as Map;
    const svc = new DynamicMapService('dyn-src', map, {
      url: 'https://example.com/ArcGIS/rest/services/Test/MapServer',
      layers: [1, 2, 3], // Multiple layers visible
    });

    // Apply filter to layer 2 only
    svc.setLayerFilter(2, {
      field: 'STATE_NAME',
      op: '=',
      value: 'California',
    });

    // Wait for async update to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    const src = (map as any).getSource('dyn-src') as any;
    const encoded = decodeURIComponent(src.tiles[0]);

    // Should contain filtered layer 2
    expect(encoded).toContain('"id":2');
    expect(encoded).toContain("STATE_NAME+=+'California'");

    // Should also contain entries for other visible layers (1, 3)
    expect(encoded).toContain('"id":1');
    expect(encoded).toContain('"id":3');
    expect(encoded).toContain('"visibility":true');
  });
});
