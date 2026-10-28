/**
 * Covers: migration-helpers/migration-lint.ts
 * @group database
 */
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  authoringViolations,
  cleanupViolations,
  droppedSchema,
  entityMappings,
  frozenListDrift,
  newerThanPhaseRules,
  phaseViolations,
  PHASE_FOLDERS,
} from 'src/migration-helpers/migration-lint';
import {
  entityFiles,
  migrationClassNames,
  migrationsNewerThanCutoff,
  preCutoffMigrations,
  readMigrations,
} from '../fixtures/migration-files';
import { SERVER_ROOT } from '../fixtures/harness';
import * as frozenPreCutoff from './pre-cutoff-migrations.json';

// --- Example migrations ---

const schemaMigration = (up: string, down = '// irreversible: values only grow', header = '') => ({
  file: 'migrations/schema/1799999999999-Sample.ts',
  text: `${header}
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  public async down(queryRunner: QueryRunner): Promise<void> { ${down} }
}`,
});

const migration = (up: string, beforeCommit = '') => ({
  file: 'migrations/data/1799999999999-Sample.ts',
  text: `
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  ${beforeCommit ? `public async beforeCommit(queryRunner: QueryRunner): Promise<void> { ${beforeCommit} }` : ''}
  public async down(): Promise<void> { /* rows only */ }
}`,
});

const cleanupMigration = (
  up: string,
  header = "transaction = false; requires = 'StopReadingSlug1799999999998';",
  down = '// re-adding the column restores nothing'
) => ({
  file: 'migrations/cleanup/1799999999999-Sample.ts',
  text: `
import { MigrationInterface, QueryRunner } from 'typeorm';
export class Sample1799999999999 implements MigrationInterface {
  ${header}
  public async up(queryRunner: QueryRunner): Promise<void> { ${up} }
  public async down(queryRunner: QueryRunner): Promise<void> { ${down} }
}`,
});

