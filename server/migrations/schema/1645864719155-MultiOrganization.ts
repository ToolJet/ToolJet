import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MultiOrganization1645864719155 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organization_users',
      new TableColumn({
        name: 'invitation_token',
        type: 'varchar',
        isNullable: true,
      })
    );
    await queryRunner.dropColumn('users', 'sso');
    await queryRunner.dropColumn('users', 'sso_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
