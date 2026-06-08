/**
 * Shared request + authentication adapter built on `@esri/arcgis-rest-request`.
 *
 * Every network call in esri-gl that talks to an ArcGIS REST endpoint flows
 * through this module so that authentication, error handling and parameter
 * encoding are handled once by the official ArcGIS REST JS client instead of
 * the bespoke `fetch` wrappers this library used to ship.
 */
import {
  request,
  ApiKeyManager,
  ArcGISIdentityManager,
  type IAuthenticationManager,
  type IRequestOptions,
} from '@esri/arcgis-rest-request';

export { ApiKeyManager, ArcGISIdentityManager };
export type { IAuthenticationManager };

/**
 * Authentication accepted throughout esri-gl. Either an ArcGIS REST JS
 * authentication manager (`ApiKeyManager`, `ArcGISIdentityManager`, …) or a
 * raw token/API-key string for convenience.
 */
export type EsriAuthentication = IAuthenticationManager | string;

/**
 * Options every service/task accepts for authenticating ArcGIS REST requests.
 * `authentication` takes precedence, then `apiKey`, then `token`.
 */
export interface EsriAuthOptions {
  /** An ArcGIS REST JS authentication manager. */
  authentication?: EsriAuthentication;
  /** A static API key (ArcGIS Location Platform). */
  apiKey?: string;
  /** A static, pre-generated token. */
  token?: string;
}

/**
 * Normalise the various auth inputs into an `IAuthenticationManager` (or
 * `undefined` for anonymous requests). A bare string is wrapped in an
 * `ApiKeyManager` so it is sent as the `token` parameter, matching ArcGIS REST
 * conventions.
 */
export function resolveAuthentication(
  options: EsriAuthOptions | undefined
): IAuthenticationManager | undefined {
  if (!options) return undefined;

  const { authentication, apiKey, token } = options;

  if (authentication) {
    return typeof authentication === 'string'
      ? ApiKeyManager.fromKey(authentication)
      : authentication;
  }

  const key = apiKey ?? token;
  return key ? ApiKeyManager.fromKey(key) : undefined;
}

export interface EsriRequestOptions extends EsriAuthOptions {
  /** Query/body parameters. `f: 'json'` is supplied by default. */
  params?: Record<string, unknown>;
  /** HTTP method. ArcGIS REST JS defaults to POST; most reads use GET. */
  httpMethod?: 'GET' | 'POST';
  /** Return the raw `Response` instead of the parsed body (e.g. for PBF). */
  rawResponse?: boolean;
  /** Abort signal for cancellation/timeout support. */
  signal?: AbortSignal;
  /** Additional request headers. */
  headers?: Record<string, string>;
}

/**
 * Thin wrapper over `@esri/arcgis-rest-request`'s `request()` that applies
 * esri-gl's auth resolution and sensible defaults. Throws `ArcGISRequestError`
 * (and friends) on ArcGIS service-level or HTTP errors.
 */
export function esriRequest<T = unknown>(
  url: string,
  options: EsriRequestOptions = {}
): Promise<T> {
  const { params, httpMethod, rawResponse, signal, headers, ...auth } = options;

  const requestOptions: IRequestOptions = {
    params: { f: 'json', ...params },
    authentication: resolveAuthentication(auth),
  };

  if (httpMethod) requestOptions.httpMethod = httpMethod;
  if (rawResponse) requestOptions.rawResponse = true;
  if (signal) requestOptions.signal = signal;
  if (headers) requestOptions.headers = headers;

  return request(url, requestOptions) as Promise<T>;
}
