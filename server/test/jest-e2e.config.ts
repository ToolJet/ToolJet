/** @jest-config-loader ts-node */
import type { Config } from '@jest/types';
import { coverageConfig } from './jest-coverage.config';

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],
  rootDir: '.',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/../test/jest-global-setup.ts',
  setupFiles: ['<rootDir>/../test/jest-setup.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/../test/jest-transaction-setup.ts',
    '<rootDir>/../test/jest-retry-setup.ts',
  ],
  testRegex: 'test/modules/.*/e2e/.*spec\\.ts$',
  modulePathIgnorePatterns: ['<rootDir>/../dist/'],
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
        tsconfig: '<rootDir>/../tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^lib/utils$': '<rootDir>/../lib/utils.ts',
    '^ormconfig$': '<rootDir>/../ormconfig.ts',
    '^src/(.*)': '<rootDir>/../src/$1',
    '^scripts/(.*)': '<rootDir>/../scripts/$1',
    '@plugins/(.*)': '<rootDir>/../plugins/$1',
    '@dto/(.*)': '<rootDir>/../src/dto/$1',
    '@services/(.*)': '<rootDir>/../src/services/$1',
    '@entities/(.*)': '<rootDir>/../src/entities/$1',
    '@controllers/(.*)': '<rootDir>/../src/controllers/$1',
    '@modules/(.*)': '<rootDir>/../src/modules/$1',
    '@ee/(.*)': '<rootDir>/../ee/$1',
    '@helpers/(.*)': '<rootDir>/../src/helpers/$1',
    '@licensing/(.*)': '<rootDir>/../ee/licensing/$1',
    '@instance-settings/(.*)': '<rootDir>/../ee/instance-settings/$1',
    '@otel/(.*)': '<rootDir>/../src/otel/$1',
    '^mariadb$': '<rootDir>/__mocks__/mariadb.ts',
    '^test-helper$': '<rootDir>/../test/test.helper.ts',
  },
  ...coverageConfig('../'),
};

export default config;
