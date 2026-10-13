import type { Block, CollectionConfig, Field } from 'payload';
import {
  hideFromSalesRoles,
  isContentStaff,
  publishedOrStaff,
  contentReadVersions,
} from '../access/index.js';
import { geoPageField } from '../fields/service-page.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';

type Ref = string | number | { id: string | number } | null | undefined;
const refId = (r: Ref): string | null =>
  r == null ? null : String(typeof r === 'object' ? r.id : r);

/**
 * The text of one "{Service} in {City}" page (/packers-and-movers/<city>/<service>), e.g.
 * Home Shifting in Noida. The page is written in code (packages/shared/src/
 * city-service-pages); every field here left blank, or list left empty, shows that text,
 * and a filled one replaces it. `import-city-service-pages` copies the written text in, so
 * an editor starts from the real page rather than an empty form.
 *
 * Whether the page exists at all is still decided on the city (Services offered) and the
 * service; this record only holds its words. Title and description live on the city, in
 * "Service-in-city SEO overrides", so they stay in one place.
 */
const scopeBlock: Block = {
  slug: 'svcScope',
  labels: { singular: "What's included lists", plural: "What's included lists" },
  fields: [
    {
      name: 'note',
      type: 'text',
      admin: {
        readOnly: true,
        placeholder:
          'Shows the service\'s "What\'s included" and "What costs extra" lists (Services → this service).',
      },
    },
  ],
};
type Named = Field & { name?: string; fields?: Field[]; blocks?: Block[] };
const bodyFields = (geoPageField as { fields: Field[] }).fields
  // Societies belong to an area page, not to a service page.
  .filter((f) => (f as Named).name !== 'societies')
  // A service page can also show the service's own "What's included" lists.
  .map((f) =>
    (f as Named).name === 'sections'
      ? ({
          ...f,
          fields: ((f as Named).fields ?? []).map((g) =>
            (g as Named).name === 'blocks'
              ? ({ ...g, blocks: [...((g as Named).blocks ?? []), scopeBlock] } as Field)
              : g,
          ),
        } as Field)
      : f,
  );

export const CityServicePages: CollectionConfig = {
  slug: 'city-service-pages',
  labels: { singular: 'City service page', plural: 'City service pages' },
  admin: {
    hidden: hideFromSalesRoles,
    useAsTitle: 'name',
    group: 'Geography',
    defaultColumns: ['name', 'city', 'service', 'updatedAt'],
    listSearchableFields: ['name'],
    description:
      'The text of each "{Service} in {City}" page, e.g. Home Shifting in Noida. Blank fields show the written page.',
  },
  versions: { drafts: true },
  access: {
    read: publishedOrStaff,
    readVersions: contentReadVersions,
    create: isContentStaff,
    update: isContentStaff,
    delete: isContentStaff,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        if (!data) return data;
        const cityId = refId((data.city ?? originalDoc?.city) as Ref);
        const serviceId = refId((data.service ?? originalDoc?.service) as Ref);
        if (!cityId || !serviceId) return data;
        // One record per city and service: a second would leave it unclear which text shows.
        const twin = await req.payload.find({
          collection: 'city-service-pages',
          where: {
            and: [
              { city: { equals: cityId } },
              { service: { equals: serviceId } },
              ...(originalDoc?.id != null ? [{ id: { not_equals: originalDoc.id } }] : []),
            ],
          },
          limit: 1,
          depth: 0,
          draft: true,
          overrideAccess: true,
        });
        if (twin.docs.length) {
          throw new Error('This city already has a page for this service. Edit that one.');
        }
        // The list title, e.g. "Home Shifting in Noida".
        const [city, service] = await Promise.all([
          req.payload
            .findByID({ collection: 'locations', id: cityId, depth: 0, draft: true })
            .catch(() => null),
          req.payload
            .findByID({ collection: 'services', id: serviceId, depth: 0, draft: true })
            .catch(() => null),
        ]);
        if (city?.name && service?.name) data.name = `${service.name} in ${city.name}`;
        return data;
      },
    ],
    afterChange: [triggerBuildOnChange],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Page',
      admin: { readOnly: true, description: 'Filled in from the city and the service.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'relationship',
          relationTo: 'locations',
          required: true,
          index: true,
          filterOptions: { type: { equals: 'city' } },
          admin: { width: '50%' },
        },
        {
          name: 'service',
          type: 'relationship',
          relationTo: 'services',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'h1',
      type: 'text',
      label: 'Main heading (H1)',
      admin: {
        description:
          'Blank shows the written heading. Keep the service and the city in it, e.g. "Home shifting in Noida".',
      },
    },
    {
      ...geoPageField,
      admin: {
        description:
          'Everything on the page below the heading. Leave a field blank, or a list empty, to show the written page. A list with rows replaces the whole written list.',
      },
      fields: bodyFields,
    } as Field,
  ],
};
