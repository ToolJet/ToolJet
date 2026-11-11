import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addLastLoggedInToUserSession1718704694211 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_sessions',
      new TableColumn({
        name: 'last_logged_in',
        type: 'timestamp',
        isNullable: false,
        default: 'now()',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_sessions', 'last_logged_in');
  }
}
