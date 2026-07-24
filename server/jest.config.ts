import type { Config } from '@jest/types';
import { coverageConfig } from './test/jest-coverage.config';

const config: Config.InitialOptions = {
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],
  rootDir: '.',
  testEnvironment: 'node',
  globalSetup: '<rootDir>/test/jest-global-setup.ts',
  setupFiles: ['<rootDir>/test/jest-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest-transaction-setup.ts'],
  testRegex: 'test/modules/.*/unit/.*spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^ormconfig$': '<rootDir>/ormconfig.ts',
    '^src/(.*)': '<rootDir>/src/$1',
    '^scripts/(.*)': '<rootDir>/scripts/$1',
    '^lib/(.*)': '<rootDir>/lib/$1',
    '@dto/(.*)': '<rootDir>/src/dto/$1',
    '@plugins/(.*)': '<rootDir>/plugins/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@entities/(.*)': '<rootDir>/src/entities/$1',
    '@controllers/(.*)': '<rootDir>/src/controllers/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@ee/(.*)': '<rootDir>/ee/$1',
    '@apps/(.*)': '<rootDir>/ee/apps/$1',
    '@helpers/(.*)': '<rootDir>/src/helpers/$1',
    '@licensing/(.*)': '<rootDir>/ee/licensing/$1',
    '@instance-settings/(.*)': '<rootDir>/ee/instance-settings/$1',
    '@otel/(.*)': '<rootDir>/src/otel/$1',
    // Mock mariadb — v3.5.0+ is ESM-only, Jest can't require() it (jestjs/jest#15275)
    '^mariadb$': '<rootDir>/test/__mocks__/mariadb.ts',
    '^test-helper$': '<rootDir>/test/test.helper.ts',
  },
  ...coverageConfig(),
  coverageDirectory: '<rootDir>/coverage-unit',
  runner: 'groups',
  testTimeout: 30000,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|before-after-hook|universal-user-agent|is-plain-object)/)',
  ],
};

export default config;