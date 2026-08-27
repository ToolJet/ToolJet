import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NEUTRALISED for the lts->latest migration flow.
 *
 * This migration originally (1) CREATED an empty DRAFT VERSION-type row on the default branch
 * for every app that only had a PUBLISHED version, and (2) DETACHED branch_id from PUBLISHED
 * VERSION-type rows on the default branch.
 *
 * The migration path now PRESERVES every app_version exactly as it is and only attaches it to
 * the org's default branch — it does NOT create drafts and does NOT detach published rows.
 * Creating drafts here was also what let a later status backfill flip real drafts to PUBLISHED
 * and leave apps with no editable draft. When a customer wants to git-sync an app they create
 * the draft themselves through the normal editing flow.
 *
 * Safe to make a no-op:
 *   - Beta/main already ran the original version (recorded), so they are unaffected.
 *   - A fresh install has no apps, so the original was a no-op there too.
 */
export class EnsureDefaultBranchDraftVersion1777970000000 implements MigrationInterface {
  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally does nothing — see the class comment. Versions keep their status and stay
    // attached to the default branch (branch_id set by the consolidated setup migration).
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op.
  }
}
