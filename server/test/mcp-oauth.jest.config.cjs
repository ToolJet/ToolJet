/** Isolated OAuth tests. Never loads ToolJet's database-truncating global setup. */
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/modules/mcp-oauth/**/*.spec.ts', '<rootDir>/ee/test/modules/mcp-oauth/**/*.spec.ts', '<rootDir>/test/modules/personal-access-tokens/unit/route-inventory.spec.ts'],
  moduleNameMapper: {
    '^scripts/(.*)$': '<rootDir>/scripts/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@entities/(.*)$': '<rootDir>/src/entities/$1',
    '^@helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '^@otel/(.*)$': '<rootDir>/src/otel/$1',
    '^@ee/(.*)$': '<rootDir>/ee/$1',
  },
  transform: {
    '^.+\\.[jt]s$': [
      'ts-jest',
      { tsconfig: { types: ['node', 'jest'], allowJs: true, isolatedModules: true } },
    ],
  },
};
