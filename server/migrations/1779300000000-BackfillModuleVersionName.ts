import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillModuleVersionName1779300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE components c
      SET properties = jsonb_set(
        c.properties::jsonb,
        '{moduleVersionId,versionName}',
        to_jsonb(av.name)
      )::json
      FROM app_versions av
      WHERE c.type = 'ModuleViewer'
        AND (
          (c.properties::jsonb -> 'moduleVersionId' ->> 'versionName') IS NULL
          OR (c.properties::jsonb -> 'moduleVersionId' ->> 'versionName') = ''
        )
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') IS NOT NULL
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value') <> ''
        AND (c.properties::jsonb -> 'moduleVersionId' ->> 'value')
              ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND av.module_reference_id = (c.properties::jsonb -> 'moduleVersionId' ->> 'value')::uuid
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
