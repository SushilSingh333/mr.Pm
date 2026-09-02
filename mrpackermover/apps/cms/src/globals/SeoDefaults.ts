import type { GlobalConfig, Field } from 'payload';
import { isAuthenticated } from '../access/index.js';
import { hasToken, tokensUsed } from '@mpm/seo';

/**
 * The one screen that titles every generated page (Doc 02 §9).
 *
 * Each page type gets a title + description template written with {tokens}. The
 * build fills the tokens per page, so one edit here moves every page of that type
 * — 41 locality pages get 41 distinct titles, not the same one 41 times.
 *
 * Leave a template blank and that page type keeps the hardcoded copy in
 * `@mpm/seo/meta`. Nothing here is required; an empty global builds today's site.
 */

interface TypeSpec {
  name: string;
  label: string;
  tokens: string[];
  /** More than one page of this type exists, so a token-less template would duplicate. */
  many: boolean;
  titleExample: string;
  descriptionExample: string;
}

const TYPES: TypeSpec[] = [
  {
    name: 'cityHub',
    label: 'City pages  (/packers-and-movers/delhi)',
    tokens: ['city', 'brand'],
    many: true,
    titleExample: 'Packers and Movers in {city} – {brand}',
    descriptionExample:
      'Moving in {city}? Fixed written quotes, verified crews and published rate cards. Get your price before you book.',
  },
  {
    name: 'locality',
    label: 'Locality pages  (/packers-and-movers/delhi/dwarka)',
    tokens: ['locality', 'city', 'brand'],
    many: true,
    titleExample: 'Packers and Movers in {locality}, {city} – {brand}',
    descriptionExample:
      'Packers and movers in {locality}, {city}. Fixed written quotes, verified crews, no surprises on moving day.',
  },
  {
    name: 'cityService',
    label: 'Service-in-city pages  (/packers-and-movers/delhi/home-shifting)',
    tokens: ['service', 'city', 'brand', 'priceFrom', 'jobs12m', 'onTimePct'],
    many: true,
    titleExample: '{service} in {city} – Fixed Quotes, {brand}',
    descriptionExample:
      '{service} in {city} from ₹{priceFrom}. {jobs12m} moves completed, {onTimePct}% on time. Fixed quote, no surprises.',
  },
  {
    name: 'serviceHub',
    label: 'Service pages  (/services/home-shifting)',
    tokens: ['service', 'brand'],
    many: true,
    titleExample: '{service} Services in India – {brand}',
    descriptionExample:
      '{service} across India with fixed, written quotes and verified crews. See what is included and get your price.',
  },
  {
    name: 'route',
    label: 'Route pages  (/routes/delhi-to-mumbai)',
    tokens: ['origin', 'destination', 'brand'],
    many: true,
    titleExample: '{origin} to {destination} Packers and Movers – {brand}',
    descriptionExample:
      'Moving from {origin} to {destination}? Fixed intercity quotes, tracked transit and verified crews.',
  },
];

/** Blank is fine. A filled template must interpolate at least one known token. */
function validateTemplate(spec: TypeSpec, limit: number) {
  return (value: unknown): true | string => {
    if (typeof value !== 'string' || !value.trim()) return true;
    if (value.length > limit)
      return `Keep this under ${limit} characters (currently ${value.length}).`;
    const unknown = tokensUsed(value).filter((t) => !spec.tokens.includes(t));
    if (unknown.length > 0) {
      return `Unknown token${unknown.length > 1 ? 's' : ''} {${unknown.join('}, {')}}. Available here: {${spec.tokens.join('}, {')}}.`;
    }
    if (spec.many && !hasToken(value)) {
      return `This template covers every page of this type, so it must include a token like {${spec.tokens[0]}} — otherwise every page gets the same text.`;
    }
    return true;
  };
}

function groupFor(spec: TypeSpec): Field {
  const tokenList = `Tokens: {${spec.tokens.join('}, {')}}`;
  return {
    name: spec.name,
    type: 'group',
    label: spec.label,
    fields: [
      {
        name: 'titleTemplate',
        type: 'text',
        label: 'Title template',
        maxLength: 70,
        admin: {
          placeholder: spec.titleExample,
          description: `${tokenList}. Aim for 60 characters or fewer. Blank = keep the built-in title.`,
        },
        validate: validateTemplate(spec, 70),
      },
      {
        name: 'descriptionTemplate',
        type: 'textarea',
        label: 'Description template',
        maxLength: 180,
        admin: {
          placeholder: spec.descriptionExample,
          description: `${tokenList}. Aim for 140–160 characters. If a token has no value for a page (e.g. {priceFrom} on a city with no rate card), that page ships no description rather than a broken one.`,
        },
        validate: validateTemplate(spec, 180),
      },
    ],
  };
}

export const SeoDefaults: GlobalConfig = {
  slug: 'seo-defaults',
  label: 'SEO defaults',
  admin: {
    group: 'Settings',
    description:
      'Titles and descriptions for every generated page. Written once here with {tokens}; the build fills them in per page. Anything typed on an individual city, service or lane overrides what is here.',
  },
  access: { read: () => true, update: isAuthenticated },
  fields: TYPES.map(groupFor),
};

export const SEO_DEFAULT_TYPES = TYPES;
