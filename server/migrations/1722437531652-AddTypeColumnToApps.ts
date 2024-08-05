import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeColumnToApps1722437531652 implements MigrationInterface {
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
