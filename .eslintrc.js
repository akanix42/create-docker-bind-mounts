module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    parser: 'typescript-eslint-parser',

  },
  extends: [
    'plugin:prettier/recommended',
    'eslint:recommended',
  ],
  rules: {
    'no-console': 0,
  }
};
