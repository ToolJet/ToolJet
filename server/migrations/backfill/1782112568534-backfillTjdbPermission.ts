import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { USER_ROLE } from '@modules/group-permissions/constants';

export class BackfillTjdbPermission1782112568534 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    return dbTransactionWrap(async (manager: EntityManager) => {
      // Set tjdb_crud = true for admin and builder default groups.
      // All other groups (end-user default + all custom groups) remain false — the column default.
      const result = await manager.query(`
        UPDATE permission_groups
        SET tjdb_crud = true
        WHERE name IN ('${USER_ROLE.ADMIN}', '${USER_ROLE.BUILDER}')
          AND type = 'default'
      `);

      console.log(`Backfilled tjdb_crud=true for ${result[1]} admin/builder groups.`);
    }, manager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    return dbTransactionWrap(async (manager: EntityManager) => {
      await manager.query(`
        UPDATE permission_groups
        SET tjdb_crud = false
        WHERE name IN ('${USER_ROLE.ADMIN}', '${USER_ROLE.BUILDER}')
          AND type = 'default'
      `);
    }, manager);
  }
}
