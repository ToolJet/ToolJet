import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTypeOfFolderName1706643884614 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query('CREATE EXTENSION IF NOT EXISTS citext;');
    queryRunner.query('ALTER TABLE folders ALTER COLUMN name TYPE citext;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query('ALTER TABLE folders ALTER COLUMN name TYPE varchar;');
    queryRunner.query('DROP EXTENSION IF EXISTS citext;');
  }
}
