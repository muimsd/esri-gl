// Type declarations for maplibre-gl mock
declare module 'maplibre-gl' {
  export class Map {
    constructor(options: any);
    addSource(id: string, source: any): void;
    removeSource(id: string): void;
    addLayer(layer: any, beforeId?: string): void;
    removeLayer(id: string): void;
    getSource(id: string): any;
    getLayer(id: string): any;
    setLayoutProperty(layerId: string, property: string, value: any): void;
    setPaintProperty(layerId: string, property: string, value: any): void;
    on(type: string, handler: Function): void;
    off(type: string, handler: Function): void;
    getCanvas(): HTMLCanvasElement;
    getBounds(): any;
    getZoom(): number;
    getCenter(): { lng: number; lat: number };
    queryRenderedFeatures(pointOrBox?: any, options?: any): any[];
    project(lngLat: { lng: number; lat: number }): { x: number; y: number };
    unproject(point: { x: number; y: number }): { lng: number; lat: number };
    getBearing(): number;
    getPitch(): number;
    remove(): void;
    resize(): void;
    redraw(): void;
    triggerRepaint(): void;
    getContainer(): HTMLElement;
  }

  export class NavigationControl {
    constructor(options?: any);
  }

  export class GeolocateControl {
    constructor(options?: any);
  }

  export class AttributionControl {
    constructor(options?: any);
  }

  export class ScaleControl {
    constructor(options?: any);
  }

  export class FullscreenControl {
    constructor(options?: any);
  }

  export class Marker {
    constructor(element?: HTMLElement, options?: any);
  }

  export class Popup {
    constructor(options?: any);
  }
}
