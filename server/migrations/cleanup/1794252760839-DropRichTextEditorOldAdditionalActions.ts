import { MigrationInterface, QueryRunner } from 'typeorm';
import { contractMovedKeys } from '../../src/migration-helpers/component-key-moves'; // migration-import-allowed: drops the sync trigger, then the old keys in short steps
import {
  RICH_TEXT_EDITOR_MOVES,
  RICH_TEXT_EDITOR_SYNC,
} from '../data/1794252760836-CopyRichTextEditorAdditionalActions'; // migration-import-allowed: the moves this cleanup finishes

export class DropRichTextEditorOldAdditionalActions1794252760839 implements MigrationInterface {
  transaction = false;
  requires = 'CopyRichTextEditorAdditionalActions1794252760836';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await contractMovedKeys(queryRunner, RICH_TEXT_EDITOR_SYNC, RICH_TEXT_EDITOR_MOVES);
  }

  public async down(): Promise<void> {
    // The old keys are not restored: no release that can still be rolled back to reads them.
  }
}
