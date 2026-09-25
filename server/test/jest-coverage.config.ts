/**
 * Shared coverage configuration for unit and e2e Jest configs.
 *
 * Both suites use the same exclusions, reporters, provider, and thresholds.
 * Both configs' rootDir is server/, so both collectCoverageFrom globs are
 * server-relative with no path prefix needed.
 *
 * Usage:
 *   import { coverageConfig } from './test/jest-coverage.config';
 *   coverageConfig(isCE)  →  'src/**\/*.ts' (+ 'ee/**\/*.ts' unless isCE)
 */
import type { Config } from '@jest/types';

export function coverageConfig(isCE: boolean): Partial<Config.InitialOptions> {
  return {
    collectCoverageFrom: [
      'src/**/*.ts',
      // Exclude NestJS wiring — modules are DI glue, not logic
      '!src/**/module.ts',
      '!src/**/*.module.ts',
      // Exclude data definitions — entities and DTOs are schema, not behavior
      '!src/**/*.entity.ts',
      '!src/**/*.dto.ts',
      ...(isCE
        ? []
        : ['ee/**/*.ts', '!ee/**/module.ts', '!ee/**/*.module.ts', '!ee/**/*.entity.ts', '!ee/**/*.dto.ts']),
      // Exclude entry point and migration helpers
      '!src/main.ts',
      '!src/migration-helpers/**',
    ],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/test/',
      '/__mocks__/',
      '/migrations/',
      '/data-migrations/',
    ],
    // 'lcov' would work too but internally composes 'lcovonly' + 'html' (istanbul-reports
    // lib/lcov/index.js), rendering the whole HTML tree a second time into lcov-report/.
    coverageReporters: ['html', 'lcovonly', 'json', 'json-summary'],
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
