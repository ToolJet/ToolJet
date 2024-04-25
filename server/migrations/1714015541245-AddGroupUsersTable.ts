import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupUsersTable1714015541245 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
    CREATE TABLE IF NOT EXISTS group_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        group_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES group_permissions(id) ON DELETE CASCADE
    );
        `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_users`);
  }
}
