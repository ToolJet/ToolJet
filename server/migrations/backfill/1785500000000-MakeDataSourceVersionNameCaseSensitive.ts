import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDataSourceVersionNameCaseSensitive1785500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make data source name uniqueness case-SENSITIVE so two data sources whose
    // names differ only in casing ("Postgres" / "postgres") can coexist within the
    // same branch. Previously idx_unique_active_name_branch keyed on LOWER(name)
    // (see MakeDataSourceVersionBranchIdNotNullAndDropIsDefault1781740900000), which
    // treated those two as the same name and blocked the second one.
    //
    // Case-sensitive uniqueness is strictly more permissive than the case-insensitive
    // form — every set that was unique under LOWER(name) is still unique under name —
    // so no dedupe pass is needed; the recreate cannot raise 23505 on existing rows.
    //
    // branch_id is NOT NULL as of 1781740900000, so no COALESCE handling is required.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_active_name_branch`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_active_name_branch
        ON data_source_versions (name, branch_id)
        WHERE is_active = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the case-insensitive index. Recreating LOWER(name) uniqueness CAN fail
    // with 23505 if case-only duplicates were created while this migration was applied;
    // that is an intentional data conflict the operator must resolve before rolling back.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_unique_active_name_branch`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_unique_active_name_branch
        ON data_source_versions (LOWER(name), branch_id)
        WHERE is_active = true
    `);
  }
}
