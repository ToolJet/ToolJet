import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTjdbPermission1782112343421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'permission_groups',
      new TableColumn({
        name: 'tjdb_crud',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('permission_groups', 'tjdb_crud');
  }
}
