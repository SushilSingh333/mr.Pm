import type { CollectionConfig } from 'payload';
import { publishedOrStaff, isAuthenticated } from '../access/index.js';
import { slugField } from '../fields/slug.js';
import { latLngFields } from '../fields/geo.js';
import { triggerBuildOnChange } from '../hooks/trigger-build.js';
import { geocodeLocation } from '../hooks/geocode.js';

/**
 * The geo tree: state → city → locality. Pages are projections of these records.
 *
 * Managed hierarchically: create a city, save it, then add its localities from the
 * **Sub-locations** panel on the city — each new locality gets its `parent` filled in
 * and its `type` set automatically, so you never hunt through one flat list. The
 * distance-to-base is computed from PostGIS and stays internal (ADR-0004).
 */
export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: { singular: 'Location', plural: 'Locations (cities & localities)' },
  admin: {
    useAsTitle: 'name',
    group: 'Geography',
    defaultColumns: ['name', 'type', 'parent', 'isServiceable'],
    description:
      'Add a city (Type = City) and save it, then add its localities from the Sub-locations panel below.',
  },
  versions: { drafts: true },
  access: {
    read: publishedOrStaff,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        // When a sub-location is created from a city's "Sub-locations" panel, its
        // parent is pre-filled — default the type from the parent (city → locality,
        // state → city) so you don't have to set it by hand.
        if (data && !data.type && data.parent != null) {
          const parentId =
            typeof data.parent === 'object'
              ? (data.parent as { id?: string | number }).id
              : (data.parent as string | number);
          if (parentId != null) {
            const parent = await req.payload
              .findByID({ collection: 'locations', id: parentId, depth: 0 })
              .catch(() => null);
            if (parent?.type === 'city') data.type = 'locality';
            else if (parent?.type === 'state') data.type = 'city';
          }
        }
        return data;
      },
    ],
    // Auto-fill lat/lng from the location name via Google Geocoding (when a key is set),
    // so editors don't hand-enter coordinates.
    beforeChange: [geocodeLocation],
    afterChange: [triggerBuildOnChange],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        // Google Places Autocomplete in the admin — pick a city/area and it fills the
        // name + lat/lng. Degrades to a plain text box without a key.
        components: { Field: '/components/fields/PlaceAutocomplete#PlaceAutocomplete' },
      },
    },
    slugField('name'),
    {
      name: 'type',
      type: 'select',
      required: true,
      admin: {
        description: 'City for a serviceable city, Locality for an area within a city.',
      },
      options: [
        { label: 'State', value: 'state' },
        { label: 'City', value: 'city' },
        { label: 'Locality', value: 'locality' },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'locations',
      index: true,
      admin: {
        description: 'City for a locality; state for a city. Auto-filled when you add from a city.',
      },
    },
    ...latLngFields,
    { name: 'pincodes', type: 'text', hasMany: true },
    {
      name: 'populationTier',
      type: 'select',
      options: ['A', 'A-S', 'B'].map((v) => ({ label: v, value: v })),
    },
    {
      name: 'isServiceable',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Gates publication. A city/locality with no completed jobs is not serviceable.',
      },
    },
    {
      name: 'servicesOffered',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      admin: {
        description:
          'The services you offer in this city — each one gets its own “{Service} in {City}” page. Leave empty to fall back to the automatic data gate.',
        // Only cities offer services; localities inherit the city's.
        condition: (data) => data?.type === 'city',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Background photo for this location’s hero banner (also used as its card thumbnail). Uploaded to Cloudinary. Optional on a locality — leave it empty and the page uses its parent city’s photo. A city with none falls back to the built-in /images/hero/cities/<slug>.jpg file.',
        // States have no hero page of their own; cities and localities both do.
        condition: (data) => data?.type === 'city' || data?.type === 'locality',
      },
    },
    {
      name: 'editorialNote',
      type: 'richText',
      admin: {
        description:
          'The unique local operational notes (societies, lift rules, gate timings). The section that must exist or the page does not publish.',
      },
    },
    {
      name: 'sublocations',
      type: 'join',
      collection: 'locations',
      on: 'parent',
      label: 'Sub-locations',
      admin: {
        defaultColumns: ['name', 'isServiceable'],
        description:
          'Localities inside this city. “Add new” creates one with the parent (this city) and type filled in for you.',
        // A locality is a leaf — only show the panel on states and cities.
        condition: (data) => data?.type !== 'locality',
      },
    },
  ],
};
