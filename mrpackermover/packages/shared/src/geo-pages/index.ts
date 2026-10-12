import type { GeoPage, GeoPageOverrides } from './types.js';
import { delhi } from './cities/delhi.js';
import { noida } from './cities/noida.js';
import { gurgaon } from './cities/gurgaon.js';
import { ghaziabad } from './cities/ghaziabad.js';
import { faridabad } from './cities/faridabad.js';
import { greaterNoida } from './cities/greater-noida.js';
import { meerut } from './cities/meerut.js';
import { delhiCivilLines } from './localities/delhi--civil-lines-delhi.js';
import { delhiDelhiCantt } from './localities/delhi--delhi-cantt.js';
import { delhiDwarka } from './localities/delhi--dwarka.js';
import { delhiGreaterKailash } from './localities/delhi--greater-kailash.js';
import { delhiHauzKhas } from './localities/delhi--hauz-khas.js';
import { delhiJanakpuri } from './localities/delhi--janakpuri.js';
import { delhiKalkaji } from './localities/delhi--kalkaji.js';
import { delhiKarolBagh } from './localities/delhi--karol-bagh.js';
import { delhiLajpatNagar } from './localities/delhi--lajpat-nagar.js';
import { delhiLaxmiNagar } from './localities/delhi--laxmi-nagar.js';
import { delhiMalviyaNagar } from './localities/delhi--malviya-nagar.js';
import { delhiMayurVihar } from './localities/delhi--mayur-vihar.js';
import { delhiModelTown } from './localities/delhi--model-town-delhi.js';
import { delhiMukherjeeNagar } from './localities/delhi--mukherjee-nagar.js';
import { delhiPatparganj } from './localities/delhi--patparganj.js';
import { delhiPitampura } from './localities/delhi--pitampura.js';
import { delhiPreetVihar } from './localities/delhi--preet-vihar.js';
import { delhiPunjabiBagh } from './localities/delhi--punjabi-bagh.js';
import { delhiRajinderNagar } from './localities/delhi--rajinder-nagar.js';
import { delhiRohini } from './localities/delhi--rohini.js';
import { delhiSaket } from './localities/delhi--saket.js';
import { delhiShahdara } from './localities/delhi--shahdara.js';
import { delhiUttamNagar } from './localities/delhi--uttam-nagar.js';
import { delhiVasantKunj } from './localities/delhi--vasant-kunj.js';
import { noidaSector128 } from './localities/noida--sector-128.js';
import { noidaSector137 } from './localities/noida--sector-137.js';
import { noidaSector150 } from './localities/noida--sector-150.js';
import { noidaSector18 } from './localities/noida--sector-18.js';
import { noidaSector50 } from './localities/noida--sector-50.js';
import { noidaSector62 } from './localities/noida--sector-62.js';
import { noidaSector63 } from './localities/noida--sector-63.js';
import { greaterNoidaAlpha } from './localities/greater-noida--alpha.js';
import { greaterNoidaBeta } from './localities/greater-noida--beta.js';
import { greaterNoidaDelta } from './localities/greater-noida--delta.js';
import { greaterNoidaGamma } from './localities/greater-noida--gamma.js';
import { greaterNoidaGaurCity } from './localities/greater-noida--gaur-city.js';
import { greaterNoidaWest } from './localities/greater-noida--greater-noida-west.js';
import { greaterNoidaJaypeeGreens } from './localities/greater-noida--jaypee-greens.js';
import { greaterNoidaKnowledgePark } from './localities/greater-noida--knowledge-park.js';
import { greaterNoidaOmicron } from './localities/greater-noida--omicron.js';
import { greaterNoidaPariChowk } from './localities/greater-noida--pari-chowk.js';
import { greaterNoidaSwarnNagari } from './localities/greater-noida--swarn-nagari.js';
import { greaterNoidaYamunaExpressway } from './localities/greater-noida--yamuna-expressway.js';
import { ghaziabadCrossingsRepublik } from './localities/ghaziabad--crossings-republik.js';
import { ghaziabadGovindpuram } from './localities/ghaziabad--govindpuram.js';
import { ghaziabadIndirapuram } from './localities/ghaziabad--indirapuram.js';
import { ghaziabadKaushambi } from './localities/ghaziabad--kaushambi.js';
import { ghaziabadKaviNagar } from './localities/ghaziabad--kavi-nagar.js';
import { ghaziabadMohanNagar } from './localities/ghaziabad--mohan-nagar.js';
import { ghaziabadNehruNagar } from './localities/ghaziabad--nehru-nagar.js';
import { ghaziabadPratapVihar } from './localities/ghaziabad--pratap-vihar.js';
import { ghaziabadRajNagar } from './localities/ghaziabad--raj-nagar.js';
import { ghaziabadRajNagarExtension } from './localities/ghaziabad--raj-nagar-extension.js';
import { ghaziabadRajendraNagar } from './localities/ghaziabad--rajendra-nagar.js';
import { ghaziabadSahibabad } from './localities/ghaziabad--sahibabad.js';
import { ghaziabadShalimarGarden } from './localities/ghaziabad--shalimar-garden.js';
import { ghaziabadShastriNagar } from './localities/ghaziabad--shastri-nagar-ghaziabad.js';
import { ghaziabadSiddharthVihar } from './localities/ghaziabad--siddharth-vihar.js';
import { ghaziabadVaishali } from './localities/ghaziabad--vaishali.js';
import { ghaziabadVasundhara } from './localities/ghaziabad--vasundhara.js';
import { ghaziabadVijayNagar } from './localities/ghaziabad--vijay-nagar.js';
import { gurgaonCyberCity } from './localities/gurgaon--cyber-city.js';
import { gurgaonDlfPhase1 } from './localities/gurgaon--dlf-phase-1.js';
import { gurgaonDwarkaExpressway } from './localities/gurgaon--dwarka-expressway.js';
import { gurgaonGolfCourseExtensionRoad } from './localities/gurgaon--golf-course-extension-road.js';
import { gurgaonGolfCourseRoad } from './localities/gurgaon--golf-course-road.js';
import { gurgaonManesar } from './localities/gurgaon--manesar.js';
import { gurgaonMgRoad } from './localities/gurgaon--mg-road.js';
import { gurgaonPalamVihar } from './localities/gurgaon--palam-vihar.js';
import { gurgaonSohnaRoad } from './localities/gurgaon--sohna-road.js';
import { gurgaonUdyogVihar } from './localities/gurgaon--udyog-vihar.js';
import { faridabadBadkhal } from './localities/faridabad--badkhal.js';
import { faridabadBallabgarh } from './localities/faridabad--ballabgarh.js';
import { faridabadGreaterFaridabad } from './localities/faridabad--greater-faridabad.js';
import { faridabadNit } from './localities/faridabad--nit.js';
import { faridabadOldFaridabad } from './localities/faridabad--old-faridabad.js';
import { faridabadSainikColony } from './localities/faridabad--sainik-colony.js';
import { faridabadSector15 } from './localities/faridabad--sector-15.js';
import { faridabadSurajkund } from './localities/faridabad--surajkund.js';
import { meerutCivilLines } from './localities/meerut--civil-lines-meerut.js';
import { meerutGangaNagar } from './localities/meerut--ganga-nagar.js';
import { meerutGarhRoad } from './localities/meerut--garh-road.js';
import { meerutJagritiVihar } from './localities/meerut--jagriti-vihar.js';
import { meerutKankerKhera } from './localities/meerut--kanker-khera.js';
import { meerutLalkurti } from './localities/meerut--lalkurti.js';
import { meerutMeerutCantt } from './localities/meerut--meerut-cantt.js';
import { meerutModipuram } from './localities/meerut--modipuram.js';
import { meerutPallavpuram } from './localities/meerut--pallavpuram.js';
import { meerutPartapur } from './localities/meerut--partapur.js';
import { meerutSaket } from './localities/meerut--saket-meerut.js';
import { meerutShastriNagar } from './localities/meerut--shastri-nagar.js';

