import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as EsriMap } from '../../../types';

type MapLibreStyle = string | Record<string, unknown>;

export interface MapLibreDemoOptions {
  style?: MapLibreStyle;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  attributionControl?: boolean;
}

export interface UseMapLibreDemoResult {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  mapReady: boolean;
  esriMap: EsriMap | null;
}

const DEFAULT_OPTIONS: Required<Omit<MapLibreDemoOptions, 'style'>> & {
  style: MapLibreStyle;
} = {
  style: 'https://demotiles.maplibre.org/style.json',
  center: [-98.5795, 39.8283],
  zoom: 4,
  pitch: 0,
  bearing: 0,
  attributionControl: true,
};

export function useMapLibreDemo(options: MapLibreDemoOptions = {}): UseMapLibreDemoResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const initialOptionsRef = useRef<MapLibreDemoOptions | null>(null);
  if (initialOptionsRef.current === null) {
    initialOptionsRef.current = { ...options };
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const opts = initialOptionsRef.current ?? {};
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: opts.style ?? DEFAULT_OPTIONS.style,
      center: opts.center ?? DEFAULT_OPTIONS.center,
      zoom: opts.zoom ?? DEFAULT_OPTIONS.zoom,
      pitch: opts.pitch ?? DEFAULT_OPTIONS.pitch,
      bearing: opts.bearing ?? DEFAULT_OPTIONS.bearing,
      attributionControl: opts.attributionControl ?? DEFAULT_OPTIONS.attributionControl,
    });

    mapRef.current = map;

    const handleLoad = () => {
      setMapReady(true);
    };

    map.on('load', handleLoad);

    return () => {
      map.off('load', handleLoad);
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const esriMap = useMemo<EsriMap | null>(() => {
    if (!mapReady || !mapRef.current) {
      return null;
    }
    return mapRef.current as unknown as EsriMap;
  }, [mapReady]);

  return {
    containerRef,
    mapRef,
    mapReady,
    esriMap,
  };
}
