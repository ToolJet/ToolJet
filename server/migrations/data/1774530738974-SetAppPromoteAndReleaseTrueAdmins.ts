import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetAppPromoteAndReleaseTrueAdmins1774530738974 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE permission_groups
      SET app_promote = true, app_release = true
      WHERE name = 'admin'
        AND type = 'default'
        AND (app_promote = false OR app_release = false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: cannot reliably determine previous state
  }
}
