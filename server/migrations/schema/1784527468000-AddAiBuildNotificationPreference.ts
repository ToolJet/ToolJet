import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAiBuildNotificationPreference1784527468000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // A column on `users` rather than on `organization_users` (where llm_provider lives):
    // browser notification permission is granted per browser profile, not per workspace,
    // so a per-workspace value would be a setting the user cannot actually act on.
    //
    // Defaults to true so notifications work the moment a user grants browser permission.
    // This is not a way to notify anyone unasked — the browser permission is a separate
    // gate the user must clear first, and this flag only decides whether we use it.
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'ai_build_notifications_enabled',
        type: 'boolean',
        isNullable: false,
        default: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'ai_build_notifications_enabled');
  }
}
