import type { EsriAuthProps } from '../types';

/**
 * Copy any defined auth/passthrough props from a layer component's props
 * onto a service-options object. Undefined values are skipped so they
 * do not override service defaults.
 */
export function applyAuthOptions<T extends object>(options: T, props: EsriAuthProps): T {
  const target = options as Record<string, unknown>;
  if (props.token !== undefined) target.token = props.token;
  if (props.apiKey !== undefined) target.apiKey = props.apiKey;
  if (props.proxy !== undefined) target.proxy = props.proxy;
  if (props.getAttributionFromService !== undefined)
    target.getAttributionFromService = props.getAttributionFromService;
  if (props.requestParams !== undefined) target.requestParams = props.requestParams;
  if (props.fetchOptions !== undefined) target.fetchOptions = props.fetchOptions;
  return options;
}
