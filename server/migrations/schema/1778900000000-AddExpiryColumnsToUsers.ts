import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExpiryColumnsToUsers1778900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'invitation_token_expiry',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'forgot_password_token_expiry',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'password_expiry',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'expired_password_token',
        type: 'varchar',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'expired_password_token');
    await queryRunner.dropColumn('users', 'password_expiry');
    await queryRunner.dropColumn('users', 'forgot_password_token_expiry');
    await queryRunner.dropColumn('users', 'invitation_token_expiry');
  }
}
