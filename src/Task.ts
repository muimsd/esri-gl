import { cleanTrailingSlash } from '@/utils';

export interface TaskOptions {
  url?: string;
  proxy?: boolean;
  useCors?: boolean;
  requestParams?: Record<string, unknown>;
  token?: string;
  apikey?: string;
}

/**
 * Base Task class for ArcGIS REST API operations
 * Similar to Esri Leaflet's Task class
 */
export class Task {
  protected options: TaskOptions;
  protected params: Record<string, unknown> = {};
  protected path: string = '';
  protected setters: Record<string, string> = {};

  constructor(endpoint: string | TaskOptions) {
    if (typeof endpoint === 'string') {
      this.options = { url: cleanTrailingSlash(endpoint) };
    } else {
      this.options = { ...endpoint };
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
        const param = this.setters[setter];
        (this as Record<string, unknown>)[setter] = this.generateSetter(param, this);
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
    this.params.token = token;
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
   * Execute the task request
   */
  async request<T = unknown>(): Promise<T> {
    if (!this.options.url) {
      throw new Error('URL is required for task execution');
    }

    const params = { ...this.params };
    if (this.options.requestParams) {
      Object.assign(params, this.options.requestParams);
    }

    // Ensure path always has a leading slash when appending to cleaned base URL
    const normalizedPath = this.path?.startsWith('/') ? this.path : `/${this.path}`;

    const url = this.options.proxy
      ? `${this.options.proxy}?${this.options.url}${normalizedPath}`
      : `${this.options.url}${normalizedPath}`;

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

    const fullUrl = `${url}?${searchParams.toString()}`;

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Task request error:', error);
      throw error;
    }
  }
}
