import { MigrationInterface, QueryRunner } from 'typeorm';

/** Passes the probe: a nullable column takes ACCESS EXCLUSIVE only for a moment. */
export class AddProbeNote1790700000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users ADD COLUMN probe_note text');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users DROP COLUMN probe_note');
  }
}
