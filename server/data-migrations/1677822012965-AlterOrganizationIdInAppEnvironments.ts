import { AppEnvironment } from 'src/entities/app_environments.entity';
import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AlterOrganizationIdInAppEnvironments1677822012965 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    //Delete old app_environments which are not under organizations
    await entityManager.delete(AppEnvironment, { organizationId: null });

    //Add not null constrain to organization_id column
    await queryRunner.query('alter table app_environments alter column organization_id set not null');

    //Add Foreign key and delete constraints on organization_id column
    await queryRunner.createForeignKey(
      'app_environments',
      new TableForeignKey({
        columnNames: ['organization_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'organizations',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
