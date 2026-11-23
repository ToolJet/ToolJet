import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'AddUserAppVersionStateForeignKeys1795153679000';

type ForeignKey = {
  table: string;
  column: string;
  references: string;
  onDelete: 'CASCADE' | 'SET NULL';
};

// CreateUserAppVersionState1790140781181 leaves these out: adding them takes SHARE ROW EXCLUSIVE on users, apps and
// app_versions, which would stop writes to them while old pods serve.
const FOREIGN_KEYS: ForeignKey[] = [
  { table: 'user_app_version_state', column: 'user_id', references: 'users', onDelete: 'CASCADE' },
  { table: 'user_app_version_state', column: 'app_id', references: 'apps', onDelete: 'CASCADE' },
  { table: 'user_app_version_state', column: 'version_id', references: 'app_versions', onDelete: 'SET NULL' },
];

/**
 * Adds the foreign keys listed above in beforeCommit(): each one NOT VALID, then validated, so the locks are taken last
 * and held briefly. A column that already has a key is skipped, which covers databases that ran the table's first
 * version with the keys inline, and a rerun.
 */
export class AddUserAppVersionStateForeignKeys1795153679000 implements DataMigration {
  public async up(): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] user_app_version_state foreign keys: deferred to before commit`);
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
    console.log(`${MIGRATION_NAME}: [SUCCESS] user_app_version_state foreign keys finished.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column } of [...FOREIGN_KEYS].reverse()) {
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_${column}`);
    }
  }
}
