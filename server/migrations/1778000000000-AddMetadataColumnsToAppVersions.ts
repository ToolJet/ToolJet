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
        default: false,
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

    // Step 3: Backfill slug and app_name for all version
    await queryRunner.query(`
      UPDATE app_versions av
      SET slug = a.slug, app_name = a.name
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type IN ('front_end', 'module')
    `);

    // Step 4: Unique indexes — safe because only one version per app per branch
    // has non-NULL slug/app_name
    await queryRunner.query(`
      CREATE UNIQUE INDEX "app_versions_slug_branch_id_unique"
      ON app_versions (slug, branch_id)
      WHERE version_type = 'branch'
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "app_versions_app_name_branch_id_unique"
      ON app_versions (app_name, branch_id)
      WHERE version_type = 'branch'
    `);
    

    // Step 5: Clean apps table for non-workflows (slug = id placeholder for existing constraint)
    await queryRunner.query(`
      UPDATE apps
      SET slug = id, name = NULL, icon = NULL, is_public = false
      WHERE type IN ('front_end', 'module')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
