import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateUserAppGroupPermissions1632385350766
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "user_app_group_permissions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isGenerated: true,
            default: "gen_random_uuid()",
            isPrimary: true,
          },
          {
            name: "app_group_permission_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "user_group_permission_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "create",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "view",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "udpate",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "delete",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            isNullable: false,
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            isNullable: false,
            default: "now()",
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      "user_app_group_permissions",
      new TableForeignKey({
        columnNames: ["app_group_permission_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "app_group_permissions",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "user_app_group_permissions",
      new TableForeignKey({
        columnNames: ["user_group_permission_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "user_group_permissions",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("user_app_group_permissions");
  }
}
