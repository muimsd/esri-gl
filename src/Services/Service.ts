import { cleanTrailingSlash, updateAttribution } from '../utils'
import { Map, ServiceMetadata } from '../types'

export interface ServiceOptions {
  url: string
  proxy?: boolean
  useCors?: boolean
  timeout?: number
  token?: string
  requestParams?: Record<string, unknown>
  getAttributionFromService?: boolean
}

export type ServiceCallback<T = unknown> = (error?: Error, response?: T) => void

export interface ServiceEvents {
  requeststart: { url: string; params: Record<string, unknown>; method: string }
  requestsuccess: { url: string; params: Record<string, unknown>; response: unknown; method: string }
  requesterror: { url: string; params: Record<string, unknown>; message: string; code?: number; method: string }
  requestend: { url: string; params: Record<string, unknown>; method: string }
  authenticationrequired: { authenticate: (token: string) => void }
}

/**
 * Base Service class for ArcGIS REST API services
 * Similar to Esri Leaflet's Service class
 */
export class Service {
  protected options: ServiceOptions & { proxy: boolean; useCors: boolean; timeout: number; getAttributionFromService: boolean }
  protected _requestQueue: Array<[string, string, Record<string, unknown>, (error?: Error, response?: unknown) => void, unknown]> = []
  protected _authenticating: boolean = false
  protected _serviceMetadata: ServiceMetadata | null = null
  protected _map?: Map

  private _eventListeners: Partial<Record<keyof ServiceEvents, ((event: ServiceEvents[keyof ServiceEvents]) => void)[]>> = {}

  constructor(options: ServiceOptions) {
    if (!options.url) {
      throw new Error('A url must be supplied as part of the service options.')
    }

    this.options = {
      proxy: false,
      useCors: true,
      timeout: 0,
      getAttributionFromService: true,
      ...options,
      url: cleanTrailingSlash(options.url)
    }
  }

  /**
   * Make a GET request
   */
  async get(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._request('GET', path, params)
  }

  /**
   * Make a POST request
   */
  async post(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._request('POST', path, params)
  }

