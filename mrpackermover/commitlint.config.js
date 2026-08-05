/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['web', 'cms', 'db', 'seo', 'shared', 'ui-tokens', 'config', 'scripts', 'ci', 'docs', 'deps'],
    ],
  },
};
