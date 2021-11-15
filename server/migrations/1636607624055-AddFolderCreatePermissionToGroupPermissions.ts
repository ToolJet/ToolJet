import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddFolderCreatePermissionToGroupPermissions1636607624055 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "group_permissions",
      new TableColumn({
        name: "folder_create",
        type: "boolean",
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("group_permissions", "folder_create");
  }

}
