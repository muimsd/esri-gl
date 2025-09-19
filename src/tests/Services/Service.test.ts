import { Service } from '../../Services/Service';
import type { ServiceOptions } from '../../Services/Service';
import type { Map } from '../../types';

// Extend Service class for testing to access protected properties
class TestableService extends Service {
  get testOptions() {
    return this.options;
  }
  
  get testServiceMetadata() {
    return this._serviceMetadata;
  }
  
  set testServiceMetadata(metadata) {
    this._serviceMetadata = metadata;
  }
  
  get testMap() {
    return this._map;
  }
  
  set testMap(map) {
    this._map = map;
  }
  
  get testAuthenticating() {
    return this._authenticating;
  }
  
  set testAuthenticating(auth: boolean) {
    this._authenticating = auth;
  }
  
  get testRequestQueue() {
    return this._requestQueue;
  }
}

// Global fetch mock
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock utils
jest.mock('../../utils', () => ({
  cleanTrailingSlash: jest.fn((url: string) => url.replace(/\/$/, '')),
  updateAttribution: jest.fn(),
}));

const { cleanTrailingSlash, updateAttribution } = require('../../utils');

const createMockMap = (): Partial<Map> => ({
  addSource: jest.fn(),
  removeSource: jest.fn(),
  getSource: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  setBearing: jest.fn(),
  getBounds: jest.fn().mockReturnValue({
    getWest: () => -180,
    getEast: () => 180,
    getNorth: () => 90,
    getSouth: () => -90,
  }),
  project: jest.fn().mockReturnValue({ x: 100, y: 100 }),
  unproject: jest.fn().mockReturnValue({ lng: -95, lat: 40 })
});

