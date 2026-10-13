import type { GeoPage } from '../../geo-pages/types.js';

import { faridabadHomeShifting } from './home-shifting.js';
import { faridabadOfficeShifting } from './office-shifting.js';
import { faridabadCarTransport } from './car-transport.js';
import { faridabadBikeTransport } from './bike-transport.js';
import { faridabadPackingUnpacking } from './packing-unpacking.js';
import { faridabadLoadingUnloading } from './loading-unloading.js';
import { faridabadInternationalRelocation } from './international-relocation.js';

/** faridabad × service page briefs, keyed 'faridabad/<service slug>'. */
export const FARIDABAD_SERVICE_PAGES: Record<string, GeoPage> = {
  'faridabad/home-shifting': faridabadHomeShifting,
  'faridabad/office-shifting': faridabadOfficeShifting,
  'faridabad/car-transport': faridabadCarTransport,
  'faridabad/bike-transport': faridabadBikeTransport,
  'faridabad/packing-unpacking': faridabadPackingUnpacking,
  'faridabad/loading-unloading': faridabadLoadingUnloading,
  'faridabad/international-relocation': faridabadInternationalRelocation,
};
