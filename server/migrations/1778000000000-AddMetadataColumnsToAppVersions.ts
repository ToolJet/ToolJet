import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMetadataColumnsToAppVersions1778000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns to app_versions
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'app_name',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'is_public',
        type: 'boolean',
        default: true,
        isNullable: true,
      })
    );

    // Step 2: Backfill icon and is_public on ALL non-workflow versions
    await queryRunner.query(`
      UPDATE app_versions av
      SET
        icon = a.icon,
        is_public = a.is_public
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
    `);

    // Step 3: Backfill slug and app_name only on BRANCH-type versions.
    // Each branch (including default) has exactly one BRANCH version per app —
    // that's the canonical carrier of slug/app_name.
    // All VERSION-type versions (draft, saved, released) keep NULL.
    await queryRunner.query(`
      UPDATE app_versions av
      SET slug = a.slug, app_name = a.name
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
        AND av.version_type = 'branch'
    `);

    // Step 3b: Non-git-sync workspaces have no BRANCH versions.
    // Backfill slug/app_name on ALL VERSION-type versions where branch_id IS NULL.
    // The unique index uses WHERE branch_id IS NOT NULL, so these rows are excluded.
    await queryRunner.query(`
      UPDATE app_versions av
      SET slug = a.slug, app_name = a.name
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
        AND av.version_type = 'version'
        AND av.branch_id IS NULL
    `);

    // Step 4: Unique indexes — safe because only one version per app per branch
    // has non-NULL slug/app_name
    await queryRunner.query(`
      CREATE UNIQUE INDEX "app_versions_slug_branch_id_unique"
      ON app_versions (slug, branch_id)
      WHERE branch_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "app_versions_app_name_branch_id_unique"
      ON app_versions (app_name, branch_id)
      WHERE branch_id IS NOT NULL
    `);

    // Step 5: Drop old version name uniqueness and add new one with branchId
    await queryRunner.query(`
      ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS "name_app_id_app_versions_unique"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "name_app_id_branch_id_app_versions_unique"
      ON app_versions (name, app_id, branch_id)
      WHERE branch_id IS NOT NULL
    `);

    // Step 6: Clean apps table for non-workflows (slug = id placeholder for existing constraint)
    await queryRunner.query(`
      UPDATE apps
      SET slug = id, name = NULL, icon = NULL, is_public = NULL
      WHERE type IN ('front_end', 'module')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore apps table data from the BRANCH-type version (slug carrier)
    await queryRunner.query(`
      UPDATE apps a
      SET
        slug = av.slug,
        name = av.app_name,
        icon = av.icon,
        is_public = av.is_public
      FROM app_versions av
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
        AND av.version_type = 'branch'
        AND av.slug IS NOT NULL
    `);

    // Restore non-git-sync apps from VERSION versions (no BRANCH version exists)
    await queryRunner.query(`
      UPDATE apps a
      SET
        slug = sub.slug,
        name = sub.app_name,
        icon = sub.icon,
        is_public = sub.is_public
      FROM (
        SELECT DISTINCT ON (app_id) app_id, slug, app_name, icon, is_public
        FROM app_versions
        WHERE version_type = 'version' AND branch_id IS NULL AND slug IS NOT NULL
        ORDER BY app_id, updated_at DESC
      ) sub
      WHERE sub.app_id = a.id
        AND a.type IN ('front_end', 'module')
        AND a.name IS NULL
    `);

    // Drop new indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_slug_branch_id_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "app_versions_app_name_branch_id_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "name_app_id_branch_id_app_versions_unique"`);

    // Restore old constraint
    await queryRunner.query(`
      ALTER TABLE app_versions ADD CONSTRAINT "name_app_id_app_versions_unique" UNIQUE (name, app_id)
    `);

    // Drop new columns
    await queryRunner.dropColumn('app_versions', 'is_public');
    await queryRunner.dropColumn('app_versions', 'icon');
    await queryRunner.dropColumn('app_versions', 'app_name');
    await queryRunner.dropColumn('app_versions', 'slug');
  }
}
