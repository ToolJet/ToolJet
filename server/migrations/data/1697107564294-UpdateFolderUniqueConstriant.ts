import { DataBaseConstraints } from '@helpers/db_constraints.constants';
import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class UpdateFolderUniqueConstriant1697107564294 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropUniqueConstraint('folders', DataBaseConstraints.FOLDER_NAME_UNIQUE);
    await queryRunner.createUniqueConstraint(
      'folders',
      new TableUnique({
        name: DataBaseConstraints.FOLDER_NAME_UNIQUE,
        columnNames: ['name', 'type', 'organization_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
