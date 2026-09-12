/**
 * Translating a lead's service into a proposal's Service type.
 *
 * The two use different vocabularies. The website asks the customer what they are
 * moving ("Home Shifting", "Office Shifting", "Car Transport"); the proposal classifies
 * the job for the quote ("Domestic Household", "Office / Commercial", "Vehicle
 * Transport"). Copying the lead's text straight across would put a value in the select
 * that is not one of its options, which stores fine and then renders as blank.
 *
 * Deliberately no imports, so both the collection (server) and the autofill component
 * (client) can use the same map rather than keeping two that drift.
 */

/** The proposal's Service type options. Keep in step with SERVICE_OPTIONS. */
export type ProposalService =
  | 'Domestic Household'
  | 'International'
  | 'Local / Within City'
  | 'Office / Commercial'
  | 'Vehicle Transport';

/** What the proposal's `svc` field starts as before anyone chooses. */
export const DEFAULT_PROPOSAL_SERVICE: ProposalService = 'Domestic Household';

/**
 * Matched on keywords rather than exact strings: the lead's service is free text that
 * has already been through two rounds of renaming, and an unrecognised value should
 * leave the field alone rather than guess.
 */
export function proposalServiceFor(leadService: unknown): ProposalService | null {
  const s = String(leadService ?? '')
    .toLowerCase()
    .trim();
  if (!s) return null;
  if (s.includes('office') || s.includes('commercial') || s.includes('corporate')) {
    return 'Office / Commercial';
  }
  if (s.includes('international')) return 'International';
  if (s.includes('car') || s.includes('bike') || s.includes('vehicle')) {
    return 'Vehicle Transport';
  }
  // Home shifting, packing/unpacking and loading/unloading are all household jobs.
  if (s.includes('home') || s.includes('household') || s.includes('pack') || s.includes('load')) {
    return 'Domestic Household';
  }
  return null;
}

/**
 * Short forms for the details strip on the proposal PDF.
 *
 * Those four chips get about 85pt each, and "Domestic Household" needs 95 at the chip's
 * type size - so it was rendering as "Domestic House..", which looks like a bug on a
 * document a customer keeps. Shortening the word beats shrinking the type: the chip is
 * a glance-level summary and the full classification is not information the customer
 * needs there.
 */
const SHORT: Record<string, string> = {
  'Domestic Household': 'Household',
  'Local / Within City': 'Local',
  'Office / Commercial': 'Office',
  'Vehicle Transport': 'Vehicle',
  International: 'International',
};

/** Falls through unchanged for anything not in the map, including a custom value. */
export const shortProposalService = (v: unknown): string => {
  const s = String(v ?? '');
  return SHORT[s] ?? s;
};
