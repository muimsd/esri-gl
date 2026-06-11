import { cleanTrailingSlash, updateAttribution } from '@/utils';
import { esriRequest } from '@/request';
import type { EsriAuthentication } from '@/request';
import type { Map, ServiceMetadata } from '@/types';

export interface ServiceOptions {
  url: string;
  /** @deprecated The leaflet-style proxy string is no longer applied; configure
   * a proxy through your `authentication` manager or a global fetch override. */
  proxy?: string | boolean;
  useCors?: boolean;
  timeout?: number;
  token?: string;
  requestParams?: Record<string, unknown>;
  getAttributionFromService?: boolean;
  apiKey?: string;
  /** An ArcGIS REST JS authentication manager (takes precedence over token/apiKey). */
  authentication?: EsriAuthentication;
}

export type ServiceCallback<T = unknown> = (error?: Error, response?: T) => void;

export interface ServiceEvents {
  requeststart: { url: string; params: Record<string, unknown>; method: string };
  requestsuccess: {
    url: string;
    params: Record<string, unknown>;
    response: unknown;
    method: string;
  };
  requesterror: {
    url: string;
    params: Record<string, unknown>;
    message: string;
    code?: number;
    method: string;
  };
  requestend: { url: string; params: Record<string, unknown>; method: string };
  authenticationrequired: { authenticate: (token: string) => void };
}

/**
 * Base Service class for ArcGIS REST API services
 * Similar to Esri Leaflet's Service class
 */
export class Service {
  protected options: ServiceOptions & {
    proxy: string | boolean;
    useCors: boolean;
    timeout: number;
    getAttributionFromService: boolean;
  };
  protected _requestQueue: Array<
    [string, string, Record<string, unknown>, (error?: Error, response?: unknown) => void, unknown]
  > = [];
  protected _authenticating: boolean = false;
  protected _serviceMetadata: ServiceMetadata | null = null;
  protected _map?: Map;

  private _eventListeners: Partial<
    Record<keyof ServiceEvents, ((event: ServiceEvents[keyof ServiceEvents]) => void)[]>
  > = {};

  constructor(options: ServiceOptions) {
    if (!options.url) {
      throw new Error('A url must be supplied as part of the service options.');
    }

    this.options = {
      proxy: false,
      useCors: true,
      timeout: 0,
      getAttributionFromService: true,
      ...options,
      url: cleanTrailingSlash(options.url),
    };
  }

  /**
   * Make a GET request
   */
  async get(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._request('GET', path, params);
  }

  /**
   * Make a POST request
   */
  async post(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._request('POST', path, params);
  }

  /**
   * Make a generic request
   */
  async request(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._request('GET', path, params);
  }

  /**
   * Make a request with callback support (public for Tasks)
   */
  requestWithCallback<T = unknown>(
    method: string,
    path: string,
    params: Record<string, unknown>,
    callback?: ServiceCallback<T>
  ): Promise<T> | void {
    if (callback) {
      this._requestWithCallback(method, path, params, callback);
      return;
    }
    return this._request(method, path, params) as Promise<T>;
  }

  /**
   * Get service metadata
   */
  async metadata(): Promise<ServiceMetadata> {
    if (this._serviceMetadata) {
      return this._serviceMetadata;
    }

    try {
      const response = await this._request('GET', '', { f: 'json' });
      this._serviceMetadata = response as ServiceMetadata;
      return this._serviceMetadata;
    } catch (error) {
      const isTestEnvironment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
      if (!isTestEnvironment) {
        console.error('Error fetching service metadata:', error);
      }
      throw error;
    }
  }

  /**
   * Set authentication token
   */
  authenticate(token: string): Service {
    this._authenticating = false;
    this.options.token = token;
    this._runQueue();
    return this;
  }

  /**
   * Get request timeout
   */
  getTimeout(): number {
    return this.options.timeout;
  }

  /**
   * Set request timeout
   */
  setTimeout(timeout: number): Service {
    this.options.timeout = timeout;
    return this;
  }

  /**
   * Set attribution from service metadata
   */
  async setAttributionFromService(): Promise<void> {
    if (!this._map) {
      return;
    }

    if (this._serviceMetadata) {
      updateAttribution(this._serviceMetadata.copyrightText || '', 'service', this._map);
      return;
    }

    try {
      await this.metadata();
      if (this._serviceMetadata && typeof this._serviceMetadata === 'object') {
        const metadata = this._serviceMetadata as ServiceMetadata;
        updateAttribution(metadata?.copyrightText || '', 'service', this._map);
      }
    } catch (error) {
      console.warn('Could not fetch service attribution:', error);
    }
  }

