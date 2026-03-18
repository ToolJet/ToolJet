import { MigrationInterface, QueryRunner } from 'typeorm';

export class Updatepgsqlssltoggletoboolean1773225075273 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE data_source_options dso
        SET "options" = (
          "options"::jsonb
          || jsonb_build_object(
              'ssl_enabled',
              CASE
                WHEN ("options"::jsonb -> 'ssl_enabled' ->> 'value') = 'enabled'
                  THEN jsonb_build_object('value', true, 'encrypted', false)
                WHEN ("options"::jsonb -> 'ssl_enabled' ->> 'value') = 'disabled'
                  THEN jsonb_build_object('value', false, 'encrypted', false)
                ELSE ("options"::jsonb -> 'ssl_enabled')
              END
          )
        )::json
        FROM data_sources ds
        WHERE ds.id = dso.data_source_id
          AND ds.kind = 'postgresql'
          AND ("options"::jsonb -> 'ssl_enabled' ->> 'value') IN ('enabled', 'disabled');
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
