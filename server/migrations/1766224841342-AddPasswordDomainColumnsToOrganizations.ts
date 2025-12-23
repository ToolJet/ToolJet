import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordDomainColumnsToOrganizations1766224841342 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organizations', [
      new TableColumn({
        name: 'password_allowed_domains',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'password_restricted_domains',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'password_allowed_domains');
    await queryRunner.dropColumn('organizations', 'password_restricted_domains');
  }
}


