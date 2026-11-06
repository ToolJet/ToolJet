import { MigrationInterface, QueryRunner } from 'typeorm';

// data_queries had only its primary key. Every app load reads queries by app version, and every Query Library
// "used by" / delete check finds consumers through the workspace's single static library data source.
// Plain CREATE INDEX (not CONCURRENTLY, which cannot run inside the migration transaction): it blocks writes to
// data_queries while it builds, reads keep working.
export class AddDataQueryIndexes1792700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_data_queries_app_version_id" ON "data_queries" ("app_version_id")'
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "idx_data_queries_data_source_id" ON "data_queries" ("data_source_id")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_data_queries_data_source_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_data_queries_app_version_id"');
  }
}
