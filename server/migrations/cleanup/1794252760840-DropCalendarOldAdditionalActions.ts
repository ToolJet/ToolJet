import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import { CALENDAR_MOVES, CALENDAR_SYNC } from '../data/1794252760837-CopyCalendarAdditionalActions'; // migration-import-allowed: the moves this cleanup finishes

export class DropCalendarOldAdditionalActions1794252760840 implements MigrationInterface {
  transaction = false;
  requires = 'CopyCalendarAdditionalActions1794252760837';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, CALENDAR_SYNC, CALENDAR_MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
