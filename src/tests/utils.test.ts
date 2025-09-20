import { cleanTrailingSlash, getServiceDetails, updateAttribution } from '@/utils';
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

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/MapServer?f=json', {});
      expect(result).toEqual(mockMetadata);
    });

    it('should pass custom fetch options', async () => {
      const mockMetadata = { serviceDescription: 'Test' };
      const fetchOptions = {
        method: 'POST',
        headers: { Authorization: 'Bearer token123' },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      await getServiceDetails('https://example.com/MapServer', fetchOptions);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/MapServer?f=json', fetchOptions);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(getServiceDetails('https://example.com/MapServer')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Service not found' }),
      } as Response);

      // Should still resolve with the error response
      const result = await getServiceDetails('https://example.com/MapServer');
      expect(result).toEqual({ error: 'Service not found' });
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

    it('should handle empty URL', async () => {
      const mockMetadata = {};

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      await getServiceDetails('');

      expect(mockFetch).toHaveBeenCalledWith('?f=json', {});
    });
  });

  describe('updateAttribution', () => {
    let mockMap: Partial<Map>;
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

    it('should warn when source is not found', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mapWithSourceCaches = mockMap as unknown as Map & { style: MockMapStyle };
      delete mapWithSourceCaches.style.sourceCaches['test-source'];

      updateAttribution('New Attribution', 'nonexistent-source', mockMap as Map);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Source nonexistent-source not found when trying to update attribution'
      );
      expect(mockAttributionController._updateAttributions).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should handle undefined map style', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mapWithUndefinedStyle = { ...mockMap, style: undefined } as unknown as Map;

      // The function should handle undefined style gracefully and warn about missing source
      expect(() => {
        updateAttribution('New Attribution', 'test-source', mapWithUndefinedStyle);
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Source test-source not found when trying to update attribution'
      );
      consoleWarnSpy.mockRestore();
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

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/MapServer?f=json', {});
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
