import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NEUTRALISED for the lts->latest migration flow.
 *
 * This migration originally CLONED a new DRAFT VERSION-type row (on the default branch) from an
 * app's latest branchless PUBLISHED row, for every front-end app / module in a git-enabled
 * workspace that lacked a default-branch draft.
 *
 * The migration path now PRESERVES every app_version exactly as it is and only attaches it to
 * the default branch — it does NOT create drafts. When a customer wants to git-sync an app they
 * create the draft themselves through the normal editing flow.
 *
 * Safe to make a no-op:
 *   - It was already scoped to git-enabled workspaces, and the consolidated setup wipes git
 *     config on the lts path, so it produced nothing there anyway.
 *   - Beta/main already ran the original version (recorded), so they are unaffected.
 *   - A fresh install has no apps, so the original was a no-op there too.
 */
export class CloneDefaultBranchDraftFromPublished1779650000000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally does nothing — see the class comment.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op.
  }
}
