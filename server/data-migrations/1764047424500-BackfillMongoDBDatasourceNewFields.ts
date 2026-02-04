import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillMongoDBDatasourceNewFields1764000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      UPDATE data_source_options dso
      SET "options" = (
        "options"::jsonb
        || jsonb_build_object(
            'connection_format',
              COALESCE(("options"::jsonb -> 'connection_format'), jsonb_build_object('value','mongodb','encrypted',false)),
            'use_ssl',
              COALESCE(("options"::jsonb -> 'use_ssl'), jsonb_build_object('value', false, 'encrypted', false))
        )
      )::json
      FROM data_sources ds
      WHERE ds.id = dso.data_source_id
        AND ds.kind = 'mongodb';
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
