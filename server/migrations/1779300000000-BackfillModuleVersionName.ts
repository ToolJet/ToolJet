import { MigrationInterface, QueryRunner } from 'typeorm';

const UUID_RE = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

export class BackfillModuleVersionName1779300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Case 1: BRANCH DRAFT pin → unpinned (value="", versionName="")
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        jsonb_set(c.properties::jsonb, '{moduleVersionId,value}', '""'),
        '{moduleVersionId,versionName}', '""'
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') <> ''
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') ~ '${UUID_RE}'
        AND av.module_reference_id = (c.properties::jsonb -> 'moduleVersionId' ->> 'value')::uuid
        AND av.version_type = 'branch';
    `);

    // Case 2: VERSION DRAFT (git-sync default branch) pin → sentinel (value="__default_branch_draft__", versionName="")
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        jsonb_set(c.properties::jsonb, '{moduleVersionId,value}', '"__default_branch_draft__"'),
        '{moduleVersionId,versionName}', '""'
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') <> ''
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') ~ '${UUID_RE}'
        AND av.module_reference_id = (c.properties::jsonb -> 'moduleVersionId' ->> 'value')::uuid
        AND av.version_type = 'version'
        AND av.status = 'DRAFT'
        AND av.branch_id IS NOT NULL;
    `);

    // Case 3: branchless PUBLISHED pin → set versionName for Tier 0 resolution (runs last, most authoritative)
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,versionName}',
        to_jsonb(av.name)
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') <> ''
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') ~ '${UUID_RE}'
        AND av.module_reference_id = (c.properties::jsonb -> 'moduleVersionId' ->> 'value')::uuid
        AND av.branch_id IS NULL
        AND av.status = 'PUBLISHED'
        AND av.name IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE components
      SET properties = (
        (properties::jsonb) #- '{moduleVersionId,versionName}'
      )::json
      WHERE type = 'ModuleViewer'
        AND (properties::jsonb -> 'moduleVersionId' ->> 'versionName') IS NOT NULL;
    `);
  }
}
