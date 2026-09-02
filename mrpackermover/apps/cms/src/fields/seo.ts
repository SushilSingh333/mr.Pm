import type { Field } from 'payload';

/**
 * The per-record SEO override (Doc 02 §9). Blank means "use Settings → SEO
 * defaults"; anything typed here wins for this page and only this page.
 *
 * Lengths are capped at the manifest schema's ceiling (title 70, description 180)
 * so an over-long entry is refused in the editor rather than failing the build an
 * hour later. The 60 / 140–160 targets are guidance, not a hard stop.
 */
export function seoOverrideFields(what: string): Field {
  return {
    type: 'collapsible',
    label: 'SEO  (optional — leave blank to use the defaults)',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'metaTitle',
        type: 'text',
        label: 'Meta title',
        maxLength: 70,
        admin: {
          description: `Overrides the title template for ${what}. Aim for 60 characters or fewer. Blank = use Settings → SEO defaults.`,
        },
      },
      {
        name: 'metaDescription',
        type: 'textarea',
        label: 'Meta description',
        maxLength: 180,
        admin: {
          description: `Overrides the description template for ${what}. Aim for 140–160 characters. Blank = use Settings → SEO defaults.`,
        },
      },
    ],
  };
}

/**
 * Per-(city × service) overrides, e.g. "Home Shifting in Delhi". Those pages are a
 * crossing of two records, so there is no single row to hang the fields on — this
 * array on the city names the service explicitly. Rows for services the city does
 * not offer are ignored by the build.
 */
export const cityServiceSeoField: Field = {
  name: 'serviceSeo',
  type: 'array',
  label: 'Service-in-city SEO overrides',
  admin: {
    initCollapsed: true,
    description:
      'Optional. Override the title/description of one “{Service} in {City}” page. Leave empty and those pages use Settings → SEO defaults.',
    condition: (data) => data?.type === 'city',
  },
  fields: [
    {
      name: 'service',
      type: 'relationship',
      relationTo: 'services',
      required: true,
      admin: { description: 'Which service page in this city this override applies to.' },
    },
    { name: 'metaTitle', type: 'text', label: 'Meta title', maxLength: 70 },
    { name: 'metaDescription', type: 'textarea', label: 'Meta description', maxLength: 180 },
  ],
};
