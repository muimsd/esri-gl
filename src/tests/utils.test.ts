import { cleanTrailingSlash, getServiceDetails, isAbortError, updateAttribution } from '@/utils';
import type { Map } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock interfaces for testing
interface MockAttributionController {
  _attribHTML: string; // This is the key property that updateAttribution looks for
  options: {
    customAttribution: string | string[] | undefined;
  };
  _updateAttributions: jest.MockedFunction<() => void>;
}

interface MockSourceCache {
  _source: {
    attribution: string;
  };
}

interface MockMapStyle {
  sourceCaches: Record<string, MockSourceCache>;
  _otherSourceCaches?: Record<string, MockSourceCache>;
}

describe('Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cleanTrailingSlash', () => {
    it('should remove trailing slash from URL', () => {
      expect(cleanTrailingSlash('https://example.com/')).toBe('https://example.com');
      expect(cleanTrailingSlash('https://example.com/path/')).toBe('https://example.com/path');
    });

    it('should not modify URL without trailing slash', () => {
      expect(cleanTrailingSlash('https://example.com')).toBe('https://example.com');
      expect(cleanTrailingSlash('https://example.com/path')).toBe('https://example.com/path');
    });

    it('should handle empty string', () => {
      expect(cleanTrailingSlash('')).toBe('');
    });

    it('should handle multiple trailing slashes', () => {
      expect(cleanTrailingSlash('https://example.com///')).toBe('https://example.com//');
    });

    it('should handle root path only', () => {
      expect(cleanTrailingSlash('/')).toBe('');
    });
  });

  describe('isAbortError', () => {
    it('should return false for null or undefined', () => {
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });

    it('should detect DOMException with AbortError name', () => {
      const error = new DOMException('The operation was aborted', 'AbortError');
      expect(isAbortError(error)).toBe(true);
    });

    it('should detect Error with AbortError name', () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      expect(isAbortError(error)).toBe(true);
    });

    it('should detect error message containing abort', () => {
      const error = new Error('The request was aborted');
      expect(isAbortError(error)).toBe(true);
    });

    it('should detect error-like objects with AbortError name', () => {
      const error = { name: 'AbortError', message: 'Aborted' };
      expect(isAbortError(error)).toBe(true);
    });

    it('should detect string errors containing abort', () => {
      expect(isAbortError('AbortError')).toBe(true);
      expect(isAbortError('Request was aborted')).toBe(true);
    });

    it('should return false for non-abort errors', () => {
      expect(isAbortError(new Error('Network error'))).toBe(false);
      expect(isAbortError({ name: 'TypeError', message: 'Type error' })).toBe(false);
      expect(isAbortError('Some other error')).toBe(false);
    });
  });

  describe('getServiceDetails', () => {
    it('should fetch service metadata successfully', async () => {
      const mockMetadata = {
        serviceDescription: 'Test Service',
        copyrightText: 'Test Copyright',
        layers: [
          { id: 0, name: 'Layer 0' },
          { id: 1, name: 'Layer 1' },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      const result = await getServiceDetails('https://example.com/MapServer');

      // Requests now flow through @esri/arcgis-rest-request; the URL always
      // carries f=json and fetch options are managed by the client.
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/MapServer?f=json',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockMetadata);
    });

    it('should pass authentication options', async () => {
      const mockMetadata = { serviceDescription: 'Test' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      // The signature is now getServiceDetails(url, { token?, apiKey?, authentication? }).
      const result = await getServiceDetails('https://example.com/MapServer', {
        apiKey: 'my-api-key',
      });

      const fetchUrl = mockFetch.mock.calls[0][0] as string;
      expect(fetchUrl).toContain('f=json');
      expect(fetchUrl).toContain('token=my-api-key');
      expect(result).toEqual(mockMetadata);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(getServiceDetails('https://example.com/MapServer')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle HTTP errors', async () => {
      // arcgis-rest reads the error body, so the mock must provide json().
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({}),
      } as Response);

      // arcgis-rest throws an ArcGISRequestError whose message/code reflect the HTTP status.
      await expect(getServiceDetails('https://example.com/MapServer')).rejects.toMatchObject({
        code: 'HTTP 404',
      });
    });

    it('should handle ESRI error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ error: { code: 400, message: 'Service not found' } }),
      } as Response);

      // ESRI JSON errors throw an ArcGISRequestError; the message is prefixed with the code.
      await expect(getServiceDetails('https://example.com/MapServer')).rejects.toThrow(
        'Service not found'
      );
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(getServiceDetails('https://example.com/MapServer')).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should include token in fetch URL when provided', async () => {
      const mockMetadata = { serviceDescription: 'Test' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      await getServiceDetails('https://example.com/MapServer', { token: 'my-token' });

      const fetchUrl = mockFetch.mock.calls[0][0] as string;
      expect(fetchUrl).toContain('token=my-token');
    });

    it('should handle empty URL', async () => {
      const mockMetadata = {};

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      await getServiceDetails('');

      expect(mockFetch).toHaveBeenCalledWith('?f=json', expect.objectContaining({ method: 'GET' }));
    });
  });

  describe('updateAttribution', () => {
    let mockMap: any;
    let mockAttributionController: MockAttributionController;
    let mockSourceCache: MockSourceCache;

    beforeEach(() => {
      mockSourceCache = {
        _source: {
          attribution: 'Original Attribution',
        },
      };

      mockAttributionController = {
        _attribHTML: '<div>Attribution</div>',
        options: {
          customAttribution: undefined,
        },
        _updateAttributions: jest.fn(),
      };

      mockMap = {
        _controls: [mockAttributionController],
        style: {
          sourceCaches: {
            'test-source': mockSourceCache,
          },
        },
      } as unknown as Map;
    });

    it('should add Esri attribution when no custom attribution exists', () => {
      updateAttribution('New Attribution', 'test-source', mockMap as Map);

      expect(mockAttributionController.options.customAttribution).toBe(
        'Powered by <a href="https://www.esri.com">Esri</a>'
      );
      expect(mockSourceCache._source.attribution).toBe('New Attribution');
      expect(mockAttributionController._updateAttributions).toHaveBeenCalled();
    });

    it('should append Esri attribution to existing string attribution', () => {
      mockAttributionController.options.customAttribution = 'Existing Attribution';

      updateAttribution('New Attribution', 'test-source', mockMap as Map);

      expect(mockAttributionController.options.customAttribution).toBe(
        'Existing Attribution | Powered by <a href="https://www.esri.com">Esri</a>'
      );
    });

    it('should not duplicate Esri attribution in string when called multiple times', () => {
      mockAttributionController.options.customAttribution = 'Existing Attribution';

      updateAttribution('Attribution 1', 'test-source', mockMap as Map);
      updateAttribution('Attribution 2', 'test-source', mockMap as Map);

      const attribution = mockAttributionController.options.customAttribution as string;
      const matches = attribution.match(/Powered by/g);
      expect(matches).toHaveLength(1);
    });

    it('should add Esri attribution to array attribution if not present', () => {
      mockAttributionController.options.customAttribution = ['Attribution 1', 'Attribution 2'];

      updateAttribution('New Attribution', 'test-source', mockMap as Map);

      expect(mockAttributionController.options.customAttribution).toEqual([
        'Attribution 1',
        'Attribution 2',
        'Powered by <a href="https://www.esri.com">Esri</a>',
      ]);
    });

    it('should not duplicate Esri attribution in array', () => {
      mockAttributionController.options.customAttribution = [
        'Attribution 1',
        'Powered by <a href="https://www.esri.com">Esri</a>',
      ];

      updateAttribution('New Attribution', 'test-source', mockMap as Map);

      expect(mockAttributionController.options.customAttribution).toEqual([
        'Attribution 1',
        'Powered by <a href="https://www.esri.com">Esri</a>',
      ]);
    });

    it('should handle missing attribution controller gracefully', () => {
      mockMap._controls = [];

      // Should not throw error
      expect(() => {
        updateAttribution('New Attribution', 'test-source', mockMap as Map);
      }).not.toThrow();
    });

    it('should handle source in _otherSourceCaches', () => {
      const mapWithOtherCaches = mockMap as unknown as Map & { style: MockMapStyle };
      delete mapWithOtherCaches.style.sourceCaches['test-source'];
      mapWithOtherCaches.style._otherSourceCaches = {
        'test-source': mockSourceCache,
      };

      updateAttribution('New Attribution', 'test-source', mockMap as Map);

      expect(mockSourceCache._source.attribution).toBe('New Attribution');
      expect(mockAttributionController._updateAttributions).toHaveBeenCalled();
    });

    it('should silently skip when source is not found', () => {
      const mapWithSourceCaches = mockMap as unknown as Map & { style: MockMapStyle };
      delete mapWithSourceCaches.style.sourceCaches['test-source'];

      updateAttribution('New Attribution', 'nonexistent-source', mockMap as Map);

      expect(mockAttributionController._updateAttributions).not.toHaveBeenCalled();
    });

    it('should handle undefined map style gracefully', () => {
      const mapWithUndefinedStyle = { ...mockMap, style: undefined } as unknown as Map;

      expect(() => {
        updateAttribution('New Attribution', 'test-source', mapWithUndefinedStyle);
      }).not.toThrow();
    });

    it('should handle missing _controls array', () => {
      mockMap._controls = undefined;

      // Should not throw error
      expect(() => {
        updateAttribution('New Attribution', 'test-source', mockMap as Map);
      }).not.toThrow();
    });
  });

  describe('URL Utilities Integration', () => {
    it('should work with cleanTrailingSlash and getServiceDetails together', async () => {
      const mockMetadata = { serviceDescription: 'Test' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      const cleanedUrl = cleanTrailingSlash('https://example.com/MapServer/');
      const result = await getServiceDetails(cleanedUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/MapServer?f=json',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockMetadata);
    });
  });

  describe('Error Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // cleanTrailingSlash with edge cases
      expect(() => cleanTrailingSlash(null as unknown as string)).toThrow();
      expect(() => cleanTrailingSlash(undefined as unknown as string)).toThrow();
    });

    it('should handle concurrent service detail requests', async () => {
      const mockMetadata1 = { serviceDescription: 'Service 1' };
      const mockMetadata2 = { serviceDescription: 'Service 2' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata1),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata2),
        } as Response);

      const [result1, result2] = await Promise.all([
        getServiceDetails('https://example1.com/MapServer'),
        getServiceDetails('https://example2.com/MapServer'),
      ]);

      expect(result1).toEqual(mockMetadata1);
      expect(result2).toEqual(mockMetadata2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
