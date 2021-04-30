module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  
  parser: 'babel-eslint',

  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  extends: [
    'plugin:react/recommended',
    'prettier',
    'airbnb-base/legacy'
  ],
  plugins: ['html', 'react', 'prettier', 'babel'],
  rules: {
    "react/prop-types": 0,
    "no-underscore-dangle":  ["error", { "allow": ["_self"] }],
    "max-len": 0,
    "no-bitwise": 0,
    "no-use-before-define": ["error", { "variables": false, "functions": false }],
    "no-nested-ternary": 0,
    "no-loop-func": 0,
    
  },
  settings: {
    react: {
      version: "detect"
    }
  }
};
