/**
 * Covers: migration-helpers/migration-lint.ts
 * @group database
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  authoringViolations,
  cleanupViolations,
  droppedSchema,
  entityMappings,
  frozenListDrift,
  MigrationSource,
  newerThanPhaseRules,
  phaseViolations,
  PHASE_FOLDERS,
} from 'src/migration-helpers/migration-lint';
import { MIGRATION_AUTHORING_RULES_CUTOFF } from 'src/migration-helpers/migration-mode';
import { SERVER_ROOT } from '../fixtures/harness';
import * as frozenPreCutoff from './pre-cutoff-migrations.json';

describe('migration-helpers/migration-lint', () => {
  describe('authoringViolations(): schema and data migrations only add things, and say how to undo them', () => {
    it('should accept a migration that adds a column and whose down() only explains why it cannot be undone', () => {
      expect(
        authoringViolations(schemaMigration('await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text`);'))
      ).toEqual([]);
    });

    it.each([
      ['raw SQL', 'await queryRunner.query(`ALTER TABLE apps DROP COLUMN slug`);', 'DROP COLUMN'],
      ['a table drop', 'await queryRunner.query(`DROP TABLE apps`);', 'DROP TABLE'],
      ['a table rename', 'await queryRunner.query(`ALTER TABLE apps RENAME TO applications`);', 'RENAME TO'],
      ['a type drop', 'await queryRunner.query(`DROP TYPE app_kind`);', 'DROP TYPE'],
      [
        'a type change',
        'await queryRunner.query(\'ALTER TABLE apps ALTER COLUMN "slug" TYPE varchar\');',
        'ALTER COLUMN … TYPE',
      ],
      ['SET NOT NULL', 'await queryRunner.query(`ALTER TABLE apps ALTER COLUMN slug SET NOT NULL`);', 'SET NOT NULL'],
      ['the TypeORM API', "await queryRunner.renameColumn('apps', 'slug', 'handle');", 'renameColumn'],
      [
        'a NOT NULL column without a default',
        'await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text NOT NULL`);',
        'ADD COLUMN … NOT NULL without DEFAULT',
      ],
      [
        'a constraint',
        "await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT apps_slug_check CHECK (slug <> '')`);",
        'ADD CONSTRAINT',
      ],
      ['an unnamed unique key', 'await queryRunner.query(`ALTER TABLE apps ADD UNIQUE (slug)`);', 'ADD CONSTRAINT'],
      [
        'a unique index',
        'await queryRunner.query(`CREATE UNIQUE INDEX apps_slug ON apps (slug)`);',
        'CREATE UNIQUE INDEX',
      ],
      [
        'the TypeORM foreign key API',
        "await queryRunner.createForeignKey('apps', new TableForeignKey({ columnNames: ['org_id'] }));",
        'createForeignKey',
      ],
      [
        'the TypeORM unique index API',
        "await queryRunner.createIndex('apps', new TableIndex({ columnNames: ['slug'], isUnique: true }));",
        'createIndex({ isUnique })',
      ],
    ])('should reject an up() that removes or changes existing schema, written with %s', (_how, up, label) => {
      expect(authoringViolations(schemaMigration(up))).toEqual([
        expect.stringContaining(`up() is destructive (${label})`),
      ]);
    });

    it('should accept a new NOT NULL column that has a default', () => {
      const up =
        "await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text NOT NULL DEFAULT '', ADD COLUMN n int`);";
      expect(authoringViolations(schemaMigration(up))).toEqual([]);
    });

    it('should ignore destructive SQL in down(), in a comment, or in a file marked allow-destructive', () => {
      const drop = 'await queryRunner.query(`DROP TABLE apps`);';
      expect(authoringViolations(schemaMigration('// we used to DROP TABLE here', drop))).toEqual([]);
      expect(
        authoringViolations(
          schemaMigration(drop, undefined, '// migration-lint: allow-destructive table unused since 3.20')
        )
      ).toEqual([]);
    });

    it('should reject an empty down()', () => {
      expect(authoringViolations(schemaMigration('', ''))).toEqual([
        expect.stringContaining('down() is missing or empty'),
      ]);
    });
  });

  describe('phaseViolations(): schema migrations change no rows, and data migrations lock tables only in beforeCommit()', () => {
    it.each([
      ['an UPDATE', 'await queryRunner.query(`UPDATE apps SET slug = name`);', 'UPDATE … SET'],
      ['a DELETE', 'await queryRunner.query(`DELETE FROM apps WHERE slug IS NULL`);', 'DELETE FROM'],
      [
        'an INSERT that copies rows',
        'await queryRunner.query(`INSERT INTO app_slugs (app_id) SELECT id FROM apps`);',
        'INSERT … SELECT',
      ],
      [
        'an index on an existing table',
        'await queryRunner.query(`CREATE INDEX apps_slug ON apps (slug)`);',
        'existing table apps',
      ],
    ])('should reject a schema migration that runs %s', (_what, up, label) => {
      expect(phaseViolations('schema', migration(up))).toEqual([expect.stringContaining(label)]);
    });

    it('should accept a schema migration that creates a table and indexes it', () => {
      const up = 'await queryRunner.query(`CREATE TABLE gadgets (id int); CREATE INDEX gadgets_id ON gadgets (id)`);';
      expect(phaseViolations('schema', migration(up))).toEqual([]);
    });

    it('should accept a data migration that adds a foreign key without checking old rows (NOT VALID) and checks them in beforeCommit()', () => {
      const source = migration(
        'await queryRunner.query(`UPDATE apps SET owner_id = created_by`);',
        'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT fk FOREIGN KEY (owner_id) REFERENCES users(id) NOT VALID`); await queryRunner.query(`ALTER TABLE apps VALIDATE CONSTRAINT fk`);'
      );
      expect(phaseViolations('data', source)).toEqual([]);
    });

    it('should accept a data migration that updates rows and builds its index in beforeCommit()', () => {
      const source = migration(
        'await queryRunner.query(`UPDATE apps SET slug = name`);',
        'await queryRunner.query(`CREATE INDEX apps_slug ON apps (slug)`);'
      );
      expect(phaseViolations('data', source)).toEqual([]);
    });

    it.each([
      [
        'an index build in up()',
        'await queryRunner.query(`CREATE INDEX apps_slug ON apps (slug)`);',
        'move it to beforeCommit()',
      ],
      ['a DROP', 'await queryRunner.query(`ALTER TABLE apps DROP COLUMN slug`);', 'move it to cleanup'],
      [
        'a constraint without NOT VALID',
        'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT c CHECK (true)`);',
        'ADD CONSTRAINT without NOT VALID',
      ],
      ['the TypeORM schema API', "await queryRunner.addColumn('apps', column);", 'addColumn'],
      [
        'a LOCK TABLE',
        'await queryRunner.query(`LOCK TABLE apps IN ACCESS EXCLUSIVE MODE`);',
        'long lock (LOCK TABLE)',
      ],
      ['a TRUNCATE', 'await queryRunner.query(`TRUNCATE apps`);', 'long lock (TRUNCATE)'],
      ['a REINDEX', 'await queryRunner.query(`REINDEX TABLE apps`);', 'long lock (REINDEX)'],
      ['a CLUSTER', 'await queryRunner.query(`CLUSTER apps USING apps_pkey`);', 'long lock (CLUSTER)'],
      ['a VACUUM FULL', 'await queryRunner.query(`VACUUM FULL apps`);', 'long lock (VACUUM FULL)'],
      [
        'an index change',
        'await queryRunner.query(`ALTER INDEX apps_slug RENAME TO apps_handle`);',
        'long lock (ALTER INDEX)',
      ],
      [
        'a trigger change',
        'await queryRunner.query(`ALTER TRIGGER t ON apps RENAME TO t2`);',
        'long lock (ALTER TRIGGER)',
      ],
      [
        'a column rename',
        'await queryRunner.query(`ALTER TABLE apps RENAME COLUMN slug TO handle`);',
        'long lock (ALTER COLUMN or RENAME)',
      ],
      [
        'a CHECK, even NOT VALID',
        'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT c CHECK (slug IS NOT NULL) NOT VALID`);',
        'CHECK constraint',
      ],
    ])('should reject a data migration with %s', (_what, up, message) => {
      expect(phaseViolations('data', migration(up))).toEqual([expect.stringContaining(message)]);
    });
  });

  describe('cleanupViolations(): cleanup migrations hold locks briefly and are safe to run again', () => {
    const shortDrop = "await withShortLock(queryRunner, ['ALTER TABLE apps DROP COLUMN IF EXISTS slug']);";
    const known = new Set(['StopReadingSlug1799999999998']);

    it('should accept a step that runs through withShortLock()', () => {
      expect(cleanupViolations(cleanupMigration(shortDrop), known)).toEqual([]);
    });

    it.each([
      [
        'runs inside a transaction',
        cleanupMigration(shortDrop, "requires = 'StopReadingSlug1799999999998';"),
        'declare transaction = false',
      ],
      [
        'does not name the migration it waits for',
        cleanupMigration(shortDrop, 'transaction = false;'),
        'requires must name',
      ],
      [
        'waits for a migration that does not exist',
        cleanupMigration(shortDrop, "transaction = false; requires = 'Nope1799999999997';"),
        'no migration Nope1799999999997',
      ],
      [
        'calls queryRunner directly',
        cleanupMigration('await queryRunner.query(`ALTER TABLE apps DROP COLUMN IF EXISTS slug`);'),
        'up() calls queryRunner.query',
      ],
      [
        'drops without IF EXISTS',
        cleanupMigration("await withShortLock(queryRunner, ['ALTER TABLE apps DROP COLUMN slug']);"),
        'needs IF EXISTS',
      ],
      [
        'has an empty down()',
        cleanupMigration(shortDrop, "transaction = false; requires = 'StopReadingSlug1799999999998';", ''),
        'down() is missing or empty',
      ],
    ])('should reject a cleanup migration that %s', (_how, source, message) => {
      expect(cleanupViolations(source, known)).toEqual([expect.stringContaining(message)]);
    });
  });

  describe('entityMappings() and droppedSchema(): cleanup never drops a table or column the code still uses', () => {
    const entity = {
      file: 'app.entity.ts',
      text: `
@Entity({ name: 'apps' })
export class App {
  @Column({ name: 'slug' }) slug: string;
  @Column() icon: string;
  @ManyToOne(() => Org) @JoinColumn({ name: 'organization_id' }) organization: Org;
}`,
    };

    it('should list the tables and columns an entity class uses', () => {
      expect([...entityMappings([entity])].sort()).toEqual(['apps', 'apps.icon', 'apps.organization_id', 'apps.slug']);
    });

    it.each([
      [
        'a column',
        'ALTER TABLE apps DROP COLUMN IF EXISTS slug, DROP COLUMN IF EXISTS gone',
        ['apps.slug', 'apps.gone'],
      ],
      ['a table', 'DROP TABLE IF EXISTS public.apps', ['apps']],
      [
        'each table in a multi-statement step',
        'ALTER TABLE apps DROP COLUMN IF EXISTS slug`, `ALTER TABLE users DROP COLUMN IF EXISTS icon',
        ['apps.slug', 'users.icon'],
      ],
    ])('should find %s that a cleanup drops', (_what, sql, expected) => {
      expect(droppedSchema(cleanupMigration(`await withShortLock(queryRunner, [\`${sql}\`]);`))).toEqual(expected);
    });
  });

  /**
   * Migrations at or before the cutoff skip the rules above, so the list is frozen. A new migration
   * dated before the cutoff would skip them silently. Use a current timestamp instead.
   */
  describe('frozenListDrift(): the list of migrations older than these rules never changes', () => {
    it('should report a migration added with an old date, and one that was removed', () => {
      expect(frozenListDrift(['A1', 'B2'], ['A1', 'C3'])).toEqual({ added: ['C3'], missing: ['B2'] });
    });
  });

  describe('Every migration in migrations/ follows the rules', () => {
    it.each(['schema', 'data'])(
      'should find no %s migration that removes or changes existing schema or has an empty down()',
      (phase) => {
        const violations = migrationsNewerThanCutoff(`migrations/${phase}`).flatMap((source) =>
          authoringViolations(source)
        );
        expect(violations).toEqual([]);
      }
    );

    it.each(['schema', 'data'] as const)(
      'should find no new %s migration doing work that belongs to another phase',
      (phase) => {
        const sources = newerThanPhaseRules(migrationsNewerThanCutoff(`migrations/${phase}`));
        expect(sources.flatMap((source) => phaseViolations(phase, source))).toEqual([]);
      }
    );

    it('should find no cleanup migration that holds a long lock or fails when run again', () => {
      const known = new Set(
        PHASE_FOLDERS.flatMap((phase) => readMigrations(`migrations/${phase}`))
          .map(({ text }) => text.match(/class\s+(\w+)/)?.[1])
          .filter((name): name is string => !!name)
      );
      const violations = readMigrations('migrations/cleanup').flatMap((source) => cleanupViolations(source, known));
      expect(violations).toEqual([]);
    });

    it('should find no cleanup migration that drops a table or column the code still uses', () => {
      const mapped = entityMappings(entityFiles());
      expect(mapped.has('app_versions.branch_id')).toBe(true);
      const stillMapped = readMigrations('migrations/cleanup').flatMap((source) =>
        droppedSchema(source)
          .filter((dropped) => mapped.has(dropped))
          .map(
            (dropped) =>
              `${source.file}: drops ${dropped}, which an entity still maps; remove it from the entity first.`
          )
      );
      expect(stillMapped).toEqual([]);
    });

    it.each(['migrations/schema', 'migrations/data'] as const)(
      'should find no migration added to or removed from the old %s list',
      (directory) => {
        // Class names at or before the cutoff, which TypeORM records in `migrations`.
        const preCutoff = readMigrations(directory)
          .map(({ text }) => text.match(/class\s+(\w*?\d{13})\b/)?.[1])
          .filter((name): name is string => !!name && Number(name.slice(-13)) <= MIGRATION_AUTHORING_RULES_CUTOFF)
          .sort();
        expect(frozenListDrift(frozenPreCutoff[directory], preCutoff)).toEqual({
          added: [],
          missing: [],
        });
      }
    );

    // TypeORM only loads the phase folders, so a file anywhere else would never run.
    it('should keep every migration inside migrations/schema, data or cleanup', () => {
      expect(readdirSync(join(SERVER_ROOT, 'migrations')).sort()).toEqual([...PHASE_FOLDERS].sort());
      const oldFolder = join(SERVER_ROOT, 'data-migrations');
      expect(existsSync(oldFolder) ? readdirSync(oldFolder) : []).toEqual([]);
    });

    it('should not put the same new migration in two phase folders', () => {
      const classes = PHASE_FOLDERS.flatMap((phase) =>
        migrationsNewerThanCutoff(`migrations/${phase}`).map(({ text }) => text.match(/class\s+(\w+)/)?.[1])
      );
      expect(classes.filter((name, index) => classes.indexOf(name) !== index)).toEqual([]);
    });
  });
});

