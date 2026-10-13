import type { GeoPage } from '../../geo-pages/types.js';

import { meerutHomeShifting } from './home-shifting.js';
import { meerutOfficeShifting } from './office-shifting.js';
import { meerutCarTransport } from './car-transport.js';
import { meerutBikeTransport } from './bike-transport.js';
import { meerutPackingUnpacking } from './packing-unpacking.js';
import { meerutLoadingUnloading } from './loading-unloading.js';
import { meerutInternationalRelocation } from './international-relocation.js';

/** meerut × service page briefs, keyed 'meerut/<service slug>'. */
export const MEERUT_SERVICE_PAGES: Record<string, GeoPage> = {
  'meerut/home-shifting': meerutHomeShifting,
  'meerut/office-shifting': meerutOfficeShifting,
  'meerut/car-transport': meerutCarTransport,
  'meerut/bike-transport': meerutBikeTransport,
  'meerut/packing-unpacking': meerutPackingUnpacking,
  'meerut/loading-unloading': meerutLoadingUnloading,
  'meerut/international-relocation': meerutInternationalRelocation,
};
