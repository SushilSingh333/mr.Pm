import type { GeoPage } from '../../geo-pages/types.js';

import { delhiHomeShifting } from './home-shifting.js';
import { delhiOfficeShifting } from './office-shifting.js';
import { delhiCarTransport } from './car-transport.js';
import { delhiBikeTransport } from './bike-transport.js';
import { delhiPackingUnpacking } from './packing-unpacking.js';
import { delhiLoadingUnloading } from './loading-unloading.js';
import { delhiInternationalRelocation } from './international-relocation.js';

/** delhi × service page briefs, keyed 'delhi/<service slug>'. */
export const DELHI_SERVICE_PAGES: Record<string, GeoPage> = {
  'delhi/home-shifting': delhiHomeShifting,
  'delhi/office-shifting': delhiOfficeShifting,
  'delhi/car-transport': delhiCarTransport,
  'delhi/bike-transport': delhiBikeTransport,
  'delhi/packing-unpacking': delhiPackingUnpacking,
  'delhi/loading-unloading': delhiLoadingUnloading,
  'delhi/international-relocation': delhiInternationalRelocation,
};
