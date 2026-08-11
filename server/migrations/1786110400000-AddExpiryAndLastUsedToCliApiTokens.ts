import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExpiryAndLastUsedToCliApiTokens1786110400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('cli_api_tokens', [
      new TableColumn({ name: 'expires_at', type: 'timestamptz', isNullable: true }),
      new TableColumn({ name: 'last_used_at', type: 'timestamptz', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('cli_api_tokens', ['expires_at', 'last_used_at']);
  }
}
