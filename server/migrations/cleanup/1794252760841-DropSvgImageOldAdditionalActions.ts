import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import { SVG_IMAGE_MOVES, SVG_IMAGE_SYNC } from '../data/1794252760838-CopySvgImageAdditionalActions'; // migration-import-allowed: the moves this cleanup finishes

export class DropSvgImageOldAdditionalActions1794252760841 implements MigrationInterface {
  transaction = false;
  requires = 'CopySvgImageAdditionalActions1794252760838';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, SVG_IMAGE_SYNC, SVG_IMAGE_MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