// --- Example migrations ---

/** A schema migration with this up(), down() and class header. */
function schemaMigration(up: string, down = '// irreversible: values only grow', header = '') {
  return {
    file: 'migrations/schema/1799999999999-Sample.ts',
    text: `${header}
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  public async down(queryRunner: QueryRunner): Promise<void> { ${down} }
}`,
  };
}

/** A migration with this up() and, optionally, beforeCommit(). phaseViolations() is told its phase separately. */
function migration(up: string, beforeCommit = '') {
  return {
    file: 'migrations/data/1799999999999-Sample.ts',
    text: `
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  ${beforeCommit ? `public async beforeCommit(queryRunner: QueryRunner): Promise<void> { ${beforeCommit} }` : ''}
  public async down(): Promise<void> { /* rows only */ }
}`,
  };
}

/** A cleanup migration with this up(), class header and down(). */
function cleanupMigration(
  up: string,
  header = "transaction = false; requires = 'StopReadingSlug1799999999998';",
  down = '// re-adding the column restores nothing'
) {
  return {
    file: 'migrations/cleanup/1799999999999-Sample.ts',
    text: `
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  ${header}
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  public async down(queryRunner: QueryRunner): Promise<void> { ${down} }
}`,
  };
}

// --- This repo's migrations and entities ---

/** Every migration in a folder under server/, lock sentinels left out. */
function readMigrations(directory: string): MigrationSource[] {
  return readdirSync(join(SERVER_ROOT, directory))
    .filter((name) => name.endsWith('.ts') && !name.includes('LockMigrationsTable'))
    .map((name) => ({ file: `${directory}/${name}`, text: readFileSync(join(SERVER_ROOT, directory, name), 'utf8') }));
}

function migrationsNewerThanCutoff(directory: string): MigrationSource[] {
  return readMigrations(directory).filter(({ text }) => {
    const [, timestamp] = text.match(/class\s+\w*?(\d{13})\b/) ?? [];
    return Number(timestamp) > MIGRATION_AUTHORING_RULES_CUTOFF;
  });
}

function entityFiles(): MigrationSource[] {
  return ['src', 'ee']
    .map((folder) => join(SERVER_ROOT, folder))
    .filter((directory) => existsSync(directory))
    .flatMap((directory) =>
      readdirSync(directory, { recursive: true, encoding: 'utf8' })
        .filter((name) => name.endsWith('.entity.ts'))
        .map((name) => ({ file: name, text: readFileSync(join(directory, name), 'utf8') }))
    );
}