export type * from './types.js';
export * from './release.js';

/**
 * The built-in copy of the city pages, keyed by city slug - from the owner's FINAL city
 * briefs (9 October 2026). The CMS can replace any part (Locations → "Page content").
 */
export const CITY_PAGES: Record<string, GeoPage> = {
  delhi,
  noida,
  gurgaon,
  ghaziabad,
  faridabad,
  'greater-noida': greaterNoida,
  meerut,
};

/**
 * The built-in copy of the locality pages, keyed `<city>/<locality>` - written in the
 * city briefs' style from the live pages and certain public facts about each place.
 */
export const LOCALITY_PAGES: Record<string, GeoPage> = {
  'delhi/civil-lines-delhi': delhiCivilLines,
  'delhi/delhi-cantt': delhiDelhiCantt,
  'delhi/dwarka': delhiDwarka,
  'delhi/greater-kailash': delhiGreaterKailash,
  'delhi/hauz-khas': delhiHauzKhas,
  'delhi/janakpuri': delhiJanakpuri,
  'delhi/kalkaji': delhiKalkaji,
  'delhi/karol-bagh': delhiKarolBagh,
  'delhi/lajpat-nagar': delhiLajpatNagar,
  'delhi/laxmi-nagar': delhiLaxmiNagar,
  'delhi/malviya-nagar': delhiMalviyaNagar,
  'delhi/mayur-vihar': delhiMayurVihar,
  'delhi/model-town-delhi': delhiModelTown,
  'delhi/mukherjee-nagar': delhiMukherjeeNagar,
  'delhi/patparganj': delhiPatparganj,
  'delhi/pitampura': delhiPitampura,
  'delhi/preet-vihar': delhiPreetVihar,
  'delhi/punjabi-bagh': delhiPunjabiBagh,
  'delhi/rajinder-nagar': delhiRajinderNagar,
  'delhi/rohini': delhiRohini,
  'delhi/saket': delhiSaket,
  'delhi/shahdara': delhiShahdara,
  'delhi/uttam-nagar': delhiUttamNagar,
  'delhi/vasant-kunj': delhiVasantKunj,
  'noida/sector-128': noidaSector128,
  'noida/sector-137': noidaSector137,
  'noida/sector-150': noidaSector150,
  'noida/sector-18': noidaSector18,
  'noida/sector-50': noidaSector50,
  'noida/sector-62': noidaSector62,
  'noida/sector-63': noidaSector63,
  'greater-noida/alpha': greaterNoidaAlpha,
  'greater-noida/beta': greaterNoidaBeta,
  'greater-noida/delta': greaterNoidaDelta,
  'greater-noida/gamma': greaterNoidaGamma,
  'greater-noida/gaur-city': greaterNoidaGaurCity,
  'greater-noida/greater-noida-west': greaterNoidaWest,
  'greater-noida/jaypee-greens': greaterNoidaJaypeeGreens,
  'greater-noida/knowledge-park': greaterNoidaKnowledgePark,
  'greater-noida/omicron': greaterNoidaOmicron,
  'greater-noida/pari-chowk': greaterNoidaPariChowk,
  'greater-noida/swarn-nagari': greaterNoidaSwarnNagari,
  'greater-noida/yamuna-expressway': greaterNoidaYamunaExpressway,
  'ghaziabad/crossings-republik': ghaziabadCrossingsRepublik,
  'ghaziabad/govindpuram': ghaziabadGovindpuram,
  'ghaziabad/indirapuram': ghaziabadIndirapuram,
  'ghaziabad/kaushambi': ghaziabadKaushambi,
  'ghaziabad/kavi-nagar': ghaziabadKaviNagar,
  'ghaziabad/mohan-nagar': ghaziabadMohanNagar,
  'ghaziabad/nehru-nagar': ghaziabadNehruNagar,
  'ghaziabad/pratap-vihar': ghaziabadPratapVihar,
  'ghaziabad/raj-nagar': ghaziabadRajNagar,
  'ghaziabad/raj-nagar-extension': ghaziabadRajNagarExtension,
  'ghaziabad/rajendra-nagar': ghaziabadRajendraNagar,
  'ghaziabad/sahibabad': ghaziabadSahibabad,
  'ghaziabad/shalimar-garden': ghaziabadShalimarGarden,
  'ghaziabad/shastri-nagar-ghaziabad': ghaziabadShastriNagar,
  'ghaziabad/siddharth-vihar': ghaziabadSiddharthVihar,
  'ghaziabad/vaishali': ghaziabadVaishali,
  'ghaziabad/vasundhara': ghaziabadVasundhara,
  'ghaziabad/vijay-nagar': ghaziabadVijayNagar,
  'gurgaon/cyber-city': gurgaonCyberCity,
  'gurgaon/dlf-phase-1': gurgaonDlfPhase1,
  'gurgaon/dwarka-expressway': gurgaonDwarkaExpressway,
  'gurgaon/golf-course-extension-road': gurgaonGolfCourseExtensionRoad,
  'gurgaon/golf-course-road': gurgaonGolfCourseRoad,
  'gurgaon/manesar': gurgaonManesar,
  'gurgaon/mg-road': gurgaonMgRoad,
  'gurgaon/palam-vihar': gurgaonPalamVihar,
  'gurgaon/sohna-road': gurgaonSohnaRoad,
  'gurgaon/udyog-vihar': gurgaonUdyogVihar,
  'faridabad/badkhal': faridabadBadkhal,
  'faridabad/ballabgarh': faridabadBallabgarh,
  'faridabad/greater-faridabad': faridabadGreaterFaridabad,
  'faridabad/nit': faridabadNit,
  'faridabad/old-faridabad': faridabadOldFaridabad,
  'faridabad/sainik-colony': faridabadSainikColony,
  'faridabad/sector-15': faridabadSector15,
  'faridabad/surajkund': faridabadSurajkund,
  'meerut/civil-lines-meerut': meerutCivilLines,
  'meerut/ganga-nagar': meerutGangaNagar,
  'meerut/garh-road': meerutGarhRoad,
  'meerut/jagriti-vihar': meerutJagritiVihar,
  'meerut/kanker-khera': meerutKankerKhera,
  'meerut/lalkurti': meerutLalkurti,
  'meerut/meerut-cantt': meerutMeerutCantt,
  'meerut/modipuram': meerutModipuram,
  'meerut/pallavpuram': meerutPallavpuram,
  'meerut/partapur': meerutPartapur,
  'meerut/saket-meerut': meerutSaket,
  'meerut/shastri-nagar': meerutShastriNagar,
};

