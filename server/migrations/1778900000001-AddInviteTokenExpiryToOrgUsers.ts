import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddInviteTokenExpiryToOrgUsers1778900000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'organization_users',
      new TableColumn({
        name: 'invitation_token_expiry',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('organization_users', 'invitation_token_expiry');
  }
}
