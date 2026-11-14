import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDelimiterToSsoConfigOidcGroupSync1793000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sso_config_oidc_group_sync',
      new TableColumn({
        name: 'delimiter',
        type: 'varchar',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sso_config_oidc_group_sync', 'delimiter');
  }
}
