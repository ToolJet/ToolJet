import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDeprecatedSourceOptionsFieldsInClickhousePlugin1764062755731 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE data_source_options
            SET "options" = ("options"::jsonb - 'usePost' - 'trimQuery' - 'isUseGzip' - 'debug' - 'raw')::json
            FROM data_sources ds
            WHERE ds.id = data_source_options.data_source_id AND ds.kind = 'clickhouse'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}

}