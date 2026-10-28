import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWebhookDetailsToApps1698825925206 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'workflow_api_token',
        type: 'varchar (64)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'workflow_enabled',
        type: 'boolean',
        isNullable: false,
        default: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('apps', 'workflow_api_token');
    await queryRunner.dropColumn('apps', 'workflow_enabled');
  }
}
