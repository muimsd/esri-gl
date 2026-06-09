import { useState, useEffect, useRef, useCallback } from 'react';
import { serviceFromPortalItem } from '@/Portal';
import type { PortalResolvedService } from '@/Portal';
import type { UsePortalItemOptions, UsePortalItemResult } from '../types';

/**
 * Resolve an ArcGIS portal item id to an esri-gl service (adding its source to
 * the map) via {@link serviceFromPortalItem}. Re-resolves when `itemId` / `map`
 * change and cleans up the previous service.
 */
export function usePortalItem({
  sourceId,
  map,
  itemId,
  options,
}: UsePortalItemOptions): UsePortalItemResult {
  const [service, setService] = useState<PortalResolvedService | null>(null);
  const [kind, setKind] = useState<UsePortalItemResult['kind']>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const serviceRef = useRef<PortalResolvedService | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const cleanup = useCallback(() => {
    if (serviceRef.current) {
      try {
        serviceRef.current.remove();
      } catch (err) {
        if (process.env?.NODE_ENV !== 'test') {
          console.warn('usePortalItem: error removing service:', err);
        }
      }
      serviceRef.current = null;
    }
  }, []);

  const reload = useCallback(() => setReloadKey(key => key + 1), []);

  useEffect(() => {
    if (!map || !itemId) {
      cleanup();
      setService(null);
      setKind(null);
      setUrl(null);
      setTitle(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    cleanup();

    serviceFromPortalItem(sourceId, map, itemId, optionsRef.current)
      .then(result => {
        if (cancelled) {
          try {
            result.service.remove();
          } catch {
            /* ignore */
          }
          return;
        }
        serviceRef.current = result.service;
        setService(result.service);
        setKind(result.kind);
        setUrl(result.url);
        setTitle(result.title ?? null);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to resolve portal item'));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [map, itemId, sourceId, reloadKey, cleanup]);

  // Remove the resolved service on unmount.
  useEffect(() => () => cleanup(), [cleanup]);

  return { service, kind, url, title, loading, error, reload };
}
