import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOwnerInOrganization1698603800358 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organizations',
      new TableColumn({
        name: 'ownerId',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'ownerId');
  }
}
