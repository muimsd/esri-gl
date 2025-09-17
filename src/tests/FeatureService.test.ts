import { FeatureService } from '@/Services/FeatureService.pending';
import type { Map, FeatureServiceOptions } from '@/types';

// Mock map object
const mockMap: Map = {
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  getLayer: jest.fn(),
  setPaintProperty: jest.fn(),
  moveLayer: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  fire: jest.fn(),
  _controls: [],
};

// Mock fetch globally
global.fetch = jest.fn();

describe('FeatureService', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));
  const mockServiceOptions: FeatureServiceOptions = {
    url: 'https://example.com/arcgis/rest/services/TestService/FeatureServer/0',
    where: '1=1',
    outFields: '*',
    f: 'geojson',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          copyrightText: 'Test Attribution',
          name: 'Test Service',
        }),
    });
  });

  it('should create a FeatureService instance', () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);

    expect(service).toBeInstanceOf(FeatureService);
    expect(service.esriServiceOptions.url).toBe(
      'https://example.com/arcgis/rest/services/TestService/FeatureServer/0'
    );
  });

  it('should throw error when url is not provided', () => {
    const invalidOptions = { ...mockServiceOptions };
    delete (invalidOptions as Record<string, unknown>).url;

    expect(() => {
      new FeatureService('test-source', mockMap, invalidOptions);
    }).toThrow('A url must be supplied as part of the esriServiceOptions object.');
  });

  it('should clean trailing slash from URL', () => {
    const optionsWithSlash = {
      ...mockServiceOptions,
      url: 'https://example.com/arcgis/rest/services/TestService/FeatureServer/0/',
    };

    const service = new FeatureService('test-source', mockMap, optionsWithSlash);

    expect(service.esriServiceOptions.url).toBe(
      'https://example.com/arcgis/rest/services/TestService/FeatureServer/0'
    );
  });

  it('should set where clause', async () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);
    (mockMap.getSource as jest.Mock).mockReturnValue({});

    service.setWhere('STATE_NAME = "California"');
    await flush();

    expect(service.esriServiceOptions.where).toBe('STATE_NAME = "California"');
    expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    expect(mockMap.addSource).toHaveBeenCalled();
  });

  it('should set output fields', async () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);
    (mockMap.getSource as jest.Mock).mockReturnValue({});

    service.setOutFields(['STATE_NAME', 'POP2000']);
    await flush();

    expect(service.esriServiceOptions.outFields).toEqual(['STATE_NAME', 'POP2000']);
    expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    expect(mockMap.addSource).toHaveBeenCalled();
  });

  it('should set layers', async () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);
    (mockMap.getSource as jest.Mock).mockReturnValue({});

    service.setLayers([0, 1]);
    await flush();

    expect(service.esriServiceOptions.layers).toEqual([0, 1]);
    expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    expect(mockMap.addSource).toHaveBeenCalled();
  });

  it('should remove source', () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);
    (mockMap.getSource as jest.Mock).mockReturnValue({});

    service.remove();

    expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
  });
});
