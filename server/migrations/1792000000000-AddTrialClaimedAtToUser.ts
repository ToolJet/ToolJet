import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Backs the "one trial per account" rule for Cloud (self-hosted stays "one trial per instance",
 * enforced separately by the single LICENSE_KEY row in instance_settings).
 *
 * Nullable: null means "never claimed a trial", a timestamp means "claimed, and when" — the
 * value itself is never read, only its presence, so it also doubles as an audit trail for support
 * when someone asks why they can't self-serve another one.
 */
export class AddTrialClaimedAtToUser1792000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'trial_claimed_at',
        type: 'timestamptz',
        isNullable: true,
      })
    );

    // Backfill from history: every Cloud trial mint (auto-start, manual banner click, and the
    // AI-onboarding workspace) stamps organization_license.terms.meta.customerId with the user's
    // id, so existing trial users are recoverable without guessing. This is what makes it safe to
    // ship the column and the eligibility check in the same release — without it, every user who
    // already had a trial would read as eligible for a second one.
    await queryRunner.query(`
      UPDATE users u
      SET    trial_claimed_at = ol.created_at
      FROM   organization_license ol
      WHERE  ol.terms->'meta'->>'customerId' = u.id::text
        AND  u.trial_claimed_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'trial_claimed_at');
  }
}
