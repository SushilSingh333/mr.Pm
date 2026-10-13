import type { GeoPage } from '../../geo-pages/types.js';

import { ghaziabadHomeShifting } from './home-shifting.js';
import { ghaziabadOfficeShifting } from './office-shifting.js';
import { ghaziabadCarTransport } from './car-transport.js';
import { ghaziabadBikeTransport } from './bike-transport.js';
import { ghaziabadPackingUnpacking } from './packing-unpacking.js';
import { ghaziabadLoadingUnloading } from './loading-unloading.js';
import { ghaziabadInternationalRelocation } from './international-relocation.js';

/** ghaziabad × service page briefs, keyed 'ghaziabad/<service slug>'. */
export const GHAZIABAD_SERVICE_PAGES: Record<string, GeoPage> = {
  'ghaziabad/home-shifting': ghaziabadHomeShifting,
  'ghaziabad/office-shifting': ghaziabadOfficeShifting,
  'ghaziabad/car-transport': ghaziabadCarTransport,
  'ghaziabad/bike-transport': ghaziabadBikeTransport,
  'ghaziabad/packing-unpacking': ghaziabadPackingUnpacking,
  'ghaziabad/loading-unloading': ghaziabadLoadingUnloading,
  'ghaziabad/international-relocation': ghaziabadInternationalRelocation,
};
