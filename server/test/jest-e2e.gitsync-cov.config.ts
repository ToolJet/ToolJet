/** @jest-config-loader ts-node */
import type { Config } from '@jest/types';
import baseConfig from './jest-e2e.config';

/**
 * Git-sync-focused e2e coverage config.
 *
 * Extends the standard e2e config but:
 *   - runs ONLY the git-sync e2e specs (testRegex narrowed), and
 *   - narrows collectCoverageFrom to the git-sync source surface (EE providers +
 *     CE stubs) so the report is just the git-sync files instead of all of src/**+ee/**.
 *
 * The GitLab spec self-skips at runtime when the GitLab env (TEST_GITLAB_TOKEN + a
 * GitLab-shaped simulator) is absent, so files under `**\/providers/gitlab/**` read as
 * uncovered here unless you export that env first. It is no longer quarantined — no
 * `--testPathIgnorePatterns` override is needed (see lifecycle-cases.md § "Coverage").
 *
 * Usage (git + DB env must be exported first, e.g. `set -a; source ../.env.test; set +a`):
 *   NODE_ENV=test npx jest --config test/jest-e2e.gitsync-cov.config.ts --runInBand --coverage
 *   # or: npm run test:e2e:cov:gitsync
 */
const GITSYNC_COVERAGE_GLOBS = [
  // EE (the real git-sync logic)
  'ee/git-sync/**/*.ts',
  'ee/platform-git-sync/**/*.ts',
  'ee/git-sync-configs/**/*.ts',
  'ee/workspace-branches/**/*.ts',
  'ee/app-git/**/*.ts',
  // CE modules / stubs the EE code extends
  'src/modules/git-sync/**/*.ts',
  'src/modules/git-sync-configs/**/*.ts',
  'src/modules/platform-git-sync/**/*.ts',
  'src/modules/workspace-branches/**/*.ts',
  'src/modules/app-git/**/*.ts',
  // Git-sync logic that lives outside the main dirs
  'ee/git-sync-webhooks/**/*.ts',
  'ee/organization-env/services/gitsync.util.service.ts',
  'ee/data-sources/guards/git-sync-datasource.guard.ts',
  'ee/data-queries/guards/git-sync-query-edit.guard.ts',
  'src/helpers/platform-git-pull-registry.ts',
  // Same schema/glue exclusions the shared coverage config uses
  '!**/*.module.ts',
  '!**/*.entity.ts',
  '!**/*.dto.ts',
  // Non-logic: interfaces, type decls, DTO barrels
  '!**/*.interface.ts',
  '!**/interfaces/**',
  '!**/Interfaces/**',
  '!**/types/**',
  '!**/dto/**',
  // CE no-op stubs that the EE classes override — dead code in an EE run, so they'd
  // otherwise read as permanent 0% noise. (Real CE code — controllers, repositories,
  // abilities/guards, base classes, provider-descriptors — is kept.)
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
  // Only the git-sync + git-sync-webhooks e2e specs (the base runs every e2e spec).
  testRegex: 'test/modules/(git-sync|git-sync-webhooks)/e2e/.*spec\\.ts$',
  collectCoverageFrom: GITSYNC_COVERAGE_GLOBS,
  coverageDirectory: '<rootDir>/coverage-gitsync',
  // Report every reporter locally; text-summary prints the headline numbers to stdout.
  coverageReporters: ['text', 'text-summary', 'html', 'lcovonly', 'json-summary'],
};

export default config;
