/**
 * Resolve a service `url` that may be either a full ArcGIS service URL **or** a
 * portal item id.
 *
 * Every esri-gl service/task accepts an item id wherever it accepts a service
 * url, so this helper is the single place that decides which one was supplied
 * and turns an item id into the item's underlying service url via
 * `@esri/arcgis-rest-portal`.
 */
import { getItem } from '@esri/arcgis-rest-portal';
import { resolveAuthentication, type EsriAuthOptions } from '@/request';
import { cleanTrailingSlash } from '@/utils';

/** A bare 32-character hex ArcGIS portal item id (no scheme / slashes). */
const PORTAL_ITEM_ID_RE = /^[0-9a-f]{32}$/i;

/**
 * True when `value` looks like an ArcGIS portal item id (a 32-character hex
 * string) rather than a service URL. Service URLs always contain a `/`, so the
 * two never collide.
 */
export function isPortalItemId(value: string): boolean {
  return PORTAL_ITEM_ID_RE.test(value.trim());
}

/** True when a Feature Service url already points at a specific sublayer. */
export function urlHasLayerIndex(url: string): boolean {
  return /\/\d+$/.test(cleanTrailingSlash(url));
}

export interface ResolveServiceUrlOptions extends EsriAuthOptions {
  /** Portal sharing REST URL. Defaults to ArcGIS Online. */
  portal?: string;
}

/**
 * Resolve a `url` that is either a full ArcGIS service URL or a portal item id.
 *
 * - A URL is returned as-is (trailing slash trimmed).
 * - A 32-character item id is fetched with `getItem` and resolved to the item's
 *   `url` (the underlying service endpoint).
 *
 * @throws if the portal item has no service url.
 */
export async function resolveServiceUrl(
  urlOrItemId: string,
  options?: ResolveServiceUrlOptions
): Promise<string> {
  if (!isPortalItemId(urlOrItemId)) return cleanTrailingSlash(urlOrItemId);

  const authentication = resolveAuthentication(options);
  const item = await getItem(urlOrItemId, {
    ...(authentication ? { authentication } : {}),
    ...(options?.portal ? { portal: options.portal } : {}),
  });

  if (!item.url) {
    throw new Error(`Portal item ${urlOrItemId} ("${item.title}") has no service url.`);
  }
  return cleanTrailingSlash(item.url);
}
