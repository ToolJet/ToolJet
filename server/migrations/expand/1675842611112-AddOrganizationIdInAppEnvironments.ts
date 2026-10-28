import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOrganizationIdInAppEnvironments1675842611112 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_environments',
      new TableColumn({
        name: 'organization_id',
        type: 'uuid',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
