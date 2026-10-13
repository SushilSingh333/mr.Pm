import type { GeoPage } from '../../geo-pages/types.js';

import { greaterNoidaHomeShifting } from './home-shifting.js';
import { greaterNoidaOfficeShifting } from './office-shifting.js';
import { greaterNoidaCarTransport } from './car-transport.js';
import { greaterNoidaBikeTransport } from './bike-transport.js';
import { greaterNoidaPackingUnpacking } from './packing-unpacking.js';
import { greaterNoidaLoadingUnloading } from './loading-unloading.js';
import { greaterNoidaInternationalRelocation } from './international-relocation.js';

/** greater-noida × service page briefs, keyed 'greater-noida/<service slug>'. */
export const GREATER_NOIDA_SERVICE_PAGES: Record<string, GeoPage> = {
  'greater-noida/home-shifting': greaterNoidaHomeShifting,
  'greater-noida/office-shifting': greaterNoidaOfficeShifting,
  'greater-noida/car-transport': greaterNoidaCarTransport,
  'greater-noida/bike-transport': greaterNoidaBikeTransport,
  'greater-noida/packing-unpacking': greaterNoidaPackingUnpacking,
  'greater-noida/loading-unloading': greaterNoidaLoadingUnloading,
  'greater-noida/international-relocation': greaterNoidaInternationalRelocation,
};
