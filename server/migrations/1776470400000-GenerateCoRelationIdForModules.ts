import { MigrationInterface, QueryRunner } from 'typeorm';

export class GenerateCoRelationIdForModules1776470400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Generate co_relation_id for module-type apps that don't have one yet
    await queryRunner.query(`
      UPDATE apps
      SET co_relation_id = gen_random_uuid()
      WHERE type = 'module'
        AND co_relation_id IS NULL;
    `);

    // Update ModuleViewer component properties: replace moduleAppId.value (raw DB id)
    // with the module app's co_relation_id so GitSync can resolve the reference
    // portably across environments.
    // components.properties is stored as json, so we cast to jsonb for manipulation then back to json.
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleAppId,value}',
        to_jsonb(a.co_relation_id::text)
      )::json
      FROM apps a
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') = a.id::text
        AND a.type = 'module';
    `);

    // Add module_reference_id to app_versions: stable, portable per-row identity
    // that survives branching, merging, and cross-instance pulls.
    await queryRunner.query(`
      ALTER TABLE app_versions ADD COLUMN IF NOT EXISTS module_reference_id uuid;
    `);
    // Partial index — only module versions ever have non-NULL module_reference_id,
    // so we skip the dead non-module rows entirely.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_app_versions_module_ref_branch
        ON app_versions (module_reference_id, branch_id)
        WHERE module_reference_id IS NOT NULL;
    `);

    // Backfill: only module-type versions get a UUID. Non-module versions never
    // need module_reference_id — the resolver only queries it for module apps,
    // so populating others would be dead data.
    await queryRunner.query(`
      UPDATE app_versions av
      SET module_reference_id = gen_random_uuid()
      FROM apps a
      WHERE av.app_id = a.id
        AND a.type = 'module'
        AND av.module_reference_id IS NULL;
    `);

    // Capture the origin feature-branch_id of anomalous module VERSION rows
    // BEFORE the normalize step below moves them to default. 1776600000000
    // reads this staging table to seed a BRANCH-type row on each module's
    // origin branch, so users opening that branch still see the module they
    // created there. NULL branch_id rows (legacy pre-branching shape) are
    // intentionally excluded — there's no feature branch to restore to.
    // The staging table is dropped at the end of 1776600000000's up().
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS module_origin_branch_staging (
        app_id           uuid PRIMARY KEY,
        origin_branch_id uuid NOT NULL,
        created_at       timestamp NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      INSERT INTO module_origin_branch_staging (app_id, origin_branch_id)
      SELECT av.app_id, av.branch_id
      FROM app_versions av
      JOIN apps a ON a.id = av.app_id
      JOIN organization_git_sync_branches default_b
        ON default_b.organization_id = a.organization_id
       AND default_b.is_default = true
      WHERE a.type = 'module'
        AND av.version_type = 'version'
        AND av.branch_id IS NOT NULL
        AND av.branch_id <> default_b.id
        AND COALESCE(av.is_stub, false) = false
      ON CONFLICT (app_id) DO NOTHING;
    `);

    // Normalize module VERSION-type rows onto the org's default branch. Older
    // create paths inserted version-type rows with branch_id = active feature
    // branch (a categorical violation: VERSION rows belong on default, BRANCH
    // rows belong on a feature branch). The pin-promotion step below joins
    // against `default_b.is_default = true AND released.branch_id = default_b.id`
    // — anomalous rows on feature branches would silently fail that join and
    // their consumers' DRAFT pins would fall through to the collapse path
    // instead of being promoted to the released mref. Move them first.
    await queryRunner.query(`
      UPDATE app_versions av
      SET branch_id = wb.id
      FROM apps a
      JOIN organization_git_sync_branches wb
        ON wb.organization_id = a.organization_id AND wb.is_default = true
      WHERE av.app_id = a.id
        AND a.type = 'module'
        AND av.version_type = 'version'
        AND av.branch_id IS DISTINCT FROM wb.id
        AND COALESCE(av.is_stub, false) = false;
    `);

    // Rewrite moduleVersionId.value on non-DRAFT-source pins: components pin a
    // specific app_version row by its DB id; we rewrite that to the row's
    // module_reference_id, which is preserved across push/pull and cross-instance
    // sync. Non-DRAFT pins are deliberate user choices — preserved exactly.
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(av.module_reference_id::text)
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.id::text
        AND av.status <> 'DRAFT';
    `);

    // Promote DRAFT-source pins to the module's released mref where one exists.
    // DRAFT pins were typically auto-pins from drop time, not deliberate user
    // choices — the consumer's intent is "embed this module," and we satisfy
    // that by pointing at the canonical released VERSION row on the default
    // branch. The default-branch mref is stable across instances, so this pin
    // survives cross-workspace pulls. Modules with no released version yet
    // are handled by the collapse step below.
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(released.module_reference_id::text)
      )::json
      FROM app_versions av
      JOIN apps mod_app ON mod_app.id = av.app_id AND mod_app.type = 'module'
      JOIN organization_git_sync_branches default_b
        ON default_b.organization_id = mod_app.organization_id
       AND default_b.is_default = true
      JOIN app_versions released
        ON released.app_id = mod_app.id
       AND released.branch_id = default_b.id
       AND released.version_type = 'version'
       AND released.status <> 'DRAFT'
       AND COALESCE(released.is_stub, false) = false
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.id::text
        AND av.status = 'DRAFT'
        AND released.module_reference_id IS NOT NULL;
    `);

    // Collapse remaining DRAFT-source pins to '' (unpinned). Only fires for
    // modules that have no released VERSION row anywhere — the promotion step
    // above already handled every module with a release. The unpinned state
    // tells the resolver to pick "latest non-stub on consumer's branch."
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        '""'::jsonb
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.id::text
        AND av.status = 'DRAFT';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: rewrite moduleVersionId.value from module_reference_id → DB UUID.
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,value}',
        to_jsonb(av.id::text)
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') = av.module_reference_id::text;
    `);

    // Drop the module_reference_id column + index.
    await queryRunner.query(`DROP INDEX IF EXISTS idx_app_versions_module_ref_branch;`);
    await queryRunner.query(`ALTER TABLE app_versions DROP COLUMN IF EXISTS module_reference_id;`);

    // Drop the origin-branch staging table in case 1776600000000 didn't get
    // a chance to drop it (e.g., partial run).
    await queryRunner.query(`DROP TABLE IF EXISTS module_origin_branch_staging;`);

    // Restore ModuleViewer component properties to use the DB id instead of co_relation_id
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleAppId,value}',
        to_jsonb(a.id::text)
      )::json
      FROM apps a
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleAppId' ->> 'value') = a.co_relation_id::text
        AND a.type = 'module';
    `);
  }
}
