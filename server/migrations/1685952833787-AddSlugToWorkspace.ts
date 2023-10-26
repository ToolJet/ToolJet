import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from 'typeorm';

export class AddSlugToWorkspace1685952833787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organizations',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        length: '50',
        isNullable: true,
      })
    );

    await queryRunner.createUniqueConstraint(
      'organizations',
      new TableUnique({
        name: DataBaseConstraints.WORKSPACE_SLUG_UNIQUE,
        columnNames: ['slug'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'slug');
  }
}