describe('migration-helpers/migration-lint', () => {
  describe('Schema and data migrations only add schema and can be undone', () => {
    it('should pass an additive migration whose down() only explains itself', () => {
      expect(
        authoringViolations(schemaMigration('await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text`);'))
      ).toEqual([]);
    });

    it.each([
      ['raw SQL', 'await queryRunner.query(`ALTER TABLE apps DROP COLUMN slug`);', 'DROP COLUMN'],
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
    ])('should flag a destructive up() written with %s', (_how, up, label) => {
      expect(authoringViolations(schemaMigration(up))).toEqual([
        expect.stringContaining(`up() is destructive (${label})`),
      ]);
    });

    it('should pass a NOT NULL column that has a default', () => {
      const up =
        "await queryRunner.query(`ALTER TABLE apps ADD COLUMN slug text NOT NULL DEFAULT '', ADD COLUMN n int`);";
      expect(authoringViolations(schemaMigration(up))).toEqual([]);
    });

    it('should not flag destructive SQL in down(), a comment, or a file that opts out', () => {
      const drop = 'await queryRunner.query(`DROP TABLE apps`);';
      expect(authoringViolations(schemaMigration('// we used to DROP TABLE here', drop))).toEqual([]);
      expect(
        authoringViolations(
          schemaMigration(drop, undefined, '// migration-lint: allow-destructive table unused since 3.20')
        )
      ).toEqual([]);
    });

    it('should flag an empty down()', () => {
      expect(authoringViolations(schemaMigration('', ''))).toEqual([
        expect.stringContaining('down() is missing or empty'),
      ]);
    });
  });

  describe('Schema changes no rows; data keeps lock-taking steps to beforeCommit()', () => {
    it.each([
      ['an UPDATE', 'await queryRunner.query(`UPDATE apps SET slug = name`);', 'UPDATE … SET'],
      [
        'an index on an existing table',
        'await queryRunner.query(`CREATE INDEX apps_slug ON apps (slug)`);',
        'existing table apps',
      ],
    ])('should flag schema that runs %s', (_what, up, label) => {
      expect(phaseViolations('schema', migration(up))).toEqual([expect.stringContaining(label)]);
    });

    it('should pass schema that creates a table and indexes it', () => {
      const up = 'await queryRunner.query(`CREATE TABLE gadgets (id int); CREATE INDEX gadgets_id ON gadgets (id)`);';
      expect(phaseViolations('schema', migration(up))).toEqual([]);
    });

    it('should pass a data migration that adds a foreign key NOT VALID and validates it in beforeCommit()', () => {
      const source = migration(
        'await queryRunner.query(`UPDATE apps SET owner_id = created_by`);',
        'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT fk FOREIGN KEY (owner_id) REFERENCES users(id) NOT VALID`); await queryRunner.query(`ALTER TABLE apps VALIDATE CONSTRAINT fk`);'
      );
      expect(phaseViolations('data', source)).toEqual([]);
    });

    it('should pass a data migration that updates rows and builds its index in beforeCommit()', () => {
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
        'a CHECK, even NOT VALID',
        'await queryRunner.query(`ALTER TABLE apps ADD CONSTRAINT c CHECK (slug IS NOT NULL) NOT VALID`);',
        'CHECK constraint',
      ],
    ])('should flag a data migration with %s', (_what, up, message) => {
      expect(phaseViolations('data', migration(up))).toEqual([expect.stringContaining(message)]);
    });
  });

  describe('Cleanup steps are short and safe to rerun', () => {
    const shortDrop = "await withShortLock(queryRunner, ['ALTER TABLE apps DROP COLUMN IF EXISTS slug']);";
    const known = new Set(['StopReadingSlug1799999999998']);

    it('should pass a step that goes through withShortLock', () => {
      expect(cleanupViolations(cleanupMigration(shortDrop), known)).toEqual([]);
    });

    it.each([
      [
        'runs inside a transaction',
        cleanupMigration(shortDrop, "requires = 'StopReadingSlug1799999999998';"),
        'declare transaction = false',
      ],
      ['names no requires', cleanupMigration(shortDrop, 'transaction = false;'), 'requires must name'],
      [
        'requires an unknown migration',
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
    ])('should flag a cleanup migration that %s', (_how, source, message) => {
      expect(cleanupViolations(source, known)).toEqual([expect.stringContaining(message)]);
    });
  });

  describe('Cleanup never drops what an entity still maps', () => {
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

    it('should read the tables and columns an entity maps', () => {
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
    ])('should find %s a cleanup drops', (_what, sql, expected) => {
      expect(droppedSchema(cleanupMigration(`await withShortLock(queryRunner, [\`${sql}\`]);`))).toEqual(expected);
    });
  });

  /**
   * Migrations at or before the cutoff skip the rules above, so the list is frozen. A new migration
   * dated before the cutoff would skip them silently. Use a current timestamp instead.
   */
  describe('Migrations at or before the cutoff are frozen', () => {
    it('should report back-dated and removed names', () => {
      expect(frozenListDrift(['A1', 'B2'], ['A1', 'C3'])).toEqual({ added: ['C3'], missing: ['B2'] });
    });
  });

  describe('Every real migration follows the rules', () => {
    it('should keep schema migrations additive and reversible', () => {
      const violations = migrationsNewerThanCutoff('migrations/schema').flatMap((source) =>
        authoringViolations(source)
      );
      expect(violations).toEqual([]);
    });

    it('should keep data migrations additive and reversible', () => {
      const violations = migrationsNewerThanCutoff('migrations/data').flatMap((source) => authoringViolations(source));
      expect(violations).toEqual([]);
    });

    it.each(['schema', 'data'] as const)('should keep new %s migrations in their phase', (phase) => {
      const sources = newerThanPhaseRules(migrationsNewerThanCutoff(`migrations/${phase}`));
      expect(sources.flatMap((source) => phaseViolations(phase, source))).toEqual([]);
    });

    it('should keep cleanup migrations to short, rerunnable steps', () => {
      const known = migrationClassNames();
      const violations = readMigrations('migrations/cleanup').flatMap((source) => cleanupViolations(source, known));
      expect(violations).toEqual([]);
    });

    it('should not drop a table or column an entity still maps', () => {
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

    it.each(['migrations/schema', 'migrations/data'] as const)('should keep the %s list frozen', (directory) => {
      expect(frozenListDrift(frozenPreCutoff[directory], preCutoffMigrations(directory))).toEqual({
        added: [],
        missing: [],
      });
    });

    // TypeORM only loads the phase folders, so a file anywhere else would never run.
    it('should keep every migration inside a phase folder', () => {
      expect(readdirSync(join(SERVER_ROOT, 'migrations')).sort()).toEqual([...PHASE_FOLDERS].sort());
      const oldFolder = join(SERVER_ROOT, 'data-migrations');
      expect(existsSync(oldFolder) ? readdirSync(oldFolder) : []).toEqual([]);
    });

    it('should give each migration newer than the cutoff one phase', () => {
      const classes = PHASE_FOLDERS.flatMap((phase) =>
        migrationsNewerThanCutoff(`migrations/${phase}`).map(({ text }) => text.match(/class\s+(\w+)/)?.[1])
      );
      expect(classes.filter((name, index) => classes.indexOf(name) !== index)).toEqual([]);
    });
  });
});
