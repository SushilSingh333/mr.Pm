import base from '@mpm/config/eslint';

export default [
  ...base,
  {
    // '.next-dev' is the dev server's build output (see next.config.mjs); it is
    // generated code and must be ignored exactly like '.next'.
    ignores: ['.next/**', '.next-dev/**', 'src/payload-types.ts', 'src/app/**'],
  },
];
