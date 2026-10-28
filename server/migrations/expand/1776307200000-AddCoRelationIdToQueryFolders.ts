import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoRelationIdToQueryFolders1776307200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE data_query_folders
      ADD COLUMN IF NOT EXISTS co_relation_id UUID DEFAULT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE data_query_folder_mappings
      ADD COLUMN IF NOT EXISTS co_relation_id UUID DEFAULT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE data_query_folder_mappings
      DROP COLUMN IF EXISTS co_relation_id;
    `);

    await queryRunner.query(`
      ALTER TABLE data_query_folders
      DROP COLUMN IF EXISTS co_relation_id;
    `);
  }
}
