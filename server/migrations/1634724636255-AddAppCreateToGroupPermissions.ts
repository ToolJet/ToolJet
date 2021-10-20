import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAppCreateToGroupPermissions1634724636255
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "group_permissions",
      new TableColumn({
        name: "app_create",
        type: "boolean",
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("group_permissions", "app_create");
  }
}
