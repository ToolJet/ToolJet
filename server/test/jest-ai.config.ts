/** @jest-config-loader ts-node */
import base from '../jest.config';
import * as path from 'path';
import * as aiCoverageScope from '../../scripts/ai-coverage-scope.cjs';

import { editionFor } from '../../scripts/ai-test-scope.cjs';
const isCE = editionFor('server') === 'ce';
export default {
  ...base,
  rootDir: path.resolve(__dirname, '..'),
  testRegex: 'test/modules/ai/unit/.*spec\\.ts$',
  // AI specs use mocks or their own random PostgreSQL schemas. Never run the
  // application's global table truncation for this focused suite.
  globalSetup: '<rootDir>/test/ai-global-setup.ts',
  setupFilesAfterEnv: [],
  testPathIgnorePatterns: ['/node_modules/', ...(isCE ? ['<rootDir>/ee/'] : [])],
  collectCoverageFrom: aiCoverageScope.backend(isCE ? 'ce' : 'ee'),
  coverageDirectory: `<rootDir>/coverage-ai/${editionFor('server')}`,
  coverageReporters: ['json', 'json-summary', 'lcovonly', 'html'],
};
