import { MigrationInterface, QueryRunner } from 'typeorm';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';
import { USER_ROLE } from '@modules/group-permissions/constants';
export class UpdateWorkflowPermissionsForAdminAndBuilder1754999194042 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        UPDATE permission_groups
        SET workflow_create = true, workflow_delete = true
        WHERE type = $1
        AND name = $2
        AND (workflow_create = false OR workflow_delete = false)
        `,
      [GROUP_PERMISSIONS_TYPE.DEFAULT, USER_ROLE.ADMIN] //Update only admin group
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
