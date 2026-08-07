import type { GlobalConfig } from 'payload';
import { PAGE_TYPE_TO_SHARD } from '@mpm/shared';
import { isAuthenticated } from '../access/index.js';
import { triggerBuildForShard } from '../hooks/trigger-build.js';

/**
 * Editable marketing copy for the home page, so the hero, the trust pillars, and
 * every section heading are controlled from the CMS rather than hardcoded. The home
 * template reads this (via the manifest); leaving a field blank falls back to the
 * built-in default.
 */
export const HomeContent: GlobalConfig = {
  slug: 'home-content',
  label: 'Home page content',
  admin: { group: 'Content' },
  access: { read: () => true, update: isAuthenticated },
  hooks: { afterChange: [triggerBuildForShard(PAGE_TYPE_TO_SHARD.home)] },
  fields: [
    {
      type: 'collapsible',
      label: 'Hero',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'taglineLine1',
              type: 'text',
              defaultValue: 'Shifting Aapki,',
              admin: { width: '50%' },
            },
            {
              name: 'taglineLine2',
              type: 'text',
              defaultValue: 'Zimmedari Hamari.',
              admin: { width: '50%' },
            },
          ],
        },
        { name: 'heroSubtext', type: 'textarea' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Section headings',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'servicesHeading',
              type: 'text',
              defaultValue: 'What we move',
              admin: { width: '50%' },
            },
            { name: 'servicesIntro', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'trustHeading',
              type: 'text',
              defaultValue: 'House Shifting you can actually verify',
              admin: { width: '50%' },
            },
            { name: 'trustIntro', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'statsHeading',
              type: 'text',
              defaultValue: 'By the numbers',
              admin: { width: '50%' },
            },
            { name: 'statsIntro', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'citiesHeading',
              type: 'text',
              defaultValue: 'Cities we serve',
              admin: { width: '50%' },
            },
            { name: 'citiesIntro', type: 'text', admin: { width: '50%' } },
          ],
        },
        { name: 'faqHeading', type: 'text', defaultValue: 'Questions people ask' },
      ],
    },
    {
      name: 'pillars',
      type: 'array',
      label: 'Trust pillars ("why us")',
      admin: { description: 'Leave empty to use the built-in four pillars.' },
      fields: [
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'fixed-quote',
          options: [
            'fixed-quote',
            'verified-crew',
            'claims',
            'insurance',
            'shield-check',
            'check',
            'clock',
          ].map((v) => ({ label: v, value: v })),
        },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'default',
          admin: {
            description: 'Bento position. A good set is one Lead + one Dark + two Default.',
          },
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Lead (wide)', value: 'lead' },
            { label: 'Dark (tall)', value: 'dark' },
          ],
        },
        {
          name: 'link',
          type: 'group',
          admin: { description: 'Optional link under the card (e.g. the claims card → /claims).' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', admin: { width: '50%' } },
                { name: 'href', type: 'text', admin: { width: '50%' } },
              ],
            },
          ],
        },
      ],
    },
  ],
};
