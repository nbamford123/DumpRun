module.exports = {
    env: {
      node: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:node/recommended',
      'plugin:aws-lambda/recommended',
      'plugin:prettier/recommended',
    ],
    parserOptions: {
      ecmaVersion: 12,
    },
    rules: {
      // Add any custom rules here
    },
  };