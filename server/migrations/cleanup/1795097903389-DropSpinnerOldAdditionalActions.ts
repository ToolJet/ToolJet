import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import { CopySpinnerAdditionalActions1795097903387 as Copy } from '../data/1795097903387-CopySpinnerAdditionalActions'; // migration-import-allowed: the moves this cleanup finishes

export class DropSpinnerOldAdditionalActions1795097903389 implements MigrationInterface {
  transaction = false;
  requires = 'CopySpinnerAdditionalActions1795097903387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, Copy.SYNC, Copy.MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
