export class VectorBasemapStyle {
  public styleName: string;
  private _apikey: string;

  constructor(styleName?: string, apikey?: string) {
    if (!apikey) {
      throw new Error('An Esri API Key must be supplied to consume vector basemap styles');
    }

    this.styleName = styleName || 'ArcGIS:Streets';
    this._apikey = apikey;
  }

  get styleUrl(): string {
    return `https://basemaps-api.arcgis.com/arcgis/rest/services/styles/${this.styleName}?type=style&apiKey=${this._apikey}`;
  }

  setStyle(styleName: string): void {
    this.styleName = styleName;
  }

  update(): void {
    // Style updates are handled by changing the styleUrl
  }

  remove(): void {
    // Vector basemap styles don't need explicit removal
  }
}
