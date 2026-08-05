import base from '@mpm/config/eslint';

export default [
  ...base,
  {
    ignores: ['.next/**', 'src/payload-types.ts', 'src/app/**'],
  },
];
