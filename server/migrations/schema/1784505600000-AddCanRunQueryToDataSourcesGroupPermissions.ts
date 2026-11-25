import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCanRunQueryToDataSourcesGroupPermissions1784505600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE data_sources_group_permissions ADD COLUMN can_run_query BOOLEAN NOT NULL DEFAULT true`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE data_sources_group_permissions DROP COLUMN can_run_query`);
  }
}
