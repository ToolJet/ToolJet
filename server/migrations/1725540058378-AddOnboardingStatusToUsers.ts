import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOnboardingStatusToUsers1725540058378 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
          CREATE TYPE onboarding_status_enum AS ENUM (
            'not_started',
            'account_created',
            'plan_selected',
            'onboarding_completed'
          )
        `);

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'onboarding_status',
        type: 'onboarding_status_enum',
        isNullable: false,
        default: "'not_started'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'onboarding_status');
    await queryRunner.query(`DROP TYPE onboarding_status_enum`);
  }
}
