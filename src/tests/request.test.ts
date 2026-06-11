import {
  resolveAuthentication,
  esriRequest,
  esriRawRequest,
  ApiKeyManager,
  ArcGISRequestError,
} from '@/request';
import type { IAuthenticationManager } from '@/request';

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

function mockJsonResponse(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  } as Response);
}

describe('request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveAuthentication', () => {
    it('returns undefined for missing or empty options', () => {
      expect(resolveAuthentication(undefined)).toBeUndefined();
      expect(resolveAuthentication({})).toBeUndefined();
    });

    it('wraps a token string in an ApiKeyManager', async () => {
      const manager = resolveAuthentication({ token: 'my-token' });
      expect(manager).toBeInstanceOf(ApiKeyManager);
      await expect(manager?.getToken('https://example.com')).resolves.toBe('my-token');
    });

    it('prefers apiKey over token', async () => {
      const manager = resolveAuthentication({ apiKey: 'the-key', token: 'the-token' });
      await expect(manager?.getToken('https://example.com')).resolves.toBe('the-key');
    });

    it('prefers authentication over apiKey and token, wrapping bare strings', async () => {
      const wrapped = resolveAuthentication({ authentication: 'auth-string', apiKey: 'ignored' });
      await expect(wrapped?.getToken('https://example.com')).resolves.toBe('auth-string');

      const manager: IAuthenticationManager = {
        portal: 'https://example.com/sharing/rest',
        getToken: () => Promise.resolve('managed'),
      };
      expect(resolveAuthentication({ authentication: manager, token: 'ignored' })).toBe(manager);
    });
  });

  describe('esriRequest', () => {
    it('sends f=json plus params and resolves the parsed body', async () => {
      mockJsonResponse({ name: 'Test Layer' });

      const result = await esriRequest<{ name: string }>('https://example.com/MapServer', {
        params: { layers: 'show:0' },
      });

      expect(result).toEqual({ name: 'Test Layer' });
      const [url, init] = mockFetch.mock.calls[0];
      const sent = `${url}${String(init?.body ?? '')}`;
      expect(sent).toContain('f=json');
      expect(sent).toContain('layers=');
    });

    it('applies resolved authentication as a token parameter', async () => {
      mockJsonResponse({ ok: true });

      await esriRequest('https://example.com/MapServer', { token: 'secret' });

      const [url, init] = mockFetch.mock.calls[0];
      const sent = `${url}${String(init?.body ?? '')}`;
      expect(sent).toContain('token=secret');
    });

    it('supports GET requests with params in the query string', async () => {
      mockJsonResponse({ ok: true });

      await esriRequest('https://example.com/MapServer', {
        httpMethod: 'GET',
        params: { layers: 'show:0' },
      });

      const [url] = mockFetch.mock.calls[0];
      expect(String(url)).toContain('f=json');
      expect(String(url)).toContain('layers=');
    });

    it('rejects with ArcGISRequestError on ArcGIS service errors', async () => {
      mockJsonResponse({ error: { code: 499, message: 'Token Required' } });

      const promise = esriRequest('https://example.com/MapServer');
      await expect(promise).rejects.toBeInstanceOf(ArcGISRequestError);
      await expect(promise).rejects.toMatchObject({ code: 499 });
    });
  });

  describe('esriRawRequest', () => {
    it('builds the query string, JSON-encoding objects and skipping null/undefined', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      await esriRawRequest('https://example.com/exportImage', {
        params: {
          f: 'image',
          bbox: [1, 2, 3, 4],
          renderingRule: { rasterFunction: 'None' },
          skip: null,
          missing: undefined,
        },
      });

      const [url] = mockFetch.mock.calls[0];
      const params = new URLSearchParams(String(url).split('?')[1]);
      expect(params.get('f')).toBe('image');
      expect(params.get('bbox')).toBe('[1,2,3,4]');
      expect(params.get('renderingRule')).toBe('{"rasterFunction":"None"}');
      expect(params.has('skip')).toBe(false);
      expect(params.has('missing')).toBe(false);
    });

    it('appends a token from the resolved authentication', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

      await esriRawRequest('https://example.com/tile/0/0/0', { apiKey: 'raw-key' });

      const [url] = mockFetch.mock.calls[0];
      expect(new URLSearchParams(String(url).split('?')[1]).get('token')).toBe('raw-key');
    });

    it('falls back to an anonymous request when getToken fails', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);
      const failing: IAuthenticationManager = {
        portal: 'https://example.com/sharing/rest',
        getToken: () => Promise.reject(new Error('no session')),
      };

      await esriRawRequest('https://example.com/tile/0/0/0', { authentication: failing });

      const [url] = mockFetch.mock.calls[0];
      expect(new URLSearchParams(String(url).split('?')[1]).has('token')).toBe(false);
    });

    it('forwards signal and headers and throws on HTTP errors', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);
      const controller = new AbortController();
      const headers = { Accept: 'application/x-protobuf' };

      await esriRawRequest('https://example.com/tile/0/0/0', {
        signal: controller.signal,
        headers,
      });
      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
        headers,
      });

      mockFetch.mockResolvedValue({ ok: false, status: 503 } as Response);
      await expect(esriRawRequest('https://example.com/tile/0/0/0')).rejects.toThrow(
        'Request failed: HTTP 503'
      );
    });
  });
});
