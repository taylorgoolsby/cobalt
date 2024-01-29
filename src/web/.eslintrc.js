// const { specifiedRules } = require('graphql');
// const without = require('lodash.without');
// const allGraphQLValidatorNames = specifiedRules.map(rule => rule.name);

module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'import/no-unresolved': [
      2,
      {
        commonjs: true,
      },
    ],
    // "graphql/template-strings": ["error", {
    //   "env": "fraql",
    //   validators: without(
    //     allGraphQLValidatorNames,
    //     'KnownFragmentNames',
    //     'NoUnusedFragments',
    //     'NoUnusedVariables',
    //     'ExecutableDefinitions',
    //     'KnownDirectives'
    //   ),
    //   "schemaJson": require('../web/schema.json')
    // }]
  },
  plugins: [
    'import',
    // "graphql"
  ],
}
