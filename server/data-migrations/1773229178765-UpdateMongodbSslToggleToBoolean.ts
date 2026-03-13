import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMongodbSslToggleToBoolean1773229178765 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        UPDATE data_source_options dso
        SET "options" = (
          "options"::jsonb
          || jsonb_build_object(
              'use_ssl',
              CASE
                WHEN ("options"::jsonb -> 'use_ssl' ->> 'value') = 'enabled'
                  THEN jsonb_build_object('value', true, 'encrypted', false)
                WHEN ("options"::jsonb -> 'use_ssl' ->> 'value') = 'disabled'
                  THEN jsonb_build_object('value', false, 'encrypted', false)
                ELSE ("options"::jsonb -> 'use_ssl')
              END
          )
        )::json
        FROM data_sources ds
        WHERE ds.id = dso.data_source_id
          AND ds.kind = 'mongodb'
          AND ("options"::jsonb -> 'use_ssl' ->> 'value') IN ('enabled', 'disabled');
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}