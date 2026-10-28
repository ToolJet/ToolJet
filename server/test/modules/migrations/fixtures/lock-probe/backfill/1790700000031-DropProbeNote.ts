import { MigrationInterface, QueryRunner } from 'typeorm';

/** Fails the probe: a backfill holds ACCESS EXCLUSIVE on users for the whole run. */
export class DropProbeNote1790700000031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users DROP COLUMN probe_note');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users ADD COLUMN probe_note text');
  }
}
