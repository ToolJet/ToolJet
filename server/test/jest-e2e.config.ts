/** @jest-config-loader ts-node */
import type { Config } from '@jest/types';
import { coverageConfig } from './jest-coverage.config';

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],
  // rootDir is server/ (not server/test/) so the v8 coverage provider — which
  // hard-filters collected coverage to files under rootDir — doesn't drop every
  // src/** and ee/** file before collectCoverageFrom even gets consulted.
  rootDir: '..',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/test/jest-global-setup.ts',
  setupFiles: ['<rootDir>/test/jest-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-transaction-setup.ts', '<rootDir>/test/jest-retry-setup.ts'],
  testRegex: 'test/modules/.*/e2e/.*spec\\.ts$',
  // Explicitly setting this key drops Jest's own default ('/node_modules/'), so it's
  // restored here — rootDir now covers server/node_modules too.
  // NOTE: git-sync-gitlab.spec.ts is NOT quarantined — it self-guards, skipping the whole
  // suite at runtime when the GitLab env (TEST_GITLAB_TOKEN et al.) is absent instead of
  // throwing at import, so it runs for real wherever the GitLab simulator env is configured.
  testPathIgnorePatterns: ['/node_modules/', 'modules/workflows/e2e/workflow-lifecycle\\.e2e-spec\\.ts$'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  runner: 'groups',
  testTimeout: 60000,
  verbose: true,
  slowTestThreshold: 0,
  transformIgnorePatterns: [
    'node_modules/(?!(lib0|y-protocols|@octokit|before-after-hook|universal-user-agent|universal-github-app-jwt|cookie-parser)/)',
  ],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^lib/utils$': '<rootDir>/lib/utils.ts',
    '^ormconfig$': '<rootDir>/ormconfig.ts',
    '^src/(.*)': '<rootDir>/src/$1',
    '^scripts/(.*)': '<rootDir>/scripts/$1',
    '@plugins/(.*)': '<rootDir>/plugins/$1',
    '@dto/(.*)': '<rootDir>/src/dto/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@entities/(.*)': '<rootDir>/src/entities/$1',
    '@controllers/(.*)': '<rootDir>/src/controllers/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@ee/(.*)': '<rootDir>/ee/$1',
    '@helpers/(.*)': '<rootDir>/src/helpers/$1',
    '@licensing/(.*)': '<rootDir>/ee/licensing/$1',
    '@instance-settings/(.*)': '<rootDir>/ee/instance-settings/$1',
    '@otel/(.*)': '<rootDir>/src/otel/$1',
    '^mariadb$': '<rootDir>/test/__mocks__/mariadb.ts',
    '^test-helper$': '<rootDir>/test/test.helper.ts',
  },
  ...coverageConfig(),
  // run-e2e.sh always overrides this per-shard (--coverageDirectory=.coverage/shard-N);
  // this is only the default for direct `jest --config test/jest-e2e.config.ts` invocations.
  coverageDirectory: '<rootDir>/coverage-e2e',
};

export default config;
