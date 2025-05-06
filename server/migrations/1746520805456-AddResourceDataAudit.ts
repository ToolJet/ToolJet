import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddResourceDataAudit1746520805456 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'audit_logs',
      new TableColumn({
        name: 'resource_data',
        type: 'json',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
