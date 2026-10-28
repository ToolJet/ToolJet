/** @jest-config-loader ts-node */
import base from '../jest.config';
import * as path from 'path';
import * as aiCoverageScope from '../../scripts/ai-coverage-scope.cjs';

const isCE = process.env.TOOLJET_EDITION === 'ce';
export default {
  ...base,
  rootDir: path.resolve(__dirname, '..'),
  testRegex: 'test/modules/ai/unit/.*spec\\.ts$',
  // AI specs use mocks or their own random PostgreSQL schemas. Never run the
  // application's global table truncation for this focused suite.
  globalSetup: '<rootDir>/test/ai-global-setup.ts',
  setupFilesAfterEnv: [],
  testPathIgnorePatterns: ['/node_modules/', ...(isCE ? ['/ee/'] : [])],
  collectCoverageFrom: aiCoverageScope.backend(isCE ? 'ce' : 'ee'),
  coverageDirectory: `<rootDir>/coverage-ai/${isCE ? 'ce' : 'ee'}`,
  coverageReporters: ['json', 'json-summary', 'lcovonly', 'html'],
};
