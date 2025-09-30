// Type declarations for react-map-gl mock
declare module 'react-map-gl' {
  import { ReactNode } from 'react';

  export interface MapRef {
    getMap(): any;
  }

  export function useMap(): { current: MapRef };

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
