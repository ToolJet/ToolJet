import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillMssqlDatasourceAuthType1773229182001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      UPDATE data_source_options
      SET "options" = (
        "options"::jsonb || '{"auth_type": {"value": "sql", "encrypted": false}}'::jsonb
      )::json
      FROM data_sources ds
      WHERE ds.id = data_source_id
        AND ds.kind = 'mssql'
        AND NOT ("options"::jsonb ? 'auth_type')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: remove auth_type only for MSSQL datasources

    await queryRunner.query(`
      UPDATE data_source_options
      SET "options" = ("options"::jsonb - 'auth_type')::json
      FROM data_sources ds
      WHERE ds.id = data_source_id
        AND ds.kind = 'mssql'
    `);
  }
}

