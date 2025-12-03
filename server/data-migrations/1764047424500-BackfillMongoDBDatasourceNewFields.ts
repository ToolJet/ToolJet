import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillMongoDBDatasourceNewFields1764000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      UPDATE data_source_options dso
      SET "options" = (
        "options"::jsonb
        || jsonb_build_object(
            'connection_format',
              COALESCE(("options"::jsonb -> 'connection_format'), jsonb_build_object('value','mongodb')),
            'use_ssl',
              COALESCE(("options"::jsonb -> 'use_ssl'), jsonb_build_object('value', false, 'encrypted', false))
        )
      )::json
      FROM data_sources ds
      WHERE ds.id = dso.data_source_id
        AND ds.kind = 'mongodb';
    `);

    await queryRunner.query(`
      UPDATE data_source_options dso
      SET "options" = jsonb_set(
          "options"::jsonb,
          '{connection_string}',
          jsonb_build_object(
              'value', ("options"::jsonb -> 'connection_string' ->> 'value'),
              'encrypted', true
          )
      )::json
      FROM data_sources ds
      WHERE ds.id = dso.data_source_id
        AND ds.kind = 'mongodb'
        AND ("options"::jsonb -> 'connection_string') IS NOT NULL;
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE data_source_options dso
      SET "options" = ("options"::jsonb - 'connection_format' - 'use_ssl')::json
      FROM data_sources ds
      WHERE ds.id = dso.data_source_id
        AND ds.kind = 'mongodb';
    `);
  }
}

