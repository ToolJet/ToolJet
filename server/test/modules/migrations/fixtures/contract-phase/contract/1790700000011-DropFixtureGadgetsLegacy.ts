import { MigrationInterface, QueryRunner } from 'typeorm';
import { withShortLock } from '../../../../../../src/migration-helpers/with-short-lock';

export class DropFixtureGadgetsLegacy1790700000011 implements MigrationInterface {
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await withShortLock(queryRunner, ['ALTER TABLE fixture_gadgets DROP COLUMN IF EXISTS legacy']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE fixture_gadgets ADD COLUMN IF NOT EXISTS legacy text');
  }
}
