const path = require('path');
const base = require('./jest.config');
const edition = process.env.TOOLJET_EDITION || 'ee';
module.exports = {
  ...base,
  rootDir: __dirname,
  testMatch: [
    '<rootDir>/src/**/__tests__/ai*.spec.[jt]s?(x)',
    ...(edition === 'ce'
      ? []
      : [
          '<rootDir>/ee/modules/AiBuilder/**/__tests__/**/*.spec.[jt]s?(x)',
          '<rootDir>/ee/modules/InstanceSettings/pages/ManageLLMKeyPage/**/__tests__/**/*.spec.[jt]s?(x)',
          '<rootDir>/ee/modules/WorkspaceSettings/components/ApiKeyContainer/**/__tests__/**/*.spec.[jt]s?(x)',
        ]),
  ],
  collectCoverageFrom: require('../scripts/ai-coverage-scope.cjs').frontend(edition),
  coverageDirectory: path.join(__dirname, 'coverage-ai', edition),
  coverageReporters: ['json', 'json-summary', 'lcovonly', 'html'],
};
