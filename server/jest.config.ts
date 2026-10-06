/** @jest-config-loader ts-node */
import type { Config } from '@jest/types';
import { existsSync } from 'fs';
import { join } from 'path';
import { coverageConfig } from './test/jest-coverage.config';
import { editionProjects } from './test/jest-projects.config';

// CE when asked for, or when the private test tree is absent (public clone).
const isCE = process.env.TOOLJET_EDITION === 'ce' || !existsSync(join(__dirname, 'ee/test'));

// Per-tree options. `roots`, `rootDir` and the `test-helper` mapping are set per project by editionProjects().
const shared: Config.InitialProjectOptions = {
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],
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
  },
  runner: 'groups',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|before-after-hook|universal-user-agent|is-plain-object)/)(?!(thrift/node_modules/)?uuid/dist-node/)',
  ],
};

const config: Config.InitialOptions = {
  rootDir: '.',
  projects: editionProjects(__dirname, isCE, shared),
  // Global-only options: Jest ignores these inside a project.
  verbose: true,
  testTimeout: 30000,
  ...coverageConfig(isCE),
  coverageDirectory: '<rootDir>/coverage-unit',
};

export default config;
