import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAutomaticSsoLoginInOrganizations1723720691704 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organizations', [
      new TableColumn({
        name: 'automatic_sso_login',
        type: 'boolean',
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
