import { DATA_BASE_CONSTRAINTS } from '@modules/group-permissions/constants/error';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGroupUsersTable1714015541245 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
    CREATE TABLE IF NOT EXISTS group_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        group_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES permission_groups(id) ON DELETE CASCADE,
        CONSTRAINT ${DATA_BASE_CONSTRAINTS.GROUP_USER_UNIQUE.dbConstraint} UNIQUE (user_id, group_id)
    );
        `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS group_users`);
  }
}
