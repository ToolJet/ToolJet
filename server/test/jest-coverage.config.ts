/**
 * Shared coverage configuration for unit and e2e Jest configs.
 *
 * Both suites use the same exclusions, reporters, provider, and thresholds.
 * The only difference is path prefixes — unit config has rootDir at server/,
 * e2e has rootDir at server/test/.
 *
 * Usage:
 *   import { coverageConfig } from './test/jest-coverage.config';
 *   // unit:  coverageConfig('')        → 'src/**\/*.ts'
 *   // e2e:   coverageConfig('../')     → '<rootDir>/../src/**\/*.ts'
 */
import type { Config } from '@jest/types';

export function coverageConfig(prefix: string = ''): Partial<Config.InitialOptions> {
  const p = prefix ? `<rootDir>/${prefix}` : '';

  return {
    collectCoverageFrom: [
      `${p}src/**/*.ts`,
      `${p}ee/**/*.ts`,
      // Exclude NestJS wiring — modules are DI glue, not logic
      `!${p}src/**/module.ts`,
      `!${p}src/**/*.module.ts`,
      `!${p}ee/**/module.ts`,
      `!${p}ee/**/*.module.ts`,
      // Exclude data definitions — entities and DTOs are schema, not behavior
      `!${p}src/**/*.entity.ts`,
      `!${p}src/**/*.dto.ts`,
      `!${p}ee/**/*.entity.ts`,
      `!${p}ee/**/*.dto.ts`,
      // Exclude entry point and migration helpers
      `!${p}src/main.ts`,
      `!${p}src/migration-helpers/**`,
    ],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/test/',
      '/__mocks__/',
      '/migrations/',
      '/data-migrations/',
    ],
    coverageReporters: ['html', 'lcov', 'json'],
    coverageProvider: 'v8',
    // Permissive baseline — tighten as coverage improves.
    // Run `npm test -- --coverage` to see current numbers, then ratchet up.
    coverageThreshold: {
      global: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
  };
}
