import { MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress } from '@helpers/migration.helper';

export class AddLastLoggedInData1718706387238 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const sessions = await entityManager.query('SELECT id, expiry FROM user_sessions');

    const migrationProgress = new MigrationProgress('AddLastLoggedInData1718706387238', sessions?.length || 0);

    // Default expiry 10 days (14400 minutes)
    const expiryTime = parseInt(process.env.USER_SESSION_EXPIRY || '14400') * 60000;

    for (const session of sessions) {
      const expiryDate = new Date(session.expiry);
      const lastLoggedIn = new Date(expiryDate.getTime() - expiryTime);

      await entityManager.query('UPDATE user_sessions SET last_logged_in = $1 WHERE id = $2', [
        lastLoggedIn,
        session.id,
      ]);
      migrationProgress.show();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
