/**
 * VectorBasemapStyle supports both modern slash form (arcgis/streets) and legacy colon form (ArcGIS:Streets).
 * The URL always uses the slash form expected by the Basemap Styles Service.
 */
export interface VectorBasemapStyleAuthOptions {
  apiKey?: string;          // API key for v1 host (basemaps-api)
  token?: string;           // OAuth / user token for v2 host (basemapstyles-api)
  version?: 'v1' | 'v2';    // Force version; inferred if not supplied
  host?: string;            // Override host (useful for enterprise / future domains)
  echoToken?: boolean;      // Only for v2 token endpoints (default false)
  format?: 'json' | 'style';// Output format (v2 default json, v1 uses style semantics)
  language?: string;        // Optional locale
  worldview?: string;       // Optional worldview parameter
}

export class VectorBasemapStyle {
  public styleName: string; // original user-supplied value (for display / debugging)
  private _canonical: string; // normalized slash form used in URL
  private _apiKey?: string;
  private _token?: string;
  private _version: 'v1' | 'v2';
  private _host: string;
  private _format: 'json' | 'style';
  private _language?: string;
  private _worldview?: string;

  // Mapping from legacy colon form to canonical slash form
  private static readonly COLON_TO_SLASH: Record<string, string> = {
    'arcgis:streets': 'arcgis/streets',
    'arcgis:topographic': 'arcgis/topographic',
    'arcgis:navigation': 'arcgis/navigation',
    'arcgis:streetsrelief': 'arcgis/streets-relief',
    'arcgis:darkgray': 'arcgis/dark-gray',
    'arcgis:lightgray': 'arcgis/light-gray',
    'arcgis:oceans': 'arcgis/oceans',
    'arcgis:imagery': 'arcgis/imagery',
    'arcgis:streetsnight': 'arcgis/streets-night',
  };

  // Overload signature: (styleName, apiKeyString) or (styleName, options)
  constructor(styleName?: string, auth?: string | VectorBasemapStyleAuthOptions) {
    const provided = styleName && styleName.trim() ? styleName : 'arcgis/streets';
    this.styleName = provided;
    this._canonical = VectorBasemapStyle._toCanonical(provided);

    let opts: VectorBasemapStyleAuthOptions;
    if (typeof auth === 'string') {
      opts = { apiKey: auth };
    } else {
      opts = auth || {};
    }

    this._apiKey = opts.apiKey;
    this._token = opts.token;
    this._language = opts.language;
    this._worldview = opts.worldview;

    // Infer version: token => v2, else apiKey => v1
    this._version = opts.version || (this._token ? 'v2' : 'v1');
    // Determine host based on version if not overridden
    this._host = opts.host || (this._version === 'v2' ? 'https://basemapstyles-api.arcgis.com' : 'https://basemaps-api.arcgis.com');
    // For v2 we default to 'style' so the response is directly consumable by map.setStyle
    this._format = opts.format || (this._version === 'v2' ? 'style' : 'style');

    if (!this._apiKey && !this._token) {
      // Keep legacy error string for backwards compatibility with existing tests / consumers
      throw new Error('An Esri API Key must be supplied to consume vector basemap styles');
    }
  }

  get styleUrl(): string {
    // v1 pattern: https://basemaps-api.arcgis.com/arcgis/rest/services/styles/{id}?type=style&apiKey=KEY
    // v2 pattern: https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/{id}?f=json&token=TOKEN&echoToken=false
    if (this._version === 'v2') {
      const params = new URLSearchParams();
      params.set('f', this._format); // usually 'style'
      if (this._token) params.set('token', this._token);
      // Always include echoToken=false to mirror sample URL pattern
      params.set('echoToken', 'false');
      if (this._language) params.set('language', this._language);
      if (this._worldview) params.set('worldview', this._worldview);
      return `${this._host}/arcgis/rest/services/styles/v2/styles/${this._canonical}?${params.toString()}`;
    }
    // v1 (apiKey)
    const params = new URLSearchParams();
    params.set('type', 'style');
    if (this._apiKey) params.set('apiKey', this._apiKey);
    if (this._language) params.set('language', this._language);
    if (this._worldview) params.set('worldview', this._worldview);
    return `${this._host}/arcgis/rest/services/styles/${this._canonical}?${params.toString()}`;
  }

  setStyle(styleName: string): void {
    if (!styleName) return;
    this.styleName = styleName;
    this._canonical = VectorBasemapStyle._toCanonical(styleName);
  }

  update(): void {}
  remove(): void {}

  private static _toCanonical(name: string): string {
    if (!name) return 'arcgis/streets';
    // Already slash form
    if (name.includes('/')) return name;
    const lower = name.toLowerCase();
    if (this.COLON_TO_SLASH[lower]) return this.COLON_TO_SLASH[lower];
    // If it looks like ArcGIS:Token (legacy) attempt smart conversion
    if (/^arcgis:/i.test(name)) {
      const token = name.split(':')[1];
      if (token) {
        const slug = token
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/_/g, '-')
          .toLowerCase();
        return `arcgis/${slug}`;
      }
    }
    return name; // custom enterprise style: leave untouched (caller controls format)
  }
}
