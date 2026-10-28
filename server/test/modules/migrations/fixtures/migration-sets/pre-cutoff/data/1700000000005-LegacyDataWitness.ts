import { MigrationInterface, QueryRunner } from 'typeorm';

/** A pre-cutoff data migration: applied by the schema-phase pod only if the whole upgrade ran in one transaction. */
export class LegacyDataWitness1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('INSERT INTO legacy_witness DEFAULT VALUES');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM legacy_witness');
  }
}
