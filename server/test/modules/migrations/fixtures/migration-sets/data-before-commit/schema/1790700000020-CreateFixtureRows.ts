import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFixtureRows1790700000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE fixture_rows (id int, label text)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE fixture_rows');
  }
}
