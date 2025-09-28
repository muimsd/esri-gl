import React, { createContext, useContext } from 'react';
import type { EsriServiceProviderProps } from '../types';
import type { Map } from '@/types';

interface EsriServiceContextValue {
  map: Map | null;
}

const EsriServiceContext = createContext<EsriServiceContextValue>({
  map: null,
});

/**
 * Context provider for sharing map instance across Esri components
 */
export function EsriServiceProvider({ children, map = null }: EsriServiceProviderProps) {
  return <EsriServiceContext.Provider value={{ map }}>{children}</EsriServiceContext.Provider>;
}

/**
 * Hook to access the current map from EsriServiceProvider
 */
export function useEsriMap(): Map | null {
  const context = useContext(EsriServiceContext);
  return context.map;
}
