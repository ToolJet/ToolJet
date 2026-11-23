import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import { CopyCalendarAdditionalActions1795418406138 as Copy } from '../data/1795418406138-CopyCalendarAdditionalActions'; // migration-import-allowed: the moves this cleanup finishes

export class DropCalendarOldAdditionalActions1795418406141 implements MigrationInterface {
  transaction = false;
  requires = 'CopyCalendarAdditionalActions1795418406138';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, Copy.SYNC, Copy.MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
