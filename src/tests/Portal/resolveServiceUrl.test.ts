import { getItem } from '@esri/arcgis-rest-portal';
import { isPortalItemId, resolveServiceUrl, urlHasLayerIndex } from '@/Portal/resolveServiceUrl';

jest.mock('@esri/arcgis-rest-portal', () => ({
  ...jest.requireActual('@esri/arcgis-rest-portal'),
  getItem: jest.fn(),
}));

const mockGetItem = getItem as jest.MockedFunction<typeof getItem>;

const ITEM_ID = 'd5e02a0c1f2b4ec399823fdd3c2fdebd';
const SERVICE_URL = 'https://example.com/arcgis/rest/services/Test/MapServer';

describe('isPortalItemId', () => {
  it('accepts a 32-character hex id (any case, surrounding whitespace)', () => {
    expect(isPortalItemId(ITEM_ID)).toBe(true);
    expect(isPortalItemId(ITEM_ID.toUpperCase())).toBe(true);
    expect(isPortalItemId(`  ${ITEM_ID}  `)).toBe(true);
  });

  it('rejects service urls and malformed ids', () => {
    expect(isPortalItemId(SERVICE_URL)).toBe(false);
    expect(isPortalItemId(`${SERVICE_URL}/0`)).toBe(false);
    expect(isPortalItemId(ITEM_ID.slice(0, 31))).toBe(false); // too short
    expect(isPortalItemId(`${ITEM_ID}ab`)).toBe(false); // too long
    expect(isPortalItemId('d5e02a0c-1f2b-4ec3-9982-3fdd3c2fdebd')).toBe(false); // dashes
    expect(isPortalItemId('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false); // non-hex
  });
});

describe('urlHasLayerIndex', () => {
  it('detects a trailing sublayer index', () => {
    expect(urlHasLayerIndex(`${SERVICE_URL}/0`)).toBe(true);
    expect(urlHasLayerIndex(`${SERVICE_URL}/12/`)).toBe(true);
    expect(urlHasLayerIndex(SERVICE_URL)).toBe(false);
  });
});

describe('resolveServiceUrl', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a url untouched (trailing slash trimmed) without hitting the portal', async () => {
    const resolved = await resolveServiceUrl(`${SERVICE_URL}/`);
    expect(resolved).toBe(SERVICE_URL);
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it('resolves a portal item id to the item service url', async () => {
    mockGetItem.mockResolvedValue({ id: ITEM_ID, url: `${SERVICE_URL}/` } as never);

    const resolved = await resolveServiceUrl(ITEM_ID);

    expect(mockGetItem).toHaveBeenCalledWith(ITEM_ID, expect.any(Object));
    expect(resolved).toBe(SERVICE_URL);
  });

  it('forwards portal + authentication to getItem', async () => {
    mockGetItem.mockResolvedValue({ id: ITEM_ID, url: SERVICE_URL } as never);

    await resolveServiceUrl(ITEM_ID, { token: 'abc', portal: 'https://my.portal/sharing/rest' });

    const [, opts] = mockGetItem.mock.calls[0];
    expect(opts).toMatchObject({ portal: 'https://my.portal/sharing/rest' });
    expect((opts as { authentication?: unknown }).authentication).toBeDefined();
  });

  it('throws when the resolved item has no service url', async () => {
    mockGetItem.mockResolvedValue({ id: ITEM_ID, title: 'No URL Item' } as never);

    await expect(resolveServiceUrl(ITEM_ID)).rejects.toThrow(/has no service url/);
  });
});
