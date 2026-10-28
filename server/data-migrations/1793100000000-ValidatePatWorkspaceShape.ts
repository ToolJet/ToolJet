import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'ValidatePatWorkspaceShape1793100000000';

/**
 * Finishes GeneralizeUserPersonalAccessTokens1787724102950 in the data phase, where 3.21.58 no longer reads
 * the old workspace PATs: drops those without a workspace, then validates the check that schema migration
 * added NOT VALID. VALIDATE CONSTRAINT blocks neither reads nor writes. Finds nothing once validated.
 */
export class ValidatePatWorkspaceShape1793100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [, deleted] = await queryRunner.query(
      `DELETE FROM user_personal_access_tokens WHERE scope = 'workspace' AND organization_id IS NULL`
    );
    console.log(`${MIGRATION_NAME}: [START] Validate workspace PAT shape: ${deleted ?? 0} old workspace PATs deleted`);
    await queryRunner.query(
      `ALTER TABLE user_personal_access_tokens VALIDATE CONSTRAINT check_user_pat_workspace_shape`
    );
    console.log(`${MIGRATION_NAME}: [SUCCESS] Validate workspace PAT shape finished.`);
  }

  public async down(): Promise<void> {
    // Irreversible: the deleted PATs were unusable on this release, and a valid check stays valid.
  }
}
