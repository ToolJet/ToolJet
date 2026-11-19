import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'AddCodeModeAndReviewForeignKeys1794896718037';

type ForeignKey = {
  table: string;
  column: string;
  references: string;
  onDelete: 'CASCADE' | 'SET NULL' | 'NO ACTION';
};

// Keys from the release's new tables to tables that already exist. The schema migrations that create these tables
// leave them out: adding one takes SHARE ROW EXCLUSIVE on the table it references, which would stop writes to apps,
// app_versions, users and organizations while old pods serve. Keys between the release's own new tables stay inline.
const FOREIGN_KEYS: ForeignKey[] = [
  // CreateAppVersionReviews1791700000000. version_id and base_version_id have none on purpose
  // (DropAppVersionReviewVersionForeignKeys1793500000000).
  { table: 'app_version_reviews', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
  { table: 'app_version_reviews', column: 'author_id', references: 'users', onDelete: 'NO ACTION' },
  { table: 'app_version_review_events', column: 'actor_id', references: 'users', onDelete: 'NO ACTION' },
  // AddCodePageSecuritySettings1792440000000
  { table: 'code_page_security_settings', column: 'organization_id', references: 'organizations', onDelete: 'CASCADE' },
  // CreateAppSecurityScans1792460000000
  { table: 'app_version_scans', column: 'organization_id', references: 'organizations', onDelete: 'CASCADE' },
  { table: 'app_version_scans', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
  { table: 'app_version_scans', column: 'app_version_id', references: 'app_versions', onDelete: 'CASCADE' },
  { table: 'scan_findings', column: 'organization_id', references: 'organizations', onDelete: 'CASCADE' },
  { table: 'scan_exceptions', column: 'organization_id', references: 'organizations', onDelete: 'CASCADE' },
  { table: 'scan_exceptions', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
  { table: 'workspace_scan_policies', column: 'organization_id', references: 'organizations', onDelete: 'CASCADE' },
  // CreateCodeModeSources1792480000000 and CreateCodeModeSourceRevisions1792490000000
  { table: 'code_mode_sources', column: 'app_version_id', references: 'app_versions', onDelete: 'CASCADE' },
  { table: 'code_mode_sources', column: 'updated_by', references: 'users', onDelete: 'SET NULL' },
  { table: 'code_mode_source_revisions', column: 'created_by', references: 'users', onDelete: 'SET NULL' },
  // CreateCodeModeAccessChanges1793650000000
  { table: 'code_mode_access_changes', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
  { table: 'code_mode_access_changes', column: 'app_version_id', references: 'app_versions', onDelete: 'CASCADE' },
  { table: 'code_mode_access_changes', column: 'created_by', references: 'users', onDelete: 'SET NULL' },
];

/**
 * Adds the foreign keys listed above in beforeCommit(): each one NOT VALID, then validated, so the locks are taken last
 * and held briefly. A column that already has a key is skipped, which covers databases that ran these tables' first
 * versions with the keys inline, and a rerun.
 */
export class AddCodeModeAndReviewForeignKeys1794896718037 implements DataMigration {
  public async up(): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Code mode and review foreign keys: deferred to before commit`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    const total = FOREIGN_KEYS.length;
    let done = 0;
    for (const { table, column, references, onDelete } of FOREIGN_KEYS) {
      const [{ exists }] = await queryRunner.query(
        `SELECT EXISTS (
           SELECT 1 FROM pg_constraint c
           JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
           WHERE c.contype = 'f' AND c.conrelid = $1::regclass AND a.attname = $2
         ) AS "exists"`,
        [table, column]
      );
      if (!exists) {
        const name = `fk_${table}_${column}`;
        await queryRunner.query(
          `ALTER TABLE ${table} ADD CONSTRAINT ${name} FOREIGN KEY (${column}) REFERENCES ${references} (id) ON DELETE ${onDelete} NOT VALID`
        );
        // SHARE UPDATE EXCLUSIVE: blocks neither reads nor writes.
        await queryRunner.query(`ALTER TABLE ${table} VALIDATE CONSTRAINT ${name}`);
      }
      done += 1;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${Math.round((done / total) * 100)}%)`);
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Code mode and review foreign keys finished.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column } of [...FOREIGN_KEYS].reverse()) {
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_${column}`);
    }
  }
}
