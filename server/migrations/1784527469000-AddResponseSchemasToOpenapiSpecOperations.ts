import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddResponseSchemasToOpenapiSpecOperations1784527469000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('openapi_spec_operations', [
      new TableColumn({
        name: 'response_schemas',
        type: 'jsonb',
        isNullable: true,
      }),
      // Pruned (request_body_schema/response_schemas) truncate circular refs to {}. These _raw
      // counterparts instead preserve the reference expression (see markCircularRefs), stored
      // pre-stringified as text rather than jsonb.
      new TableColumn({
        name: 'request_body_schema_raw',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'response_schemas_raw',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('openapi_spec_operations', [
      'response_schemas',
      'request_body_schema_raw',
      'response_schemas_raw',
    ]);
  }
}
