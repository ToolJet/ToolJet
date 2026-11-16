import { MigrationInterface, QueryRunner } from 'typeorm';

/** Older than the authoring-rules cutoff, so async mode must not apply it while old pods serve. */
export class LegacyWitness1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE legacy_witness (id serial PRIMARY KEY)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE legacy_witness');
  }
}
