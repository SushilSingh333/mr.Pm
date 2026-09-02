import { resolveSeo, fillTemplate, hasToken } from '@mpm/seo';
import { SeoDefaults } from '../../apps/cms/src/globals/SeoDefaults.js';
import { fail, type CheckResult } from './load.js';

/**
 * Unit checks for the CMS title/description resolution (Doc 02 §9).
 *
 * The other gates read `dist`, so they only see what the committed sample manifest
 * produces — and the sample carries no CMS overrides. This gate exercises the
 * resolver directly, which is the only way the three-layer fallback and the
 * fail-closed token rule get covered before real data exists in production.
 */

interface Case {
  name: string;
  run: () => boolean;
  detail?: () => string;
}

/** Reach into the global's field config to test the same validators the admin runs. */
type FieldLike = {
  name?: string;
  fields?: FieldLike[];
  validate?: (value: unknown) => true | string;
};
function validatorFor(group: string, field: string): (value: unknown) => true | string {
  const groups = SeoDefaults.fields as unknown as FieldLike[];
  const found = (groups.find((g) => g.name === group)?.fields ?? []).find((f) => f.name === field);
  if (!found?.validate) throw new Error(`No validator for ${group}.${field}`);
  return found.validate;
}

const TPL = {
  titleTemplate: 'Movers in {city} – {brand}',
  descriptionTemplate: 'Moving in {city}?',
};
const TOKENS = { city: 'Delhi', brand: 'MPM' };

const cases: Case[] = [
  // ── token filling ────────────────────────────────────────────────────────
  {
    name: 'fills every token',
    run: () => fillTemplate('Movers in {city} – {brand}', TOKENS) === 'Movers in Delhi – MPM',
  },
  {
    name: 'formats numbers in the Indian system',
    run: () => fillTemplate('from ₹{p}', { p: 1250000 }) === 'from ₹12,50,000',
  },
  {
    name: 'FAILS CLOSED: a missing token drops the whole string',
    run: () => fillTemplate('from ₹{priceFrom}', { priceFrom: undefined }) === undefined,
  },
  {
    name: 'FAILS CLOSED: an empty-string token drops the whole string',
    run: () => fillTemplate('in {city}', { city: '' }) === undefined,
  },
  {
    name: 'zero is a value, not "missing"',
    run: () => fillTemplate('{n} moves', { n: 0 }) === '0 moves',
  },
  {
    name: 'hasToken distinguishes templated from flat',
    run: () => hasToken('a {b}') && !hasToken('a b'),
  },

  // ── layer order ──────────────────────────────────────────────────────────
  {
    name: 'layer 1: a record override beats the template',
    run: () =>
      resolveSeo({
        override: { metaTitle: 'Mine' },
        template: TPL,
        tokens: TOKENS,
        fallbackTitle: 'CODE',
      }).title === 'Mine',
  },
  {
    name: 'layer 2: the template applies when the override is blank',
    run: () =>
      resolveSeo({
        override: { metaTitle: '  ' },
        template: TPL,
        tokens: TOKENS,
        fallbackTitle: 'CODE',
      }).title === 'Movers in Delhi – MPM',
  },
  {
    name: 'layer 3: the code fallback applies when both are blank',
    run: () => resolveSeo({ tokens: TOKENS, fallbackTitle: 'CODE' }).title === 'CODE',
  },
  {
    name: 'a template with an unfillable token drops to the code fallback',
    run: () =>
      resolveSeo({
        template: { titleTemplate: '{service} in {city}' },
        tokens: { city: 'Delhi' },
        fallbackTitle: 'CODE',
      }).title === 'CODE',
  },
  {
    name: 'no description anywhere ⇒ undefined, never an empty tag',
    run: () => resolveSeo({ tokens: TOKENS, fallbackTitle: 'T' }).metaDescription === undefined,
  },
  {
    name: 'a broken data token keeps the data-driven fallback description',
    run: () =>
      resolveSeo({
        template: { descriptionTemplate: 'from ₹{priceFrom}' },
        tokens: {},
        fallbackTitle: 'T',
        fallbackDescription: 'DATA',
      }).metaDescription === 'DATA',
  },

  // ── manifest schema safety (title max 70, description max 180) ───────────
  {
    name: 'an over-long override is clamped, not left to fail parseManifest',
    run: () => {
      const r = resolveSeo({
        override: { metaTitle: 'x'.repeat(200), metaDescription: 'y'.repeat(300) },
        tokens: TOKENS,
        fallbackTitle: 'T',
      });
      return r.title.length <= 70 && (r.metaDescription ?? '').length <= 180;
    },
  },
  {
    name: 'a legal template that EXPANDS past 70 is still clamped',
    run: () =>
      resolveSeo({
        template: { titleTemplate: 'Packers and Movers Company in {city} – Fixed Written Quotes' },
        tokens: { city: 'Thiruvananthapuram' },
        fallbackTitle: 'F',
      }).title.length <= 70,
  },

  // ── the admin validators that stop duplicate titles at the source ────────
  {
    name: 'admin: a blank template is allowed (means "use the built-in")',
    run: () => validatorFor('cityHub', 'titleTemplate')('') === true,
  },
  {
    name: 'admin: a good template is accepted',
    run: () => validatorFor('cityHub', 'titleTemplate')('Movers in {city} – {brand}') === true,
  },
  {
    name: 'admin: REJECTS a token-less template (would duplicate every page)',
    run: () => typeof validatorFor('cityHub', 'titleTemplate')('Packers and Movers') === 'string',
  },
  {
    name: 'admin: REJECTS an unknown token',
    run: () => typeof validatorFor('cityHub', 'titleTemplate')('Movers in {ceety}') === 'string',
  },
  {
    name: 'admin: REJECTS a token not available on that page type',
    run: () => typeof validatorFor('cityHub', 'titleTemplate')('Movers in {locality}') === 'string',
  },
  {
    name: 'admin: allows {locality} on locality pages',
    run: () => validatorFor('locality', 'titleTemplate')('Movers in {locality}, {city}') === true,
  },
];

export function checkSeoResolution(): CheckResult {
  const messages: string[] = [];
  for (const c of cases) {
    let ok = false;
    try {
      ok = c.run();
    } catch (err) {
      messages.push(`${c.name} — threw: ${(err as Error).message}`);
      continue;
    }
    if (!ok) messages.push(c.name);
  }
  const result = fail('seo-resolution', messages);
  if (result.ok) result.messages.push(`(${cases.length} checks)`);
  return result;
}
