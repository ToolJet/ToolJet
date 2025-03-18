import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class AddAppNameAppTypeWorkspaceConstraint1705379107714 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('apps', DataBaseConstraints.APP_NAME_UNIQUE);
    await queryRunner.createUniqueConstraint(
      'apps',
      new TableUnique({
        name: DataBaseConstraints.APP_NAME_UNIQUE,
        columnNames: ['name', 'organization_id', 'type'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
