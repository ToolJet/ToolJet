import { EntityManager, In, MigrationInterface, QueryRunner } from "typeorm";
import { GroupPermission } from "../src/entities/group_permission.entity";

export class BackfillAppCreatePermissionsAsTruthyForAdminGroup1634729050892
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepostory =
      entityManager.getRepository(GroupPermission);

    await GroupPermissionRepostory.update(
      { group: "admin" },
      { appCreate: true, appDelete: true }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const GroupPermissionRepostory =
      entityManager.getRepository(GroupPermission);

    await GroupPermissionRepostory.update(
      { group: "admin" },
      { appCreate: false, appDelete: true }
    );
  }
}
