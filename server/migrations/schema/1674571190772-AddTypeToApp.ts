import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeToApp1674571190772 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: false,
        default: "'front-end'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('apps', 'type');
  }
}
