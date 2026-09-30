import base from '@mpm/config/eslint';

export default [
  ...base,
  {
    // '.next-dev' is the dev server's build output (see next.config.mjs); it is
    // generated code and must be ignored exactly like '.next'.
    // '.next-*/**' covers a second dev server's output via NEXT_DIST_DIR (see
    // next.config.mjs). Without it, linting the repo after such a run reports hundreds of
    // errors in generated vendor chunks and buries anything real.
    ignores: ['.next/**', '.next-*/**', 'src/payload-types.ts', 'src/app/**'],
  },
];
