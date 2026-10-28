import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../../../../../../src/migration-helpers/migration-mode';

/** Fills rows in up(); builds the index in beforeCommit(), after every later data migration. */
export class FillFixtureRows1790700000021 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO fixture_rows SELECT g, 'row ' || g FROM generate_series(1, 10) g`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE INDEX fixture_rows_label ON fixture_rows (label)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS fixture_rows_label');
    await queryRunner.query('DELETE FROM fixture_rows');
  }
}
