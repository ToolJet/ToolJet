import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  moduleFileExtensions: ['js', 'json', 'ts', 'node'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^src/(.*)': '<rootDir>/src/$1',
    '@dto/(.*)': '<rootDir>/src/dto/$1',
    '@plugins/(.*)': '<rootDir>/plugins/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@entities/(.*)': '<rootDir>/src/entities/$1',
    '@controllers/(.*)': '<rootDir>/src/controllers/$1',
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@ee/(.*)': '<rootDir>/ee/$1',
    '@apps/(.*)': '<rootDir>/ee/apps/$1',
  },
  runner: 'groups',
  testTimeout: 30000,
};

export default config;
