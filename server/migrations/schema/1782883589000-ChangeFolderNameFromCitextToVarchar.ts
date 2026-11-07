import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeFolderNameFromCitextToVarchar1782883589000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE folders ALTER COLUMN name TYPE varchar;');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS citext;');
    await queryRunner.query('ALTER TABLE folders ALTER COLUMN name TYPE citext;');
  }
}