  /**
   * Make a generic request
   */
  async request(path: string, params: Record<string, unknown> = {}): Promise<unknown> {
    return this._request('GET', path, params)
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
      this._requestWithCallback(method, path, params, callback)
      return
    }
    return this._request(method, path, params) as Promise<T>
  }

  /**
   * Get service metadata
   */
  async metadata(): Promise<ServiceMetadata> {
    if (this._serviceMetadata) {
      return this._serviceMetadata
    }

    try {
      const response = await this._request('GET', '', { f: 'json' })
      this._serviceMetadata = response as ServiceMetadata
      return this._serviceMetadata
    } catch (error) {
      console.error('Error fetching service metadata:', error)
      throw error
    }
  }

  /**
   * Set authentication token
   */
  authenticate(token: string): Service {
    this._authenticating = false
    this.options.token = token
    this._runQueue()
    return this
  }

  /**
   * Get request timeout
   */
  getTimeout(): number {
    return this.options.timeout
  }

  /**
   * Set request timeout
   */
  setTimeout(timeout: number): Service {
    this.options.timeout = timeout
    return this
  }

  /**
   * Set attribution from service metadata
   */
  async setAttributionFromService(): Promise<void> {
    if (!this._map) {
      return
    }

    if (this._serviceMetadata) {
      updateAttribution(this._serviceMetadata.copyrightText || '', 'service', this._map)
      return
    }

    try {
      await this.metadata()
      const metadata = this._serviceMetadata as any
      updateAttribution(metadata?.copyrightText || '', 'service', this._map)
    } catch (error) {
      console.warn('Could not fetch service attribution:', error)
    }
  }

  /**
   * Add event listener
   */
  on<K extends keyof ServiceEvents>(event: K, callback: (event: ServiceEvents[K]) => void): Service {
    if (!this._eventListeners[event]) {
      this._eventListeners[event] = []
    }
    this._eventListeners[event]!.push(callback as (event: ServiceEvents[keyof ServiceEvents]) => void)
    return this
  }

  /**
   * Remove event listener
   */
  off<K extends keyof ServiceEvents>(event: K, callback: (event: ServiceEvents[K]) => void): Service {
    const listeners = this._eventListeners[event]
    if (listeners) {
      const index = listeners.indexOf(callback as (event: ServiceEvents[keyof ServiceEvents]) => void)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
    return this
  }

  /**
   * Fire an event
   */
  fire<K extends keyof ServiceEvents>(event: K, data: ServiceEvents[K]): Service {
    const listeners = this._eventListeners[event]
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
    return this
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
      method
    })

    const wrappedCallback = this._createServiceCallback(method, path, params, (error, response) => {
      callback(error, response as T)
    })

    let finalParams = { ...params }
    if (this.options.token) {
      finalParams.token = this.options.token
    }
    if (this.options.requestParams) {
      finalParams = { ...finalParams, ...this.options.requestParams }
    }

    if (this._authenticating) {
      this._requestQueue.push([method, path, finalParams, wrappedCallback, this])
    } else {
      this._makeRequest(method, path, finalParams, wrappedCallback)
    }
  }

  private async _request(method: string, path: string, params: Record<string, unknown>): Promise<unknown> {
    this.fire('requeststart', {
      url: this.options.url + path,
      params,
      method
    })

    return new Promise((resolve, reject) => {
      const wrappedCallback = this._createServiceCallback(method, path, params, (error, response) => {
        if (error) {
          reject(error)
        } else {
          resolve(response)
        }
      })

      let finalParams = { ...params }
      if (this.options.token) {
        finalParams.token = this.options.token
      }
      if (this.options.requestParams) {
        finalParams = { ...finalParams, ...this.options.requestParams }
      }

      if (this._authenticating) {
        this._requestQueue.push([method, path, finalParams, wrappedCallback, this])
      } else {
        this._makeRequest(method, path, finalParams, wrappedCallback)
      }
    })
  }

  private async _makeRequest(
    method: string, 
    path: string, 
    params: Record<string, unknown>, 
    callback: (error?: Error, response?: unknown) => void
  ): Promise<void> {
    const url = this.options.proxy 
      ? `${this.options.proxy}?${this.options.url}${path}`
      : `${this.options.url}${path}`

    try {
      let response: Response

      if (method === 'POST') {
        const formData = new FormData()
        Object.keys(params).forEach(key => {
          const value = params[key]
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              formData.append(key, JSON.stringify(value))
            } else {
              formData.append(key, value.toString())
            }
          }
        })

        response = await fetch(url, {
          method: 'POST',
          body: formData
        })
      } else {
        const searchParams = new URLSearchParams()
        Object.keys(params).forEach(key => {
          const value = params[key]
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              searchParams.append(key, value.join(','))
            } else if (typeof value === 'object') {
              searchParams.append(key, JSON.stringify(value))
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })

        const fullUrl = `${url}?${searchParams.toString()}`
        response = await fetch(fullUrl)
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      callback(undefined, data)
    } catch (error) {
      callback(error as Error)
    }
  }

  private _createServiceCallback(
    method: string,
    path: string,
    params: Record<string, unknown>,
    callback: (error?: Error, response?: unknown) => void
  ): (error?: Error, response?: unknown) => void {
    return (error?: Error, response?: unknown) => {
      if (error && ((error as any).code === 499 || (error as any).code === 498)) {
        this._authenticating = true
        this._requestQueue.push([method, path, params, callback, this])

        // Fire event for users to handle re-authentication
        this.fire('authenticationrequired', {
          authenticate: (token: string) => this.authenticate(token)
        })

        // Add authenticate method to error for callback handling
        ;(error as any).authenticate = (token: string) => this.authenticate(token)
      }

      if (error) {
        this.fire('requesterror', {
          url: this.options.url + path,
          params,
          message: error.message,
          code: (error as any).code,
          method
        })
      } else {
        this.fire('requestsuccess', {
          url: this.options.url + path,
          params,
          response,
          method
        })
      }

      this.fire('requestend', {
        url: this.options.url + path,
        params,
        method
      })

      callback(error, response)
    }
  }

  private _runQueue(): void {
    for (let i = this._requestQueue.length - 1; i >= 0; i--) {
      const request = this._requestQueue[i]
      const [method, path, params, callback] = request
      if (callback) {
        this._makeRequest(method, path, params, callback)
      }
    }
    this._requestQueue = []
  }
}

export function service(options: ServiceOptions): Service {
  return new Service(options)
}

export default service
