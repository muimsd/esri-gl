import { cleanTrailingSlash } from '../utils';
import { Service, ServiceCallback } from '../Services/Service';

export interface TaskOptions {
  url?: string
  proxy?: boolean
  useCors?: boolean
  requestParams?: Record<string, unknown>
  token?: string
  apikey?: string
}

/**
 * Base Task class for ArcGIS REST API operations
 * Similar to Esri Leaflet's Task class
 */
export class Task {
  protected _service?: Service;
  protected options: TaskOptions;
  protected params: Record<string, unknown> = {};
  protected path: string = '';
  protected setters: Record<string, string> = {};

  constructor(endpoint: string | TaskOptions | Service) {
    // endpoint can be either a url (and options) for an ArcGIS Rest Service or an instance of Service
    if (endpoint && typeof endpoint === 'object' && 'request' in endpoint) {
      this._service = endpoint as Service;
      this.options = {}; // Service will handle its own options
    } else if (typeof endpoint === 'string') {
      this.options = { url: cleanTrailingSlash(endpoint) };
    } else {
      this.options = { ...(endpoint as TaskOptions) };
      if (this.options.url) {
        this.options.url = cleanTrailingSlash(this.options.url);
      }
    }

    // Initialize params if not already set by subclass
    if (!this.params) {
      this.params = {};
    }

    // Generate setter methods based on the setters object
    if (this.setters) {
      for (const setter in this.setters) {
        const param = this.setters[setter]
        ;(this as Record<string, unknown>)[setter] = this.generateSetter(param, this);
      }
    }
  }

  /**
   * Generate a method for each methodName:paramName in the setters for this task
   */
  generateSetter(param: string, context: Task): (value: unknown) => Task {
    return function (value: unknown): Task {
      context.params[param] = value;
      return context;
    };
  }

  /**
   * Set authentication token
   */
  token(token: string): Task {
    if (this._service) {
      this._service.authenticate(token);
    } else {
      this.params.token = token;
    }
    return this;
  }

  /**
   * Set API key (alias for token)
   */
  apikey(apikey: string): Task {
    return this.token(apikey);
  }

  /**
   * Set whether to return formatted or unformatted values (ArcGIS Server 10.5+)
   */
  format(formatted: boolean): Task {
    this.params.returnUnformattedValues = !formatted;
    return this;
  }

  /**
   * Execute the task request with callback (Esri Leaflet style)
   */
  run(callback: ServiceCallback): void {
    if (this.options.requestParams) {
      Object.assign(this.params, this.options.requestParams);
    }

    if (this._service) {
      this._service.requestWithCallback('POST', this.path, this.params, callback);
      return;
    }

    // Direct request fallback
    this._request('POST', this.path, this.params, callback);
  }

  /**
   * Execute the task request with Promise
   */
  async request<T = unknown>(): Promise<T> {
    if (this.options.requestParams) {
      Object.assign(this.params, this.options.requestParams);
    }

    if (this._service) {
      return this._service.requestWithCallback('POST', this.path, this.params) as Promise<T>;
    }

    return new Promise((resolve, reject) => {
      this._request('POST', this.path, this.params, (error?: Error, response?: unknown) => {
        if (error) {
          reject(error);
        } else {
          resolve(response as T);
        }
      });
    });
  }

  /**
   * Direct HTTP request (when not using a service)
   */
  private _request(
    method: string,
    path: string,
    params: Record<string, unknown>,
    callback: ServiceCallback
  ): void {
    if (!this.options.url) {
      callback(new Error('URL is required for task execution'));
      return;
    }

    const url = this.options.proxy
      ? `${this.options.proxy}?${this.options.url}${path}`
      : `${this.options.url}${path}`;

    // Convert params to URLSearchParams
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else if (typeof value === 'object') {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const fullUrl = method === 'GET' ? `${url}?${searchParams.toString()}` : url;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (method === 'POST') {
      fetchOptions.body = searchParams.toString();
    }

    fetch(fullUrl, fetchOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => callback(undefined, data))
      .catch(error => callback(error));
  }
}
