import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../../../../../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import { DIVIDER_MOVES, DIVIDER_SYNC } from '../data/1790800000023-CopyFixtureDividerLineStyle'; // migration-import-allowed: the moves this cleanup finishes

// The cleanup migration template in server/docs/APP_DEFINITION_MIGRATIONS.md, for the format change example.

export class DropFixtureDividerOldDashed1790800000024 implements MigrationInterface {
  transaction = false;
  requires = 'CopyFixtureDividerLineStyle1790800000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, DIVIDER_SYNC, DIVIDER_MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
