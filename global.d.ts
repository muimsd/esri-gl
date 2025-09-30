// Global type declarations for external dependencies
declare module 'react-map-gl' {
  import { ReactNode } from 'react';

  export interface MapRef {
    getMap(): any;
  }

  export interface MapInstance {
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

  export function useMap(): { current: MapRef & { getMap(): MapInstance } };

  export interface MapProps {
    children?: ReactNode;
    onLoad?: (evt: any) => void;
    [key: string]: any;
  }

  export function Map(props: MapProps): JSX.Element;
  export function Source(props: { children?: ReactNode; [key: string]: any }): JSX.Element;
  export function Layer(props: { [key: string]: any }): JSX.Element;
  export function Marker(props: { [key: string]: any }): JSX.Element;
  export function Popup(props: { [key: string]: any }): JSX.Element;
  export function NavigationControl(props: { [key: string]: any }): JSX.Element;
  export function GeolocateControl(props: { [key: string]: any }): JSX.Element;
  export function AttributionControl(props: { [key: string]: any }): JSX.Element;
  export function ScaleControl(props: { [key: string]: any }): JSX.Element;
  export function FullscreenControl(props: { [key: string]: any }): JSX.Element;
}

declare module 'react-map-gl/maplibre' {
  export * from 'react-map-gl';
}