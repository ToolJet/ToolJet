/**
 * Splits a Jest config into one project per test tree, so each tree always gets its own helper:
 * specs in `test/` boot CE, specs in `ee/test/` boot EE, whichever tree the run also includes.
 * Global-only options (coverage, verbose) stay in the calling config; everything else goes in `shared`.
 */
import type { Config } from '@jest/types';

export function editionProjects(
  rootDir: string,
  isCE: boolean,
  shared: Config.InitialProjectOptions
): Config.InitialProjectOptions[] {
  // rootDir must be absolute: inline projects resolve a relative one from the top-level rootDir.
  const project = (name: string, tree: string, helper: string): Config.InitialProjectOptions => ({
    ...shared,
    displayName: name,
    rootDir,
    globals: { ...shared.globals, tjEdition: name },
    setupFiles: ['<rootDir>/test/jest-edition-setup.ts', ...(shared.setupFiles ?? [])],
    roots: [`<rootDir>/${tree}`],
    moduleNameMapper: { ...shared.moduleNameMapper, '^test-helper$': `<rootDir>/${helper}` },
  });

  return [
    project('ce', 'test', 'test/test.helper.ts'),
    ...(isCE ? [] : [project('ee', 'ee/test', 'ee/test/test.helper.ts')]),
  ];
}
