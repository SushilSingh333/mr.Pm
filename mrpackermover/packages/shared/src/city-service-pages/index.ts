import type { GeoPage } from '../geo-pages/types.js';
import { DELHI_SERVICE_PAGES } from './delhi/index.js';
import { NOIDA_SERVICE_PAGES } from './noida/index.js';
import { GREATER_NOIDA_SERVICE_PAGES } from './greater-noida/index.js';
import { GURGAON_SERVICE_PAGES } from './gurgaon/index.js';
import { GHAZIABAD_SERVICE_PAGES } from './ghaziabad/index.js';
import { FARIDABAD_SERVICE_PAGES } from './faridabad/index.js';
import { MEERUT_SERVICE_PAGES } from './meerut/index.js';

/**
 * City × service pages (/packers-and-movers/<city>/<service>), keyed 'city/service', in
 * the same shape as the city and locality pages (geo-pages/types.ts): a hero line and
 * trust points, sections built from the service pages' blocks, FAQs and a closing call to
 * action. Each is written for one service in one city - what is different about home
 * shifting in Noida, not Noida in general and not home shifting in general - so it neither
 * repeats the city page nor the national service page.
 *
 * A page with no entry here keeps the older generic template.
 */
export const CITY_SERVICE_PAGES: Record<string, GeoPage> = {
  ...DELHI_SERVICE_PAGES,
  ...NOIDA_SERVICE_PAGES,
  ...GREATER_NOIDA_SERVICE_PAGES,
  ...GURGAON_SERVICE_PAGES,
  ...GHAZIABAD_SERVICE_PAGES,
  ...FARIDABAD_SERVICE_PAGES,
  ...MEERUT_SERVICE_PAGES,
};
