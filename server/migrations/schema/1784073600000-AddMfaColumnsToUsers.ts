import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMfaColumnsToUsers1784073600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'mfa_enabled',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'mfa_setup_completed_at',
        type: 'timestamptz',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'mfa_setup_completed_at');
    await queryRunner.dropColumn('users', 'mfa_enabled');
  }
}
