import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultDataSourceVersionsForAll1772568628000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default data_source_versions for ALL data sources that don't already have one.
    // The prior seed (1772568627000) only covered global DS in git-sync enabled orgs.
    // This ensures every data source has a default version entry, enabling the
    // eventual transition from data_source_options to data_source_version_options.
    await queryRunner.query(`
      INSERT INTO data_source_versions (data_source_id, name, is_default, is_active, branch_id)
      SELECT ds.id, ds.name, true, true, NULL::uuid
      FROM data_sources ds
      WHERE NOT EXISTS (
        SELECT 1 FROM data_source_versions dsv
        WHERE dsv.data_source_id = ds.id AND dsv.is_default = true
      )
      ON CONFLICT DO NOTHING;
    `);

    // Copy data_source_options → data_source_version_options for the newly created default versions
    await queryRunner.query(`
      INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
      SELECT dsv.id, dso.environment_id, COALESCE(dso.options, '{}'::json)::jsonb
      FROM data_source_options dso
      JOIN data_source_versions dsv
        ON dsv.data_source_id = dso.data_source_id AND dsv.is_default = true
      WHERE NOT EXISTS (
        SELECT 1 FROM data_source_version_options dsvo
        WHERE dsvo.data_source_version_id = dsv.id AND dsvo.environment_id = dso.environment_id
      )
      ON CONFLICT (data_source_version_id, environment_id) DO NOTHING;
    `);

    // Create version-specific DSVs for global data sources referenced by each VERSION-type app version.
    // Branch-type app_versions resolve DS options through their branch_id → branch DSV,
    // so they should NOT get app_version_id-based DSVs.
    // Only VERSION-type versions get their own DSV snapshots (frozen DS config at publish time).
    await queryRunner.query(`
      INSERT INTO data_source_versions (data_source_id, app_version_id, name, is_default, is_active, branch_id, version_from_id)
      SELECT DISTINCT ds.id, av.id, ds.name, false, true, NULL::uuid, def_dsv.id
      FROM app_versions av
      JOIN data_queries dq ON dq.app_version_id = av.id
      JOIN data_sources ds ON ds.id = dq.data_source_id AND ds.scope = 'global'
      JOIN data_source_versions def_dsv ON def_dsv.data_source_id = ds.id AND def_dsv.is_default = true
      WHERE av.version_type != 'branch'
        AND NOT EXISTS (
          SELECT 1 FROM data_source_versions dsv
          WHERE dsv.data_source_id = ds.id AND dsv.app_version_id = av.id
        )
      ON CONFLICT DO NOTHING;
    `);

    // Copy default DSV options into the newly created version-specific DSVs
    await queryRunner.query(`
      INSERT INTO data_source_version_options (data_source_version_id, environment_id, options)
      SELECT new_dsv.id, def_dsvo.environment_id, def_dsvo.options
      FROM data_source_versions new_dsv
      JOIN data_source_versions def_dsv
        ON def_dsv.data_source_id = new_dsv.data_source_id AND def_dsv.is_default = true
      JOIN data_source_version_options def_dsvo
        ON def_dsvo.data_source_version_id = def_dsv.id
      WHERE new_dsv.app_version_id IS NOT NULL
        AND new_dsv.is_default = false
        AND NOT EXISTS (
          SELECT 1 FROM data_source_version_options dsvo
          WHERE dsvo.data_source_version_id = new_dsv.id AND dsvo.environment_id = def_dsvo.environment_id
        )
      ON CONFLICT (data_source_version_id, environment_id) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove options for version-specific DSVs (created by this migration)
    await queryRunner.query(`
      DELETE FROM data_source_version_options
      WHERE data_source_version_id IN (
        SELECT id FROM data_source_versions WHERE app_version_id IS NOT NULL AND is_default = false AND branch_id IS NULL
      );
    `);
    await queryRunner.query(`
      DELETE FROM data_source_versions WHERE app_version_id IS NOT NULL AND is_default = false AND branch_id IS NULL;
    `);

    // Remove version options for default versions with no branch (created by this migration)
    await queryRunner.query(`
      DELETE FROM data_source_version_options
      WHERE data_source_version_id IN (
        SELECT id FROM data_source_versions WHERE is_default = true AND branch_id IS NULL
      );
    `);
    await queryRunner.query(`
      DELETE FROM data_source_versions WHERE is_default = true AND branch_id IS NULL;
    `);
  }
}
