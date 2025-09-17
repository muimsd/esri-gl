import { FeatureService } from '@/Services/FeatureService.pending';
import { Map, FeatureServiceOptions } from '@/types/types';

// Mock map object
const mockMap: Map = {
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(),
  _controls: [],
};

// Mock fetch globally
global.fetch = jest.fn();

describe('FeatureService', () => {
  const mockServiceOptions: FeatureServiceOptions = {
    url: 'https://example.com/arcgis/rest/services/TestService/FeatureServer/0',
    where: '1=1',
    outFields: '*',
    f: 'geojson',
  };

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
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
    delete (invalidOptions as any).url;

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

  it('should set where clause', () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);
    const mockSource = { setData: jest.fn() }
    ;(mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

    service.setWhere('STATE_NAME = "California"');

    expect(service.esriServiceOptions.where).toBe('STATE_NAME = "California"');
    expect(mockSource.setData).toHaveBeenCalled();
  });

  it('should set output fields', () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);
    const mockSource = { setData: jest.fn() }
    ;(mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

    service.setOutFields(['STATE_NAME', 'POP2000']);

    expect(service.esriServiceOptions.outFields).toEqual(['STATE_NAME', 'POP2000']);
    expect(mockSource.setData).toHaveBeenCalled();
  });

  it('should set layers', () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions);
    const mockSource = { setData: jest.fn() }
    ;(mockMap.getSource as jest.Mock).mockReturnValue(mockSource);

    service.setLayers([0, 1]);

    expect(service.esriServiceOptions.layers).toEqual([0, 1]);
    expect(mockSource.setData).toHaveBeenCalled();
  });

  it('should remove source', () => {
    const service = new FeatureService('test-source', mockMap, mockServiceOptions)
    ;(mockMap.getSource as jest.Mock).mockReturnValue({});

    service.remove();

    expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
  });
});
