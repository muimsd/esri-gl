import { FeatureService } from '@/Services/FeatureService';
import type { Map } from 'maplibre-gl';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the tilebelt module
jest.mock('@mapbox/tilebelt', () => ({
  bboxToTile: jest.fn(() => [0, 0, 10]), // Return tile at zoom 10 to match map zoom
  tileToBBOX: jest.fn(() => [-180, -90, 180, 90]),
  tileToQuadkey: jest.fn(() => '0000000000'),
  getChildren: jest.fn((tile: [number, number, number]) => {
    const z = tile[2] + 1;
    return [
      [0, 0, z],
      [1, 0, z],
      [0, 1, z],
      [1, 1, z],
    ];
  }),
}));

// Mock the arcgis-pbf-parser module
jest.mock('arcgis-pbf-parser', () =>
  jest.fn(() => ({
    featureCollection: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 1,
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: {},
        },
      ],
    },
  }))
);

describe('FeatureService', () => {
  let mockMap: any;

  const mockServiceOptions = {
    url: 'https://example.com/arcgis/rest/services/TestService/FeatureServer/0',
  };

  // Mock service metadata response
  const mockMetadataResponse = {
    name: 'TestLayer',
    geometryType: 'esriGeometryPoint',
    supportedQueryFormats: 'JSON, geoJSON, PBF',
    uniqueIdField: { name: 'OBJECTID', type: 'esriFieldTypeOID' },
    copyrightText: 'Test Copyright',
    extent: {
      xmin: -180,
      ymin: -90,
      xmax: 180,
      ymax: 90,
      spatialReference: { wkid: 4326 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockMap = {
      addSource: jest.fn(),
      removeSource: jest.fn(),
      getSource: jest.fn().mockReturnValue({
        setData: jest.fn(),
      }),
      getLayer: jest.fn(),
      removeLayer: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      getZoom: jest.fn().mockReturnValue(10),
      getBounds: jest.fn().mockReturnValue({
        toArray: () => [
          [-120, 30],
          [-100, 50],
        ],
      }),
      getCanvas: jest.fn().mockReturnValue({ width: 800 }),
      getStyle: jest.fn().mockReturnValue({ layers: [] }),
    };

    // Default mock for service metadata
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMetadataResponse),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } as Response);
  });

  describe('Constructor', () => {
    it('should create a FeatureService instance', () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      expect(service).toBeInstanceOf(FeatureService);
    });

    it('should throw error when arguments are missing', () => {
      expect(() => new FeatureService('', mockMap as Map, mockServiceOptions)).toThrow(
        'Source id, map and arcgisOptions must be supplied'
      );
      expect(() => new FeatureService('test', null as unknown as Map, mockServiceOptions)).toThrow(
        'Source id, map and arcgisOptions must be supplied'
      );
    });

    it('should throw error when url is not provided', () => {
      expect(() => new FeatureService('test-source', mockMap as Map, {} as any)).toThrow(
        'A url must be supplied'
      );
    });

    it('should clean trailing slash from URL', () => {
      const service = new FeatureService('test-source', mockMap as Map, {
        url: 'https://example.com/arcgis/rest/services/TestService/FeatureServer/0/',
      });
      expect(service.esriServiceOptions.url).toBe(
        'https://example.com/arcgis/rest/services/TestService/FeatureServer/0'
      );
    });

    it('should set default options correctly', () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      expect(service.esriServiceOptions.where).toBe('1=1');
      expect(service.esriServiceOptions.outFields).toBe('*');
      expect(service.esriServiceOptions.simplifyFactor).toBe(0.3);
      expect(service.esriServiceOptions.precision).toBe(8);
    });

    it('should add a GeoJSON source to the map', () => {
      new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      expect(mockMap.addSource).toHaveBeenCalledWith(
        'test-source',
        expect.objectContaining({
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        })
      );
    });

    it('should create a sourceReady promise', () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      expect(service.sourceReady).toBeInstanceOf(Promise);
    });
  });

  describe('Service Metadata', () => {
    it('should fetch service metadata on initialization', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('?f=json'), undefined);
    });

    it('should detect PBF support', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(service.supportsPbf).toBe(true);
    });

    it('should detect GeoJSON support', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(service.supportsGeojson).toBe(true);
    });

    it('should handle service metadata errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      await expect(service.sourceReady).rejects.toThrow();
    });

    it('should handle ESRI error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: { message: 'Service unavailable' } }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      await expect(service.sourceReady).rejects.toThrow();
    });
  });

  describe('PBF Format Detection', () => {
    it('should fallback to GeoJSON when PBF is not supported', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMetadataResponse,
            supportedQueryFormats: 'JSON, geoJSON',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(service.supportsPbf).toBe(false);
      expect(service.supportsGeojson).toBe(true);
    });

    it('should reject when neither PBF nor GeoJSON is supported', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMetadataResponse,
            supportedQueryFormats: 'JSON',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);

      await expect(service.sourceReady).rejects.toThrow(
        'Server does not support PBF or GeoJSON query formats'
      );
    });
  });

  describe('Filter Methods', () => {
    it('should set where clause', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.setWhere("STATUS = 'Active'");
      expect(service.esriServiceOptions.where).toBe("STATUS = 'Active'");
    });

    it('should clear where clause', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.setWhere("STATUS = 'Active'");
      service.clearWhere();
      expect(service.esriServiceOptions.where).toBe('1=1');
    });

    it('should set date filter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const to = new Date('2024-12-31');
      const from = new Date('2024-01-01');
      service.setDate(to, from);

      expect(service.esriServiceOptions.to).toEqual(to);
      expect(service.esriServiceOptions.from).toEqual(from);
    });

    it('should set token', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.setToken('test-token');
      expect(service.esriServiceOptions.token).toBe('test-token');
    });

    it('should set output fields', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.setOutFields(['NAME', 'ID', 'STATUS']);
      expect(service.esriServiceOptions.outFields).toBe('NAME,ID,STATUS');
    });
  });

  describe('Map Event Handling', () => {
    it('should enable map event listeners', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(mockMap.on).toHaveBeenCalledWith('moveend', expect.any(Function));
    });

    it('should disable map event listeners', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.disableRequests();
      expect(mockMap.off).toHaveBeenCalledWith('moveend', expect.any(Function));
    });
  });

  describe('Query Methods', () => {
    it('should query features with default options', async () => {
      // Set up mocks: metadata, tile query, then explicit query
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.queryFeatures();
      expect(result).toBeDefined();
      expect(result.type).toBe('FeatureCollection');
    });

    it('should query features by location', async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              type: 'FeatureCollection',
              features: [{ type: 'Feature', properties: { NAME: 'Test' } }],
            }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.getFeaturesByLonLat({ lng: -118, lat: 34 }, 100, true);

      // Find the location query call (contains distance=)
      const queryCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('distance=')
      );
      expect(queryCall).toBeDefined();
      expect(result.type).toBe('FeatureCollection');
    });

    it('should query features by object IDs', async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              type: 'FeatureCollection',
              features: [
                { type: 'Feature', id: 1 },
                { type: 'Feature', id: 2 },
              ],
            }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.getFeaturesByObjectIds([1, 2, 3]);

      // Find the objectIds query call (contains objectIds=)
      const queryCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('objectIds=')
      );
      expect(queryCall).toBeDefined();
      expect(result.type).toBe('FeatureCollection');
    });

    it('should handle query errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      // Now mock a failed query
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(service.queryFeatures()).rejects.toThrow('HTTP error');
    });
  });

  describe('Style Generation', () => {
    it('should generate point style for point geometry', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const style = service.defaultStyle;
      expect(style.type).toBe('circle');
      expect(style.source).toBe('test-source');
    });

    it('should generate line style for polyline geometry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMetadataResponse,
            geometryType: 'esriGeometryPolyline',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const style = service.defaultStyle;
      expect(style.type).toBe('line');
    });

    it('should generate fill style for polygon geometry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...mockMetadataResponse,
            geometryType: 'esriGeometryPolygon',
          }),
      } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const style = service.defaultStyle;
      expect(style.type).toBe('fill');
    });

    it('should get style asynchronously when metadata is not loaded', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const style = await service.getStyle();
      expect(style.type).toBe('circle');
    });
  });

  describe('Cleanup', () => {
    it('should remove source on cleanup', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.remove();

      expect(mockMap.off).toHaveBeenCalled();
      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });

    it('should also work with destroySource alias', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.destroySource();

      expect(mockMap.removeSource).toHaveBeenCalledWith('test-source');
    });

    it('should remove layers using this source', async () => {
      mockMap.getStyle = jest.fn().mockReturnValue({
        layers: [
          { id: 'layer-1', source: 'test-source' },
          { id: 'layer-2', source: 'other-source' },
        ],
      });
      mockMap.getLayer = jest.fn().mockReturnValue({});

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.remove();

      expect(mockMap.removeLayer).toHaveBeenCalledWith('layer-1');
      expect(mockMap.removeLayer).not.toHaveBeenCalledWith('layer-2');
    });
  });

  describe('Legacy Method Compatibility', () => {
    it('should call updateSource as refresh', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      // Should not throw
      service.updateSource();
    });

    it('should warn on setLayers call', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.setLayers([0, 1]);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not applicable'));

      consoleSpy.mockRestore();
    });

    it('should handle setBoundingBoxFilter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      service.setBoundingBoxFilter(false);
      expect(mockMap.off).toHaveBeenCalled();

      service.setBoundingBoxFilter(true);
      expect(mockMap.on).toHaveBeenCalled();
    });
  });

  describe('Getters', () => {
    it('should provide service metadata getter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(service.serviceMetadata).toBeDefined();
      expect(service.serviceMetadata?.name).toBe('TestLayer');
    });

    it('should provide source getter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(service._source).toBeDefined();
    });

    it('should provide URL getter', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      expect(service._url).toBe(
        'https://example.com/arcgis/rest/services/TestService/FeatureServer/0'
      );
    });
  });

  describe('Editing and AGOL Support', () => {
    const mockFeature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-118.2, 34.0] },
      properties: { NAME: 'Test Feature' },
    };

    it('should add features', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => ({ addResults: [{ objectId: 1, success: true }] }),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.addFeatures([mockFeature]);
      expect(result).toEqual([{ objectId: 1, success: true }]);

      const addCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('/addFeatures')
      );
      expect(addCall).toBeDefined();
    });

    it('should update features', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => ({ updateResults: [{ objectId: 1, success: true }] }),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.updateFeatures([mockFeature]);
      expect(result).toEqual([{ objectId: 1, success: true }]);

      const updateCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('/updateFeatures')
      );
      expect(updateCall).toBeDefined();
    });

    it('should delete features', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            deleteResults: [
              { objectId: 1, success: true },
              { objectId: 2, success: true },
            ],
          }),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.deleteFeatures({ objectIds: [1, 2] });
      expect(result).toEqual([
        { objectId: 1, success: true },
        { objectId: 2, success: true },
      ]);

      const deleteCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('/deleteFeatures')
      );
      expect(deleteCall).toBeDefined();
    });

    it('should apply edits', async () => {
      const applyEditsResponse = {
        addResults: [{ objectId: 10, success: true }],
        deleteResults: [{ objectId: 1, success: true }],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => applyEditsResponse,
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.applyEdits({ adds: [mockFeature], deletes: [1] });
      expect(result).toEqual(applyEditsResponse);

      const applyCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('/applyEdits')
      );
      expect(applyCall).toBeDefined();
    });

    it('should handle AGOL error responses in editing methods', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => ({ error: { code: 400, message: 'Invalid input' } }),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      await expect(service.addFeatures([mockFeature])).rejects.toThrow('Invalid input');
    });

    it('should support on/off event listener methods', async () => {
      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const handler = jest.fn();
      const returnedService = service.on('authenticationrequired', handler);
      expect(returnedService).toBe(service);

      // Verify off removes the listener and returns the service
      const returnedFromOff = service.off('authenticationrequired', handler);
      expect(returnedFromOff).toBe(service);
    });

    it('should query attachments', async () => {
      const attachmentInfos = [
        { id: 1, name: 'photo.jpg', contentType: 'image/jpeg', size: 12345 },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => ({ attachmentInfos }),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.queryAttachments(42);
      expect(result).toEqual(attachmentInfos);

      const attachCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('/42/attachments')
      );
      expect(attachCall).toBeDefined();
    });

    it('should delete attachments', async () => {
      const deleteAttachmentResults = [
        { objectId: 5, success: true },
        { objectId: 6, success: true },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response)
        .mockResolvedValue({
          ok: true,
          json: async () => ({ deleteAttachmentResults }),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const result = await service.deleteAttachments(42, [5, 6]);
      expect(result).toEqual(deleteAttachmentResults);

      const deleteAttachCall = mockFetch.mock.calls.find(call =>
        (call[0] as string).includes('/42/deleteAttachments')
      );
      expect(deleteAttachCall).toBeDefined();
    });
  });

  describe('Advanced Query Options', () => {
    it('should handle query with ordering and statistics', async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      await service.queryFeatures({
        orderByFields: 'POPULATION DESC',
        groupByFieldsForStatistics: 'STATE_NAME',
        outStatistics: [{ statisticType: 'sum', onStatisticField: 'POPULATION' }],
        having: 'SUM_POPULATION > 1000000',
        resultOffset: 10,
        resultRecordCount: 50,
        token: 'test-token',
      });

      // Find the explicit query call (contains orderByFields and f=geojson)
      const queryCall = mockFetch.mock.calls.find(
        call =>
          (call[0] as string).includes('/query?') && (call[0] as string).includes('orderByFields=')
      );
      expect(queryCall).toBeDefined();
      const callUrl = queryCall![0] as string;
      expect(callUrl).toContain('orderByFields=POPULATION');
      expect(callUrl).toContain('groupByFieldsForStatistics=STATE_NAME');
      expect(callUrl).toContain('outStatistics=');
      expect(callUrl).toContain('having=SUM_POPULATION');
      expect(callUrl).toContain('resultOffset=10');
      expect(callUrl).toContain('resultRecordCount=50');
      expect(callUrl).toContain('token=test-token');
    });

    it('should handle query with geometry filter', async () => {
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadataResponse),
        } as Response);

      const service = new FeatureService('test-source', mockMap as Map, mockServiceOptions);
      await service.sourceReady;

      const geometry = {
        x: -118.2437,
        y: 34.0522,
        spatialReference: { wkid: 4326 },
      };

      await service.queryFeatures({
        geometry,
        geometryType: 'esriGeometryPoint',
        spatialRel: 'esriSpatialRelIntersects',
        inSR: '4326',
        outSR: '3857',
      });

      // Find the explicit query call with geometryType=esriGeometryPoint (not envelope)
      const queryCall = mockFetch.mock.calls.find(
        call =>
          (call[0] as string).includes('/query?') &&
          (call[0] as string).includes('esriGeometryPoint')
      );
      expect(queryCall).toBeDefined();
      const callUrl = queryCall![0] as string;
      expect(callUrl).toContain('geometry=');
      expect(callUrl).toContain('geometryType=esriGeometryPoint');
      expect(callUrl).toContain('spatialRel=esriSpatialRelIntersects');
      expect(callUrl).toContain('inSR=4326');
      expect(callUrl).toContain('outSR=3857');
    });
  });
});
