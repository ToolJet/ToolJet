import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHasUncommittedChangesToVersions1789000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE app_versions ADD COLUMN has_uncommitted_changes BOOLEAN NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE data_source_versions ADD COLUMN has_uncommitted_changes BOOLEAN NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN has_uncommitted_changes`);
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN has_uncommitted_changes`);
  }
}
