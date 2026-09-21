import { MigrationInterface, QueryRunner } from 'typeorm';

// A table's baseline chain gets exactly one sequence-1 "create" migration. Without this constraint,
// two concurrent repairBaseline() calls (TooljetDbEnvironmentAssignmentService) can both pass the
// service's in-memory idempotency check before either writes, and both insert a sequence=1 baseline
// row — a promote replaying that chain then runs CREATE TABLE twice. The index turns the second
// concurrent writer into a loud constraint-violation error instead of a silent duplicate.
export class AddUniqueBaselineSequenceIndexToInternalTableMigrations1789968853968 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // branch_id is part of the key, not just internal_table_id/sequence: branching isn't shipped
    // for TJDB yet (every row today has the same default-branch value), but repairBaseline itself
    // already scopes its own reads/writes by branch_id on this same assumption - a table with two
    // real branches must be free to carry an independent sequence-1 baseline row per branch.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS internal_table_migrations_baseline_sequence_uniq
      ON internal_table_migrations (internal_table_id, branch_id, sequence)
      WHERE kind = 'baseline'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS internal_table_migrations_baseline_sequence_uniq`);
  }
}
