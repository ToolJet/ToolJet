import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddApplicationIconColumn1641809680591 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'apps',
      new TableColumn({
        name: 'icon',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