describe('Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Constructor', () => {
    it('should create a service with required URL', () => {
      const service = new TestableService({ url: 'https://example.com/arcgis/rest/services' });
      expect(service).toBeInstanceOf(Service);
      expect(service.testOptions.url).toBe('https://example.com/arcgis/rest/services');
    });

    it('should throw error if URL is not provided', () => {
      expect(() => new TestableService({} as ServiceOptions)).toThrow('A url must be supplied as part of the service options.');
    });

    it('should set default options', () => {
      const service = new TestableService({ url: 'https://example.com/test' });
      expect(service.testOptions.proxy).toBe(false);
      expect(service.testOptions.useCors).toBe(true);
      expect(service.testOptions.timeout).toBe(0);
      expect(service.testOptions.getAttributionFromService).toBe(true);
    });

    it('should merge provided options with defaults', () => {
      const service = new TestableService({
        url: 'https://example.com/test',
        proxy: true,
        useCors: false,
        timeout: 5000,
        token: 'test-token',
        getAttributionFromService: false
      });

      expect(service.testOptions.proxy).toBe(true);
      expect(service.testOptions.useCors).toBe(false);
      expect(service.testOptions.timeout).toBe(5000);
      expect(service.testOptions.token).toBe('test-token');
      expect(service.testOptions.getAttributionFromService).toBe(false);
    });

    it('should clean trailing slash from URL', () => {
      new TestableService({ url: 'https://example.com/test/' });
      expect(cleanTrailingSlash).toHaveBeenCalledWith('https://example.com/test/');
    });
  });

  describe('HTTP Methods', () => {
    let service: TestableService;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
    });

    describe('get()', () => {
      it('should make GET request with no parameters', async () => {
        await service.get('/layers');

        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/test/layers?'
        );
      });

      it('should make GET request with parameters', async () => {
        await service.get('/layers', { f: 'json', where: "STATE_NAME='California'" });

        const expectedUrl = 'https://example.com/test/layers?f=json&where=STATE_NAME%3D%27California%27';
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      });

      it('should handle array parameters', async () => {
        await service.get('/query', { outFields: ['NAME', 'POP'], f: 'json' });

        const expectedUrl = 'https://example.com/test/query?outFields=NAME%2CPOP&f=json';
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      });

      it('should handle object parameters', async () => {
        await service.get('/query', { 
          geometry: { xmin: -180, ymin: -90, xmax: 180, ymax: 90 },
          f: 'json'
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('geometry=%7B%22xmin%22%3A-180%2C%22ymin%22%3A-90%2C%22xmax%22%3A180%2C%22ymax%22%3A90%7D')
        );
      });

      it('should include token in parameters', async () => {
        service.testOptions.token = 'test-token';
        await service.get('/layers', { f: 'json' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('token=test-token')
        );
      });

      it('should include request parameters', async () => {
        service.testOptions.requestParams = { customParam: 'customValue' };
        await service.get('/layers', { f: 'json' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('customParam=customValue')
        );
      });
    });

    describe('post()', () => {
      it('should make POST request with FormData', async () => {
        await service.post('/query', { where: "1=1", f: 'json' });

        expect(mockFetch).toHaveBeenCalledWith(
          'https://example.com/test/query',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });

      it('should handle object parameters in POST body', async () => {
        const geometry = { xmin: -180, ymin: -90, xmax: 180, ymax: 90 };
        await service.post('/query', { geometry, f: 'json' });

        const call = mockFetch.mock.calls[0];
        const formData = call[1]?.body as FormData;
        expect(formData.get('geometry')).toBe(JSON.stringify(geometry));
      });

      it('should include token in POST body', async () => {
        service.testOptions.token = 'test-token';
        await service.post('/query', { f: 'json' });

        const call = mockFetch.mock.calls[0];
        const formData = call[1]?.body as FormData;
        expect(formData.get('token')).toBe('test-token');
      });
    });

    describe('request()', () => {
      it('should make GET request with correct parameters', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch');
        await service.request('/layers', { f: 'json' });
        
        expect(fetchSpy).toHaveBeenCalledWith(
          'https://example.com/test/layers?f=json'
        );
      });
    });

    describe('requestWithCallback()', () => {
      it('should handle callback-style requests', (done) => {
        service.requestWithCallback('GET', '/layers', { f: 'json' }, (error, response) => {
          expect(error).toBeUndefined();
          expect(response).toEqual({ success: true });
          done();
        });
      });

      it('should return promise if no callback provided', async () => {
        const result = await service.requestWithCallback('GET', '/layers', { f: 'json' });
        expect(result).toEqual({ success: true });
      });

      it('should handle callback with error', (done) => {
        mockFetch.mockRejectedValue(new Error('Network error'));
        
        service.requestWithCallback('GET', '/layers', { f: 'json' }, (error, response) => {
          expect(error).toBeInstanceOf(Error);
          expect(error?.message).toBe('Network error');
          expect(response).toBeUndefined();
          done();
        });
      });
    });
  });

  describe('Error Handling', () => {
    let service: TestableService;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test' });
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404
      } as Response);

      await expect(service.get('/nonexistent')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      await expect(service.get('/layers')).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as unknown as Response);

      await expect(service.get('/layers')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Metadata Management', () => {
    let service: TestableService;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test' });
    });

    it('should fetch and cache service metadata', async () => {
      const mockMetadata = {
        name: 'Test Service',
        description: 'A test service',
        copyrightText: 'Test Copyright'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetadata
      } as Response);

      const metadata = await service.metadata();
      expect(metadata).toEqual(mockMetadata);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/test?f=json');
    });

    it('should return cached metadata on subsequent calls', async () => {
      const mockMetadata = { name: 'Test Service' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetadata
      } as Response);

      const metadata1 = await service.metadata();
      const metadata2 = await service.metadata();

      expect(metadata1).toBe(metadata2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle metadata fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Metadata fetch failed'));
      await expect(service.metadata()).rejects.toThrow('Metadata fetch failed');
    });
  });

  describe('Authentication', () => {
    let service: TestableService;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test' });
    });

    it('should set authentication token', () => {
      const result = service.authenticate('new-token');
      expect(service.testOptions.token).toBe('new-token');
      expect(result).toBe(service); // Should return service for chaining
    });

    it('should queue requests during authentication', () => {
      // Simulate authentication process
      service.testAuthenticating = true;
      
      const callback = jest.fn();
      service.requestWithCallback('GET', '/secure', { f: 'json' }, callback);
      
      expect(service.testRequestQueue).toHaveLength(1);
      expect(callback).not.toHaveBeenCalled();
      
      // Complete authentication - this should process the queue
      service.authenticate('new-token');
      expect(service.testRequestQueue).toHaveLength(0);
    });

    it('should add authenticate method to authentication errors', (done) => {
      const authError = new Error('Authentication required');
      (authError as Error & { code: number }).code = 498;

      mockFetch.mockRejectedValueOnce(authError);

      service.requestWithCallback('GET', '/secure', { f: 'json' }, (error) => {
        expect(error).toBeDefined();
        const errorWithAuth = error as Error & { authenticate?: (token: string) => void };
        expect(errorWithAuth.authenticate).toBeDefined();
        expect(typeof errorWithAuth.authenticate).toBe('function');
        done();
      });
    });
  });

  describe('Configuration Methods', () => {
    let service: TestableService;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test', timeout: 1000 });
    });

    it('should get timeout value', () => {
      expect(service.getTimeout()).toBe(1000);
    });

    it('should set timeout value', () => {
      const result = service.setTimeout(5000);
      expect(service.getTimeout()).toBe(5000);
      expect(result).toBe(service); // Should return service for chaining
    });
  });

  describe('Attribution Management', () => {
    let service: TestableService;
    let mockMap: Partial<Map>;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test' });
      mockMap = createMockMap();
      service.testMap = mockMap as Map;
    });

    it('should set attribution from cached metadata', async () => {
      const mockMetadata = { copyrightText: 'Test Attribution' };
      service.testServiceMetadata = mockMetadata as Record<string, unknown>;

      await service.setAttributionFromService();
      expect(updateAttribution).toHaveBeenCalledWith('Test Attribution', 'service', mockMap);
    });

    it('should fetch metadata and set attribution', async () => {
      const mockMetadata = { copyrightText: 'Fetched Attribution' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockMetadata
      } as Response);

      await service.setAttributionFromService();
      expect(updateAttribution).toHaveBeenCalledWith('Fetched Attribution', 'service', mockMap);
    });

    it('should handle missing copyright text gracefully', async () => {
      const mockMetadata = { name: 'No Copyright Service' };
      service.testServiceMetadata = mockMetadata as Record<string, unknown>;

      await service.setAttributionFromService();
      expect(updateAttribution).toHaveBeenCalledWith('', 'service', mockMap);
    });

    it('should do nothing if no map is set', async () => {
      service.testMap = undefined;
      await service.setAttributionFromService();
      expect(updateAttribution).not.toHaveBeenCalled();
    });

    it('should handle attribution fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Attribution fetch failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await service.setAttributionFromService();
      expect(consoleSpy).toHaveBeenCalledWith('Could not fetch service attribution:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Event System', () => {
    let service: Service;
    let callback1: jest.Mock;
    let callback2: jest.Mock;

    beforeEach(() => {
      service = new Service({ url: 'https://example.com/test' });
      callback1 = jest.fn();
      callback2 = jest.fn();
    });

    describe('on()', () => {
      it('should add event listener', () => {
        const result = service.on('requeststart', callback1);
        expect(result).toBe(service); // Should return service for chaining
      });

      it('should allow multiple listeners for same event', () => {
        service.on('requeststart', callback1);
        service.on('requeststart', callback2);

        service.fire('requeststart', {
          url: 'https://example.com/test',
          params: {},
          method: 'GET'
        });

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
      });
    });

    describe('off()', () => {
      it('should remove specific event listener', () => {
        service.on('requeststart', callback1);
        service.on('requeststart', callback2);

        const result = service.off('requeststart', callback1);
        expect(result).toBe(service); // Should return service for chaining

        service.fire('requeststart', {
          url: 'https://example.com/test',
          params: {},
          method: 'GET'
        });

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledTimes(1);
      });

      it('should handle removing non-existent listener gracefully', () => {
        service.off('requeststart', callback1); // Should not throw
      });
    });

    describe('fire()', () => {
      it('should fire event with data', () => {
        service.on('requeststart', callback1);
        
        const eventData = {
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          method: 'GET'
        };

        const result = service.fire('requeststart', eventData);
        expect(result).toBe(service); // Should return service for chaining
        expect(callback1).toHaveBeenCalledWith(eventData);
      });

      it('should handle events with no listeners', () => {
        expect(() => {
          service.fire('requeststart', {
            url: 'https://example.com/test',
            params: {},
            method: 'GET'
          });
        }).not.toThrow();
      });
    });

    describe('Request Events', () => {
      beforeEach(() => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true })
        } as Response);
      });

      it('should fire requeststart and requestend events', async () => {
        const startCallback = jest.fn();
        const endCallback = jest.fn();

        service.on('requeststart', startCallback);
        service.on('requestend', endCallback);

        await service.get('/layers', { f: 'json' });

        expect(startCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          method: 'GET'
        });

        expect(endCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          method: 'GET'
        });
      });

      it('should fire requestsuccess event on successful request', async () => {
        const successCallback = jest.fn();
        service.on('requestsuccess', successCallback);

        await service.get('/layers', { f: 'json' });

        expect(successCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          response: { success: true },
          method: 'GET'
        });
      });

      it('should fire requesterror event on failed request', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const errorCallback = jest.fn();
        service.on('requesterror', errorCallback);

        try {
          await service.get('/layers');
        } catch {
          // Expected to throw
        }

        expect(errorCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: {},
          message: 'Network error',
          code: undefined,
          method: 'GET'
        });
      });
    });
  });

  describe('Event System', () => {
    let service: TestableService;
    let callback1: jest.Mock;
    let callback2: jest.Mock;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test' });
      callback1 = jest.fn();
      callback2 = jest.fn();
    });

    describe('on()', () => {
      it('should add event listener', () => {
        const result = service.on('requeststart', callback1);
        expect(result).toBe(service); // Should return service for chaining
      });

      it('should allow multiple listeners for same event', () => {
        service.on('requeststart', callback1);
        service.on('requeststart', callback2);

        service.fire('requeststart', {
          url: 'https://example.com/test',
          params: {},
          method: 'GET'
        });

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
      });
    });

    describe('off()', () => {
      it('should remove specific event listener', () => {
        service.on('requeststart', callback1);
        service.on('requeststart', callback2);

        const result = service.off('requeststart', callback1);
        expect(result).toBe(service); // Should return service for chaining

        service.fire('requeststart', {
          url: 'https://example.com/test',
          params: {},
          method: 'GET'
        });

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledTimes(1);
      });

      it('should handle removing non-existent listener gracefully', () => {
        service.off('requeststart', callback1); // Should not throw
      });
    });

    describe('fire()', () => {
      it('should fire event with data', () => {
        service.on('requeststart', callback1);
        
        const eventData = {
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          method: 'GET'
        };

        const result = service.fire('requeststart', eventData);
        expect(result).toBe(service); // Should return service for chaining
        expect(callback1).toHaveBeenCalledWith(eventData);
      });

      it('should handle events with no listeners', () => {
        expect(() => {
          service.fire('requeststart', {
            url: 'https://example.com/test',
            params: {},
            method: 'GET'
          });
        }).not.toThrow();
      });
    });

    describe('Request Events', () => {
      beforeEach(() => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ success: true })
        } as Response);
      });

      it('should fire requeststart and requestend events', async () => {
        const startCallback = jest.fn();
        const endCallback = jest.fn();

        service.on('requeststart', startCallback);
        service.on('requestend', endCallback);

        await service.get('/layers', { f: 'json' });

        expect(startCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          method: 'GET'
        });

        expect(endCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          method: 'GET'
        });
      });

      it('should fire requestsuccess event on successful request', async () => {
        const successCallback = jest.fn();
        service.on('requestsuccess', successCallback);

        await service.get('/layers', { f: 'json' });

        expect(successCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: { f: 'json' },
          response: { success: true },
          method: 'GET'
        });
      });

      it('should fire requesterror event on failed request', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const errorCallback = jest.fn();
        service.on('requesterror', errorCallback);

        try {
          await service.get('/layers');
        } catch {
          // Expected to throw
        }

        expect(errorCallback).toHaveBeenCalledWith({
          url: 'https://example.com/test/layers',
          params: {},
          message: 'Network error',
          code: undefined,
          method: 'GET'
        });
      });
    });
  });

  describe('Parameter Handling', () => {
    let service: TestableService;

    beforeEach(() => {
      service = new TestableService({ url: 'https://example.com/test' });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
    });

    it('should filter out undefined and null parameters', async () => {
      await service.get('/query', {
        where: '1=1',
        geometry: undefined,
        outFields: null,
        f: 'json'
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('where=1%3D1');
      expect(calledUrl).toContain('f=json');
      expect(calledUrl).not.toContain('geometry');
      expect(calledUrl).not.toContain('outFields');
    });

    it('should handle zero and false values', async () => {
      await service.get('/query', {
        maxRecordCount: 0,
        returnGeometry: false,
        f: 'json'
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('maxRecordCount=0');
      expect(calledUrl).toContain('returnGeometry=false');
    });
  });
});