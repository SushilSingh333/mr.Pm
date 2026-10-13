import type { GeoPage } from '../../geo-pages/types.js';

import { gurgaonHomeShifting } from './home-shifting.js';
import { gurgaonOfficeShifting } from './office-shifting.js';
import { gurgaonCarTransport } from './car-transport.js';
import { gurgaonBikeTransport } from './bike-transport.js';
import { gurgaonPackingUnpacking } from './packing-unpacking.js';
import { gurgaonLoadingUnloading } from './loading-unloading.js';
import { gurgaonInternationalRelocation } from './international-relocation.js';

/** gurgaon × service page briefs, keyed 'gurgaon/<service slug>'. */
export const GURGAON_SERVICE_PAGES: Record<string, GeoPage> = {
  'gurgaon/home-shifting': gurgaonHomeShifting,
  'gurgaon/office-shifting': gurgaonOfficeShifting,
  'gurgaon/car-transport': gurgaonCarTransport,
  'gurgaon/bike-transport': gurgaonBikeTransport,
  'gurgaon/packing-unpacking': gurgaonPackingUnpacking,
  'gurgaon/loading-unloading': gurgaonLoadingUnloading,
  'gurgaon/international-relocation': gurgaonInternationalRelocation,
};
