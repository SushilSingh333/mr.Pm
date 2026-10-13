import type { GeoPage } from '../../geo-pages/types.js';

import { noidaHomeShifting } from './home-shifting.js';
import { noidaOfficeShifting } from './office-shifting.js';
import { noidaCarTransport } from './car-transport.js';
import { noidaBikeTransport } from './bike-transport.js';
import { noidaPackingUnpacking } from './packing-unpacking.js';
import { noidaLoadingUnloading } from './loading-unloading.js';
import { noidaInternationalRelocation } from './international-relocation.js';

/** noida × service page briefs, keyed 'noida/<service slug>'. */
export const NOIDA_SERVICE_PAGES: Record<string, GeoPage> = {
  'noida/home-shifting': noidaHomeShifting,
  'noida/office-shifting': noidaOfficeShifting,
  'noida/car-transport': noidaCarTransport,
  'noida/bike-transport': noidaBikeTransport,
  'noida/packing-unpacking': noidaPackingUnpacking,
  'noida/loading-unloading': noidaLoadingUnloading,
  'noida/international-relocation': noidaInternationalRelocation,
};
