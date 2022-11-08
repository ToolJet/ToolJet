import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class OrganizationsInheritSSO1656268228782 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organizations', [
      new TableColumn({
        name: 'inherit_sso',
        type: 'boolean',
        default: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