/**
 * Locality pages that are the same place as another page, and permanently redirect to
 * it. Noida Extension is Greater Noida West (its official name); two pages for one place
 * split its search traffic, so the Greater Noida brief keeps one. The manifest builds no
 * page or link for a key here, and the Caddyfile sends its old URL to the new one.
 */
export const LOCALITY_REDIRECTS: Record<string, string> = {
  'noida/noida-extension': '/packers-and-movers/greater-noida/greater-noida-west',
};

const filled = (v: unknown): boolean =>
  typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : v != null;

/** The page as it should render: each field an editor filled in, the brief for the rest. */
export function mergeGeoPage(
  base: GeoPage,
  overrides: GeoPageOverrides | null | undefined,
): GeoPage {
  if (!overrides) return base;
  const out: GeoPage = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (filled(value)) (out as unknown as Record<string, unknown>)[key] = value;
  }
  return out;
}

/** Every string of a page with `{count}` filled in. */
export function geoPageWithCount(page: GeoPage, count: number): GeoPage {
  const fill = (v: unknown): unknown =>
    typeof v === 'string'
      ? v.replaceAll('{count}', String(count))
      : Array.isArray(v)
        ? v.map(fill)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
          : v;
  return fill(page) as GeoPage;
}

/**
 * The page for a place with no brief yet: plain, short and true - the place's own notes
 * from the CMS and its FAQs, and nothing invented. A brief (or the CMS "Page content"
 * fields) replaces it.
 */
