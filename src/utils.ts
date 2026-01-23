import type { Map, ServiceMetadata } from '@/types';

export function cleanTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Check if an error represents an AbortError (request was cancelled)
 * Handles various error shapes from different browsers and environments
 */
export function isAbortError(error: unknown): boolean {
  if (!error) return false;

  // Standard DOMException check
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  // Error instance checks
  if (error instanceof Error) {
    if (error.name === 'AbortError') return true;
    if (error.message?.toLowerCase().includes('abort')) return true;
  }

  // Duck typing for error-like objects
  const errorObj = error as { name?: string; message?: string; constructor?: { name?: string } };
  if (errorObj.name === 'AbortError') return true;
  if (errorObj.constructor?.name === 'AbortError') return true;

  // String check
  const stringified = String(error).toLowerCase();
  return stringified.includes('abort');
}

export async function getServiceDetails(
  url: string,
  fetchOptions: RequestInit = {}
): Promise<ServiceMetadata> {
  const response = await fetch(`${url}?f=json`, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch service details: HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Service returned an error');
  }

  return data;
}

const POWERED_BY_ESRI_ATTRIBUTION_STRING = 'Powered by <a href="https://www.esri.com">Esri</a>';

// This requires hooking into some undocumented properties
export function updateAttribution(newAttribution: string, sourceId: string, map: Map): void {
  // Accessing undocumented MapLibre/Mapbox internal properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapWithControls = map as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attributionController = mapWithControls._controls?.find((c: any) => '_attribHTML' in c);
  if (!attributionController) return;

  const customAttribution = attributionController.options?.customAttribution;

  if (typeof customAttribution === 'string') {
    attributionController.options.customAttribution = `${customAttribution} | ${POWERED_BY_ESRI_ATTRIBUTION_STRING}`;
  } else if (customAttribution === undefined) {
    if (attributionController.options) {
      attributionController.options.customAttribution = POWERED_BY_ESRI_ATTRIBUTION_STRING;
    }
  } else if (Array.isArray(customAttribution)) {
    if (customAttribution.indexOf(POWERED_BY_ESRI_ATTRIBUTION_STRING) === -1) {
      customAttribution.push(POWERED_BY_ESRI_ATTRIBUTION_STRING);
    }
  }

  // Accessing undocumented map style properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapStyle = (map as any).style;
  if (mapStyle?.sourceCaches?.[sourceId]?._source) {
    mapStyle.sourceCaches[sourceId]._source.attribution = newAttribution;
  } else if (mapStyle?._otherSourceCaches?.[sourceId]?._source) {
    mapStyle._otherSourceCaches[sourceId]._source.attribution = newAttribution;
  } else {
    console.warn(`Source ${sourceId} not found when trying to update attribution`);
    return; // Don't try to update attributions if source doesn't exist
  }

  // Call undocumented method to update attribution display
  if (attributionController._updateAttributions) {
    attributionController._updateAttributions();
  }
}
