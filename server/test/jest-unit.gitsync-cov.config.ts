/** @jest-config-loader ts-node */
import type { Config } from '@jest/types';
import baseConfig from '../jest.config';

/**
 * Git-sync UNIT coverage config — the unit-suite counterpart to jest-e2e.gitsync-cov.config.ts.
 *
 * Runs the git-sync unit specs with the SAME collectCoverageFrom surface as the e2e coverage
 * config, emitting lcov.info so the two runs can be merged into one combined figure
 * (scripts/merge-lcov.mjs). Unit-only, host-free, ~seconds.
 */
const GITSYNC_COVERAGE_GLOBS = [
  'ee/git-sync/**/*.ts',
  'ee/platform-git-sync/**/*.ts',
  'ee/git-sync-configs/**/*.ts',
  'ee/workspace-branches/**/*.ts',
  'ee/app-git/**/*.ts',
  'src/modules/git-sync/**/*.ts',
  'src/modules/git-sync-configs/**/*.ts',
  'src/modules/platform-git-sync/**/*.ts',
  'src/modules/workspace-branches/**/*.ts',
  'src/modules/app-git/**/*.ts',
  'ee/git-sync-webhooks/**/*.ts',
  'ee/organization-env/services/gitsync.util.service.ts',
  'ee/data-sources/guards/git-sync-datasource.guard.ts',
  'ee/data-queries/guards/git-sync-query-edit.guard.ts',
  'src/helpers/platform-git-pull-registry.ts',
  '!**/*.module.ts',
  '!**/*.entity.ts',
  '!**/*.dto.ts',
  '!**/*.interface.ts',
  '!**/interfaces/**',
  '!**/Interfaces/**',
  '!**/types/**',
  '!**/dto/**',
  '!src/modules/platform-git-sync/**',
  '!src/modules/**/providers/**',
  '!src/modules/app-git/shared/**',
  '!src/modules/app-git/listener.ts',
  '!src/modules/app-git/source-control-provider.ts',
  '!src/modules/git-sync/service.ts',
  '!src/modules/git-sync/util.service.ts',
  '!src/modules/git-sync/git-sync-adapter.ts',
  '!src/modules/git-sync/workspace-git-sync-adapter.ts',
  '!src/modules/git-sync/git-mirror-warmer.service.ts',
  '!src/modules/git-sync-configs/services/**',
  '!src/modules/workspace-branches/git-sync-queue.processor.ts',
  '!src/modules/workspace-branches/git-sync-queue.service.ts',
  '!src/modules/workspace-branches/deletion-commit.listener.ts',
];

const config: Config.InitialOptions = {
  ...baseConfig,
  rootDir: '..',
  testPathIgnorePatterns: ['/node_modules/'],
  // Only the git-sync-family unit specs.
  testRegex:
    'test/modules/(git-sync|git-sync-configs|git-sync-webhooks|platform-git-sync|workspace-branches|app-git)/unit/.*spec\\.ts$',
  collectCoverage: true,
  collectCoverageFrom: GITSYNC_COVERAGE_GLOBS,
  coverageProvider: 'v8',
  coverageDirectory: '<rootDir>/coverage-gitsync-unit',
  coverageReporters: ['lcovonly', 'json-summary', 'text-summary'],
};

export default config;
