import { Service, ServiceOptions } from './Service';
import { IdentifyFeatures } from '../Tasks/IdentifyFeatures';
import { Query } from '../Tasks/Query';
import { Find } from '../Tasks/Find';

export interface MapServiceOptions extends ServiceOptions {}

/**
 * MapService - ArcGIS Server Map Service
 * Exactly matches Esri Leaflet's MapService pattern
 */
export class MapService extends Service {
  constructor(options: MapServiceOptions) {
    super(options);
  }

  /**
   * Return an IdentifyFeatures task instance
   */
  identify(): IdentifyFeatures {
    return new IdentifyFeatures(this);
  }

  /**
   * Return a Query task instance
   */
  query(): Query {
    return new Query(this);
  }

  /**
   * Return a Find task instance
   */
  find(): Find {
    return new Find(this);
  }

  // Export method for getting map images (kept for backward compatibility)
  async export(params: Record<string, unknown>): Promise<{ href?: string }> {
    return this.request('export', params) as Promise<{ href?: string }>;
  }
}

export function mapService(options: MapServiceOptions): MapService {
  return new MapService(options);
}

export default mapService;
