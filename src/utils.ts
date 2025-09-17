import { Map, ServiceMetadata } from './types';

export function cleanTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function getServiceDetails(
  url: string,
  fetchOptions: RequestInit = {}
): Promise<ServiceMetadata> {
  return new Promise((resolve, reject) => {
    fetch(`${url}?f=json`, fetchOptions)
      .then(response => response.json())
      .then(data => resolve(data))
      .catch(error => reject(error));
  });
}

const POWERED_BY_ESRI_ATTRIBUTION_STRING = 'Powered by <a href="https://www.esri.com">Esri</a>';

// This requires hooking into some undocumented properties
export function updateAttribution(newAttribution: string, sourceId: string, map: Map): void {
  const attributionController = (map as any)._controls?.find((c: any) => '_attribHTML' in c);
  if (!attributionController) return;

  const customAttribution = attributionController.options.customAttribution;

  if (typeof customAttribution === 'string') {
    attributionController.options.customAttribution = `${customAttribution} | ${POWERED_BY_ESRI_ATTRIBUTION_STRING}`;
  } else if (customAttribution === undefined) {
    attributionController.options.customAttribution = POWERED_BY_ESRI_ATTRIBUTION_STRING;
  } else if (Array.isArray(customAttribution)) {
    if (customAttribution.indexOf(POWERED_BY_ESRI_ATTRIBUTION_STRING) === -1) {
      customAttribution.push(POWERED_BY_ESRI_ATTRIBUTION_STRING);
    }
  }

  const mapStyle = (map as any).style;
  if (mapStyle.sourceCaches) {
    mapStyle.sourceCaches[sourceId]._source.attribution = newAttribution;
  } else if (mapStyle._otherSourceCaches) {
    mapStyle._otherSourceCaches[sourceId]._source.attribution = newAttribution;
  }
  attributionController._updateAttributions();
}
