import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import { CopyBoundedBoxAdditionalActions1795097903388 as Copy } from '../data/1795097903388-CopyBoundedBoxAdditionalActions'; // migration-import-allowed: the moves this cleanup finishes

export class DropBoundedBoxOldAdditionalActions1795097903390 implements MigrationInterface {
  transaction = false;
  requires = 'CopyBoundedBoxAdditionalActions1795097903388';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, Copy.SYNC, Copy.MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
