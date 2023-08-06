import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class addUniqueKeyConstrainForOrganizationUsers1691258637690 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createUniqueConstraint(
      'organization_users',
      new TableUnique({
        name: DataBaseConstraints.USER_ORGANIZATION_UNIQUE,
        columnNames: ['user_id', 'organization_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('organization_users', DataBaseConstraints.USER_ORGANIZATION_UNIQUE);
  }
}
