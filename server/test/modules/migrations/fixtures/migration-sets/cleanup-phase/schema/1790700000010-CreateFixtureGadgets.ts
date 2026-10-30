import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFixtureGadgets1790700000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE fixture_gadgets (id int, legacy text)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE fixture_gadgets');
  }
}
