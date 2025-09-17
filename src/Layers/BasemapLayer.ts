import { Layer, LayerOptions } from './Layer';

export interface BasemapLayerOptions extends LayerOptions {
  key?: string;
  apikey?: string;
  token?: string;
  language?: string;
  worldview?: string;
  style?: string;
}

interface BasemapConfig {
  urlTemplate: string;
  options: {
    minZoom: number;
    maxZoom: number;
    attribution?: string;
    style?: string;
  };
}

/**
 * BasemapLayer for MapLibre GL JS - equivalent to Esri Leaflet's BasemapLayer
 * Provides access to Esri's basemap services as vector tile layers
 */
export class BasemapLayer extends Layer {
  private static readonly BASEMAPS: Record<string, BasemapConfig> = {
    'arcgis/streets': {
      urlTemplate: 'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:Streets',
      options: {
        minZoom: 0,
        maxZoom: 23,
        attribution: 'Esri Community Maps Contributors, © Esri, HERE, Garmin, METI/NASA, USGS',
      },
    },
    'arcgis/navigation': {
      urlTemplate: 'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:Navigation',
      options: {
        minZoom: 0,
        maxZoom: 23,
        attribution: 'Esri Community Maps Contributors, © Esri, HERE, Garmin, METI/NASA, USGS',
      },
    },
    'arcgis/topographic': {
      urlTemplate: 'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:Topographic',
      options: {
        minZoom: 0,
        maxZoom: 23,
        attribution:
          'Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), © OpenStreetMap contributors, and the GIS User Community',
      },
    },
    'arcgis/light-gray': {
      urlTemplate:
        'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:LightGray:Base',
      options: {
        minZoom: 0,
        maxZoom: 16,
        attribution:
          'Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community',
      },
    },
    'arcgis/dark-gray': {
      urlTemplate:
        'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:DarkGray:Base',
      options: {
        minZoom: 0,
        maxZoom: 16,
        attribution:
          'Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community',
      },
    },
    'arcgis/imagery': {
      urlTemplate: 'https://basemaps-api.arcgis.com/arcgis/rest/services/styles/ArcGIS:Imagery',
      options: {
        minZoom: 0,
        maxZoom: 23,
        attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      },
    },
  };

  private config: BasemapConfig;

  constructor(key: string | BasemapLayerOptions, options?: BasemapLayerOptions) {
    let basemapOptions: BasemapLayerOptions;

    if (typeof key === 'string') {
      basemapOptions = { key, ...options };
    } else {
      basemapOptions = key;
    }

    super(basemapOptions);

    // Get basemap configuration
    const basemapKey = basemapOptions.key || 'arcgis/streets';
    this.config = BasemapLayer.BASEMAPS[basemapKey];

    if (!this.config) {
      throw new Error(
        `Unknown basemap: ${basemapKey}. Available basemaps: ${Object.keys(BasemapLayer.BASEMAPS).join(', ')}`
      );
    }

    // Merge config options with user options
    this.options = {
      ...this.config.options,
      ...this.options,
      attribution: this.options.attribution || this.config.options.attribution,
    };
  }

  protected _createSource(): void {
    if (!this._map) return;

    const token =
      (this.options as BasemapLayerOptions).token || (this.options as BasemapLayerOptions).apikey;
    let url = this.config.urlTemplate;

    if (token) {
      url += `?token=${token}`;
    }

    const source = {
      type: 'vector',
      url: url,
      attribution: this.options.attribution,
    };

    this._map.addSource(this._sourceId, source);
  }

  protected _createLayer(): void {
    if (!this._map) return;

    // For vector basemaps, we need to load and apply the style
    // This is a simplified version - in practice you'd fetch the full style JSON
    const layer = {
      id: this._layerId,
      type: 'background',
      source: this._sourceId,
      paint: {
        'background-opacity': this.options.opacity || 1,
      },
    };

    this._map.addLayer(layer);
  }

  /**
   * Set the basemap key
   */
  setBasemap(key: string): BasemapLayer {
    this.config = BasemapLayer.BASEMAPS[key];
    if (!this.config) {
      throw new Error(`Unknown basemap: ${key}`);
    }

    this._updateSource();
    return this;
  }

  /**
   * Get available basemap keys
   */
  static getAvailableBasemaps(): string[] {
    return Object.keys(BasemapLayer.BASEMAPS);
  }
}

export function basemapLayer(
  key: string | BasemapLayerOptions,
  options?: BasemapLayerOptions
): BasemapLayer {
  return new BasemapLayer(key, options);
}

export default basemapLayer;
