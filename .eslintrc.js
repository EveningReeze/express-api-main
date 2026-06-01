module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
  },
  extends: [
    'airbnb-base', 
  ],
  parserOptions: {
    ecmaVersion: 2018, 
  },
  rules: {
   
    'semi': ['error', 'always'],
    'no-console': 'off',
  }
};