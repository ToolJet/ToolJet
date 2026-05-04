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

    // Step 2: Backfill from apps table for non-workflow apps
    await queryRunner.query(`
      UPDATE app_versions av
      SET
        slug = a.slug,
        app_name = a.name,
        icon = a.icon,
        is_public = a.is_public
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
    `);

    // Step 3: Add partial unique indexes (exclude NULL branch_id rows)
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

    // Step 4: Drop old version name uniqueness and add new one with branchId
    await queryRunner.query(`
      ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS "name_app_id_app_versions_unique"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "name_app_id_branch_id_app_versions_unique"
      ON app_versions (name, app_id, branch_id)
      WHERE branch_id IS NOT NULL
    `);

    // Step 5: Clean apps table for non-workflows (set slug = id to satisfy existing unique constraint)
    await queryRunner.query(`
      UPDATE apps
      SET slug = id, name = NULL, icon = NULL, is_public = NULL
      WHERE type IN ('front_end', 'module')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore apps table data from app_versions before dropping columns
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
        AND av.version_type = 'version'
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
