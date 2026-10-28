import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { MIGRATION_AUTHORING_RULES_CUTOFF } from 'src/migration-helpers/migration-mode';
import { MigrationSource, PHASE_FOLDERS } from 'src/migration-helpers/migration-lint';
import { SERVER_ROOT } from './harness';

// Reads this repo's migrations and entities for the authoring-rule checks.

/** Every migration in a folder under server/, lock sentinels left out. */
export function readMigrations(directory: string): MigrationSource[] {
  return readdirSync(join(SERVER_ROOT, directory))
    .filter((name) => name.endsWith('.ts') && !name.includes('LockMigrationsTable'))
    .map((name) => ({ file: `${directory}/${name}`, text: readFileSync(join(SERVER_ROOT, directory, name), 'utf8') }));
}

/** Class names in every phase folder. */
export function migrationClassNames(): Set<string> {
  return new Set(
    PHASE_FOLDERS.flatMap((phase) => readMigrations(`migrations/${phase}`))
      .map(({ text }) => text.match(/class\s+(\w+)/)?.[1])
      .filter((name): name is string => !!name)
  );
}

export function migrationsNewerThanCutoff(directory: string): MigrationSource[] {
  return readMigrations(directory).filter(({ text }) => {
    const [, timestamp] = text.match(/class\s+\w*?(\d{13})\b/) ?? [];
    return Number(timestamp) > MIGRATION_AUTHORING_RULES_CUTOFF;
  });
}

/** Class names at or before the cutoff, which TypeORM records in `migrations`. */
export function preCutoffMigrations(directory: string): string[] {
  return readMigrations(directory)
    .map(({ text }) => text.match(/class\s+(\w*?\d{13})\b/)?.[1])
    .filter((name): name is string => !!name && Number(name.slice(-13)) <= MIGRATION_AUTHORING_RULES_CUTOFF)
    .sort();
}

export function entityFiles(): MigrationSource[] {
  return ['src', 'ee']
    .map((folder) => join(SERVER_ROOT, folder))
    .filter((directory) => existsSync(directory))
    .flatMap((directory) =>
      readdirSync(directory, { recursive: true, encoding: 'utf8' })
        .filter((name) => name.endsWith('.entity.ts'))
        .map((name) => ({ file: name, text: readFileSync(join(directory, name), 'utf8') }))
    );
}
