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

    // Prefill password_allowed_domains with existing domain values
    await queryRunner.query(
      `UPDATE organizations SET password_allowed_domains = domain WHERE domain IS NOT NULL AND domain != ''`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organizations', 'password_allowed_domains');
    await queryRunner.dropColumn('organizations', 'password_restricted_domains');
  }
}

