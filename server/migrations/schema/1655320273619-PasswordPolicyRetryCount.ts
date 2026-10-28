import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PasswordPolicyRetryCount1655320273619 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'password_retry_count',
        type: 'smallint',
        isNullable: false,
        default: 0,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
