/** @jest-config-loader ts-node */
import type { Config } from '@jest/types';
import * as path from 'path';
import base from '../jest.config';
import * as aiCoverageScope from '../../scripts/ai-coverage-scope.cjs';

import { editionFor } from '../../scripts/ai-test-scope.cjs';
const isCE = editionFor('server') === 'ce';
export default {
  ...base,
  rootDir: path.resolve(__dirname, '..'),
  // Keep main's edition projects and their distinct test helpers.
  projects: (base.projects as Config.InitialProjectOptions[]).map((project) => ({
    ...project,
    testRegex: 'test/modules/ai/unit/.*spec\\.ts$',
    // These specs use mocks or their own random schemas, never global truncation.
    globalSetup: '<rootDir>/test/ai-global-setup.ts',
    setupFilesAfterEnv: [],
  })),
  collectCoverageFrom: aiCoverageScope.backend(isCE ? 'ce' : 'ee'),
  coverageDirectory: `<rootDir>/coverage-ai/${editionFor('server')}`,
  coverageReporters: ['json', 'json-summary', 'lcovonly', 'html'],
};