  /**
   * Add event listener
   */
  on<K extends keyof ServiceEvents>(
    event: K,
    callback: (event: ServiceEvents[K]) => void
  ): Service {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = [];
    }
    this._eventListeners[event]!.push(
      callback as (event: ServiceEvents[keyof ServiceEvents]) => void
    );
    return this;
  }

  /**
   * Remove event listener
   */
  off<K extends keyof ServiceEvents>(
    event: K,
    callback: (event: ServiceEvents[K]) => void
  ): Service {
    const listeners = this._eventListeners[event];
    if (listeners) {
      const index = listeners.indexOf(
        callback as (event: ServiceEvents[keyof ServiceEvents]) => void
      );
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    return this;
  }

  /**
   * Fire an event
   */
  fire<K extends keyof ServiceEvents>(event: K, data: ServiceEvents[K]): Service {
    const listeners = this._eventListeners[event];
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
    return this;
  }

  // Private methods

  private _requestWithCallback<T = unknown>(
    method: string,
    path: string,
    params: Record<string, unknown>,
    callback: ServiceCallback<T>
  ): void {
    this.fire('requeststart', {
      url: this.options.url + path,
      params,
      method,
    });

    const wrappedCallback = this._createServiceCallback(method, path, params, (error, response) => {
      callback(error, response as T);
    });

    // Token/apiKey/authentication are applied by the request adapter, not as
    // raw params, so they are not injected here.
    let finalParams = { ...params };
    if (this.options.requestParams) {
      finalParams = { ...finalParams, ...this.options.requestParams };
    }

    if (this._authenticating) {
      this._requestQueue.push([method, path, finalParams, wrappedCallback, this]);
    } else {
      this._makeRequest(method, path, finalParams, wrappedCallback);
    }
  }

  private async _request(
    method: string,
    path: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    this.fire('requeststart', {
      url: this.options.url + path,
      params,
      method,
    });

    return new Promise((resolve, reject) => {
      const wrappedCallback = this._createServiceCallback(
        method,
        path,
        params,
        (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        }
      );

      let finalParams = { ...params };
      if (this.options.token) {
        finalParams.token = this.options.token;
      }
      if (this.options.requestParams) {
        finalParams = { ...finalParams, ...this.options.requestParams };
      }

      if (this._authenticating) {
        this._requestQueue.push([method, path, finalParams, wrappedCallback, this]);
      } else {
        this._makeRequest(method, path, finalParams, wrappedCallback);
      }
    });
  }

  private async _makeRequest(
    method: string,
    path: string,
    params: Record<string, unknown>,
    callback: (error?: Error, response?: unknown) => void
  ): Promise<void> {
    const url = `${this.options.url}${path}`;

    // Set up abort controller for timeout support
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (this.options.timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort();
      }, this.options.timeout);
    }

    try {
      const data = await esriRequest(url, {
        params,
        httpMethod: method === 'POST' ? 'POST' : 'GET',
        signal: controller.signal,
        token: this.options.token,
        apiKey: this.options.apiKey,
        authentication: this.options.authentication,
      });

      callback(undefined, data);
    } catch (error) {
      // Provide clearer error message for timeout
      if (error instanceof Error && error.name === 'AbortError' && this.options.timeout > 0) {
        callback(new Error(`Request timed out after ${this.options.timeout}ms`));
      } else {
        // ArcGISRequestError exposes a numeric `code` used downstream for
        // authentication (498/499) detection.
        callback(error as Error);
      }
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  private _createServiceCallback(
    method: string,
    path: string,
    params: Record<string, unknown>,
    callback: (error?: Error, response?: unknown) => void
  ): (error?: Error, response?: unknown) => void {
    return (error?: Error, response?: unknown) => {
      // Check if error has authentication-related status codes
      const errorWithCode = error as Error & { code?: number };
      if (error && (errorWithCode.code === 499 || errorWithCode.code === 498)) {
        this._authenticating = true;
        this._requestQueue.push([method, path, params, callback, this]);

        // Fire event for users to handle re-authentication
        this.fire('authenticationrequired', {
          authenticate: (token: string) => this.authenticate(token),
        });

        // Add authenticate method to error for callback handling
        const authError = error as Error & { authenticate?: (token: string) => void };
        authError.authenticate = (token: string) => this.authenticate(token);
        return;
      }

      if (error) {
        this.fire('requesterror', {
          url: this.options.url + path,
          params,
          message: error.message,
          code: errorWithCode.code,
          method,
        });
      } else {
        this.fire('requestsuccess', {
          url: this.options.url + path,
          params,
          response,
          method,
        });
      }

      this.fire('requestend', {
        url: this.options.url + path,
        params,
        method,
      });

      callback(error, response);
    };
  }

  private _runQueue(): void {
    for (let i = this._requestQueue.length - 1; i >= 0; i--) {
      const request = this._requestQueue[i];
      const [method, path, params, callback] = request;
      if (callback) {
        this._makeRequest(method, path, params, callback);
      }
    }
    this._requestQueue = [];
  }
}

export function service(options: ServiceOptions): Service {
  return new Service(options);
}
