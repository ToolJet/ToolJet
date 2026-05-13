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

    // Step 4a: Dedupe (slug, branch_id) among branch-type rows.
    // The Step-3 backfill copies apps.slug onto every version row, which can collide
    // for branches that hold multiple version rows for the same app. Keep the oldest
    // row's slug as-is and rename later duplicates by appending the smallest unused
    // _N suffix within the same branch scope.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, slug, branch_id
          FROM (
            SELECT id, slug, branch_id,
                   ROW_NUMBER() OVER (
                     PARTITION BY slug, branch_id
                     ORDER BY created_at ASC, id ASC
                   ) AS rn
            FROM app_versions
            WHERE version_type = 'branch' AND slug IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.slug || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM app_versions
              WHERE version_type = 'branch'
                AND slug = new_value
                AND branch_id IS NOT DISTINCT FROM rec.branch_id
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET slug = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 4b: Dedupe (app_name, branch_id) among branch-type rows. Same algorithm
    // as Step 4a; the two fields can collide independently.
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_value VARCHAR;
        suffix INT;
      BEGIN
        FOR rec IN
          SELECT id, app_name, branch_id
          FROM (
            SELECT id, app_name, branch_id,
                   ROW_NUMBER() OVER (
                     PARTITION BY app_name, branch_id
                     ORDER BY created_at ASC, id ASC
                   ) AS rn
            FROM app_versions
            WHERE version_type = 'branch' AND app_name IS NOT NULL
          ) ranked
          WHERE rn > 1
        LOOP
          suffix := 1;
          LOOP
            new_value := rec.app_name || '_' || suffix;
            EXIT WHEN NOT EXISTS (
              SELECT 1 FROM app_versions
              WHERE version_type = 'branch'
                AND app_name = new_value
                AND branch_id IS NOT DISTINCT FROM rec.branch_id
            );
            suffix := suffix + 1;
          END LOOP;
          UPDATE app_versions SET app_name = new_value WHERE id = rec.id;
        END LOOP;
      END $$;
    `);

    // Step 4c: Unique indexes — duplicates resolved above.
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
