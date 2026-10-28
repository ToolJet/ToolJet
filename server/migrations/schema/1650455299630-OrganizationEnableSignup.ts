import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class OrganizationEnableSignup1650455299630 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('organizations', [
      new TableColumn({
        name: 'enable_sign_up',
        type: 'boolean',
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
