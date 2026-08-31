import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersionStatus } from 'src/entities/app_version.entity';
export class UpdateAppVersionStatusAndFields1758793442013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Preserve existing DRAFT/PUBLISHED status. This migration only BACKFILLS a status for
    // versions that don't yet have one (status IS NULL) — it must never rewrite an already-set
    // status. The environment heuristic below ('development' env = DRAFT, else PUBLISHED) is a
    // last resort for legacy rows with a null status; applying it to rows that already carry a
    // status flips valid drafts (e.g. an app whose editing version sits on the production env)
    // to PUBLISHED, leaving the app with no editable draft on an lts->latest migration.
    const allVersions = await queryRunner.query(`
        SELECT id FROM app_versions WHERE status IS NULL
    `);
    if (!allVersions.length) {
      return;
    }
    const allDevelopmentVersionIds = await queryRunner.query(`
            SELECT av.id
            FROM app_versions av
            INNER JOIN app_environments ae ON av.current_environment_id = ae.id
            WHERE ae.name = 'development' AND av.status IS NULL
        `);

    const allReleasedVersionIds = await queryRunner.query(`
    SELECT current_version_id FROM apps WHERE current_version_id IS NOT NULL
  `);

    const releasedVersionIds = new Set((allReleasedVersionIds || []).map((row) => row.current_version_id));

    // Development versions that are NOT released (drafts)
    const draftVersionStatusArray = (allDevelopmentVersionIds || [])
      .map((row) => row.id)
      .filter((id) => !releasedVersionIds.has(id));

    const draftVersionIds = new Set(draftVersionStatusArray);

    // All versions that are not drafts (published)
    const publishedVersionStatusArray = (allVersions || [])
      .map((row) => row.id)
      .filter((id) => !draftVersionIds.has(id));

    if (publishedVersionStatusArray.length) {
      await queryRunner.query(`UPDATE app_versions SET status = $1 WHERE id = ANY($2::uuid[])`, [
        AppVersionStatus.PUBLISHED,
        publishedVersionStatusArray,
      ]);
    }

    if (draftVersionStatusArray.length) {
      await queryRunner.query(`UPDATE app_versions SET status = $1 WHERE id = ANY($2::uuid[])`, [
        AppVersionStatus.DRAFT,
        draftVersionStatusArray,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
// For older versions: Set status based on environment
// - Non-development versions → PUBLISHED (they are already in a non-editable state)
// - Development versions → DRAFT (they are still in development and users may need to edit them)
