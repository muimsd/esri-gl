// Type stub for react-map-gl during build process
// This file provides minimal type definitions to satisfy the TypeScript compiler
// during the build process when react-map-gl is treated as an external dependency

declare module 'react-map-gl' {
  export interface MapRef {
    getMap(): any;
  }

  export function useMap(): { current: MapRef };
}

declare module 'react-map-gl/maplibre' {
  export * from 'react-map-gl';
}
