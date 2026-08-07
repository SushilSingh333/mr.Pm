import type { Field } from 'payload';

/**
 * Latitude/longitude stored as plain numbers. A migration adds a generated
 * PostGIS `geo geography(Point,4326)` column derived from these, plus a GiST
 * index, so the internal-linking distance queries (packages/db/postgis.ts) run
 * on true metres. Kept as separate lat/lng in the CMS for editor clarity.
 */
export const latLngFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'lat',
        type: 'number',
        min: -90,
        max: 90,
        admin: {
          width: '50%',
          step: 0.000001,
          description: 'Optional — auto-filled from the name via Google. Leave blank.',
        },
      },
      {
        name: 'lng',
        type: 'number',
        min: -180,
        max: 180,
        admin: { width: '50%', step: 0.000001 },
      },
    ],
  },
];
