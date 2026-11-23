import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeToFolder1675073833444 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'folders',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: false,
        default: "'front-end'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('folders', 'type');
  }
}
