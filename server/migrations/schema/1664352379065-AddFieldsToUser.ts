import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFieldsToUser1664352379065 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'company_size',
        type: 'varchar',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'company_name',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', ['company_size', 'company_name']);
  }
}
