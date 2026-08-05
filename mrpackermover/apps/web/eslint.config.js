import base from '@mpm/config/eslint';

export default [
  ...base,
  {
    ignores: ['dist/**', '.astro/**'],
  },
];
