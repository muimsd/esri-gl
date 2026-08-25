import { Query } from '@/Tasks/Query';
import { Find } from '@/Tasks/Find';
import { IdentifyImage } from '@/Tasks/IdentifyImage';
import { IdentifyFeatures } from '@/Tasks/IdentifyFeatures';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const jsonResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(body),
  }) as unknown as Response;

/** Read the params a task sent, whichever transport it used. */
const lastRequestParams = (): URLSearchParams => {
  const call = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
  const url = call[0] as string;
  const body = (call[1] as RequestInit | undefined)?.body;
  if (typeof body === 'string') return new URLSearchParams(body);
  return new URLSearchParams(url.split('?')[1] ?? '');
};

describe('Task chainable setters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue(jsonResponse({ features: [] }));
  });

  describe('Query', () => {
    it('implements every setter declared on the task', () => {
      const query = new Query('https://example.com/FeatureServer/0') as unknown as Record<
        string,
        unknown
      >;

      for (const method of [
        'fields',
        'offset',
        'limit',
        'precision',
        'featureIds',
        'returnGeometry',
        'returnM',
        'transform',
      ]) {
        expect(typeof query[method]).toBe('function');
      }
    });

    it('maps setter names to their ArcGIS parameters', async () => {
      const query = new Query('https://example.com/FeatureServer/0');

      await query.fields(['NAME', 'POP']).offset(10).limit(25).precision(4).run();

      const params = lastRequestParams();
      expect(params.get('outFields')).toBe('NAME,POP');
      expect(params.get('resultOffset')).toBe('10');
      expect(params.get('resultRecordCount')).toBe('25');
      expect(params.get('geometryPrecision')).toBe('4');
    });

    it('keeps hand-written methods when a setter shares the name', () => {
      const query = new Query('https://example.com/FeatureServer/0');
      // `token` is declared in `setters` but Task implements it directly.
      expect(query.token('abc')).toBe(query);
    });

    it('lets Task-level setters chain into subclass setters', async () => {
      const query = new Query('https://example.com/FeatureServer/0');

      // Task.token()/format() return the polymorphic `this` type, so the chain
      // stays a Query for the compiler as well as at runtime.
      await query.token('abc').format(false).where('POP > 1').fields('NAME').limit(5).run();

      const params = lastRequestParams();
      expect(params.get('where')).toBe('POP > 1');
      expect(params.get('outFields')).toBe('NAME');
      expect(params.get('resultRecordCount')).toBe('5');
      expect(params.get('returnUnformattedValues')).toBe('true');
    });

    it('keeps returnDistinctValues when the query runs', async () => {
      const query = new Query('https://example.com/FeatureServer/0');

      await query.distinct().run();

      expect(lastRequestParams().get('returnDistinctValues')).toBe('true');
    });

    it('drops the return*Only flags from a previous execution mode', async () => {
      const query = new Query('https://example.com/FeatureServer/0');

      mockFetch.mockResolvedValueOnce(jsonResponse({ count: 3 }));
      await query.count();
      await query.run();

      expect(lastRequestParams().get('returnCountOnly')).toBeNull();
    });
  });

  describe('Find', () => {
    it('implements every setter declared on the task', () => {
      const find = new Find('https://example.com/MapServer') as unknown as Record<string, unknown>;

      for (const method of [
        'spatialReference',
        'sr',
        'returnGeometry',
        'maxAllowableOffset',
        'precision',
        'dynamicLayers',
        'returnZ',
        'returnM',
        'gdbVersion',
      ]) {
        expect(typeof find[method]).toBe('function');
      }
    });

    it('does not overwrite the hand-written array-aware setters', () => {
      const find = new Find('https://example.com/MapServer');

      find.fields(['STATE_NAME', 'CITY_NAME']);

      expect((find as unknown as { params: Record<string, unknown> }).params.searchFields).toBe(
        'STATE_NAME,CITY_NAME'
      );
    });

    it('sends the generated setter values', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ results: [] }));
      const find = new Find('https://example.com/MapServer');

      await find.text('CA').spatialReference(3857).returnGeometry(false).run();

      const params = lastRequestParams();
      expect(params.get('sr')).toBe('3857');
      expect(params.get('returnGeometry')).toBe('false');
    });
  });

  describe('IdentifyImage / IdentifyFeatures', () => {
    it('keeps the hand-written pixelSize formatting', () => {
      const task = new IdentifyImage('https://example.com/ImageServer');

      task.pixelSize({ x: 30, y: 30 });

      expect((task as unknown as { params: Record<string, unknown> }).params.pixelSize).toBe(
        '30,30'
      );
    });

    it('exposes the IdentifyFeatures setters', () => {
      const task = new IdentifyFeatures('https://example.com/MapServer') as unknown as Record<
        string,
        unknown
      >;

      for (const method of ['layers', 'precision', 'tolerance', 'returnGeometry']) {
        expect(typeof task[method]).toBe('function');
      }
    });
  });

  describe('apiKey option', () => {
    it('sends an `apiKey` task option as the token parameter', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ results: [] }));

      await new Find({ url: 'https://example.com/MapServer', apiKey: 'AAPK-test' })
        .text('CA')
        .run();

      const call = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const sent = `${call[0] as string}?${String((call[1] as RequestInit | undefined)?.body ?? '')}`;
      expect(sent).toContain('token=AAPK-test');
    });
  });
});
