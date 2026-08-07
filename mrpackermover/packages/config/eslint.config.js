import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

/**
 * Shared flat ESLint config for the whole monorepo.
 * Import from a package/app `eslint.config.js` and append project-specific rules.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'build/**', '.next/**', '.astro/**', '**/payload-types.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // Require === everywhere EXCEPT `x != null` / `x == null`, which is the
      // idiomatic combined null+undefined check we use deliberately.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    // Astro requires triple-slash reference directives in its env.d.ts.
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  {
    // jsx-a11y's `label-has-associated-control` checks for JSX's `htmlFor`, but Astro
    // templates use native HTML `for`/`id` (and wrapping labels). The associations ARE
    // present and correct — the rule just can't see `for`, so it false-positives on every
    // labelled input. Disable the mismatched check for .astro; real a11y is unaffected.
    files: ['**/*.astro'],
    rules: {
      'jsx-a11y/label-has-associated-control': 'off',
      // `role="list"` on a `<ul>` is redundant per ARIA, but it's a deliberate workaround:
      // `list-style: none` (which these card grids use) makes Safari/VoiceOver drop list
      // semantics, and `role="list"` restores them. Keep the intentional roles.
      'jsx-a11y/no-redundant-roles': 'off',
    },
  },
  {
    // ADR-0003 / ADR-0004: ban the two patterns that reintroduce the incumbent's failures.
    files: ['apps/web/src/pages/**/*.astro'],
    rules: {
      // A catch-all route with a DB lookup reintroduces the infinite URL space.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\[\\.\\.\\..*\\]/]',
          message:
            'No [...slug] catch-all routes. Every valid URL must be a manifest row (ADR-0003).',
        },
      ],
    },
  },
);
