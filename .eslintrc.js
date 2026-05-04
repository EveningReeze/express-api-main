module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true,
  },
  extends: [
    'airbnb-base', // 使用 Airbnb 风格
  ],
  parserOptions: {
    ecmaVersion: 2018, // 注意这里是 2018
  },
  rules: {
    // 这里是自定义规则区域
    // 例如：强制使用分号，禁止使用 console
    'semi': ['error', 'always'],
    'no-console': 'off',
  }
};