import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultSessionTypeToUser1746728238308 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE user_sessions
            SET session_type = 'user'
            WHERE session_type IS NULL;
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
