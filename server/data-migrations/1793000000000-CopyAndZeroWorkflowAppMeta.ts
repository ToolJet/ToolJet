import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'CopyAndZeroWorkflowAppMeta1793000000000';

/**
 * Finishes CopyWorkflowAppMetaToAppVersions1782250000000: zeroes apps.* for workflows once their
 * metadata lives on app_versions. That schema migration used to zero apps.* itself, but async mode
 * runs it before the data phase, and 3.21.58 reads workflow name/slug/icon from apps.*: a failed data
 * phase would have left 3.21.58 with nameless workflows.
 *
 * Acts only on workflows whose apps.name is still set. Current code creates apps with name NULL, and
 * the old migration already zeroed every older workflow, so on upgraded databases this finds nothing.
 * On a database coming from 3.21.58 it also catches workflows 3.21.58 created after a failed attempt
 * was rolled back: their metadata is copied first (slug and name made unique), then apps.* is zeroed.
 */
export class CopyAndZeroWorkflowAppMeta1793000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      `SELECT count(*)::int AS total FROM apps WHERE type = 'workflow' AND name IS NOT NULL`
    );
    console.log(`${MIGRATION_NAME}: [START] Copy and zero workflow metadata: ${total}`);
    if (!total) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] Copy and zero workflow metadata finished.`);
      return;
    }

    // Unique against every other workflow's app_versions values, the way the triggers compare them.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_slug VARCHAR;
        new_name VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, COALESCE(slug, id::text) AS slug, name
          FROM apps
          WHERE type = 'workflow' AND name IS NOT NULL
          ORDER BY created_at ASC, id ASC
        LOOP
          new_slug := rec.slug;
          suffix := 1;
          WHILE EXISTS (
            SELECT 1 FROM app_versions av JOIN apps a ON a.id = av.app_id
            WHERE a.type = 'workflow' AND av.app_id <> rec.id AND LOWER(av.slug) = LOWER(new_slug)
          ) LOOP
            new_slug := rec.slug || '_' || suffix;
            suffix := suffix + 1;
          END LOOP;

          new_name := rec.name;
          suffix := 1;
          WHILE EXISTS (
            SELECT 1 FROM app_versions av JOIN apps a ON a.id = av.app_id
            WHERE a.type = 'workflow' AND a.organization_id = (SELECT organization_id FROM apps WHERE id = rec.id)
              AND av.app_id <> rec.id AND av.app_name = new_name
          ) LOOP
            new_name := rec.name || '_' || suffix;
            suffix := suffix + 1;
          END LOOP;

          UPDATE app_versions av
          SET slug = new_slug, app_name = new_name, icon = a.icon, is_public = a.is_public
          FROM apps a
          WHERE a.id = rec.id AND av.app_id = a.id;
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE apps
      SET slug = id, name = NULL, icon = NULL, is_public = false
      WHERE type = 'workflow' AND name IS NOT NULL
    `);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Copy and zero workflow metadata finished.`);
  }

  public async down(): Promise<void> {
    // Irreversible: apps.* is a placeholder for workflows; the values live on app_versions.
  }
}