export function fallbackGeoPage(opts: {
  /** "Delhi", or "Dwarka". */
  place: string;
  /** The parent city, for a locality. */
  city?: string;
  /** The place's editorial notes from the CMS, as plain paragraphs. */
  notes?: string[];
  faqs?: { question: string; answer: string }[];
}): GeoPage {
  const { place, city, notes = [], faqs = [] } = opts;
  const where = city ? `${place}, ${city}` : place;
  return {
    title: `Packers and Movers in ${where}`,
    metaDescription: `Packers and movers in ${where}: one fixed, written price after a video survey, our own trained crews, and delivery anywhere in India.`,
    h1: `Packers and movers in ${place} with one fixed, written price`,
    subhead: `One fixed, written price after a short video survey, and our own trained crews. We pick up in ${place} and deliver anywhere in India.`,
    trust: [],
    sections: notes.length
      ? [
          {
            heading: `Moving in ${place}: what our crews plan for`,
            blocks: [{ kind: 'text', body: notes.join('\n\n') }],
          },
        ]
      : [],
    faqHeading: `Packers and movers in ${place}: questions`,
    faqs,
    servicesHeading: `Moving services in ${place}`,
    nearbyHeading: city ? `Other areas we cover in ${city}` : 'Other cities we serve',
    nearbyIntro: '',
    routes: [],
    ctaHeading: `Moving in or out of ${place}? Get one written price.`,
    ctaText: 'Tell us what you are moving and where. A real person calls you back.',
  };
}
