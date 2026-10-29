const path = require('path');
const base = require('./jest.config');
const edition = require('../scripts/ai-test-scope.cjs').editionFor('frontend');
module.exports = {
  ...base,
  rootDir: __dirname,
  testMatch: require('../scripts/ai-test-scope.cjs')
    .findAiTests('frontend')
    .filter(
      (file) =>
        file.includes('/__tests__/') &&
        /\.spec\.[jt]sx?$/.test(file) &&
        (edition !== 'ce' || !file.startsWith(path.join(__dirname, 'ee') + path.sep))
    ),
  collectCoverageFrom: require('../scripts/ai-coverage-scope.cjs').frontend(edition),
  coverageDirectory: path.join(__dirname, 'coverage-ai', edition),
  coverageReporters: ['json', 'json-summary', 'lcovonly', 'html'],
};
