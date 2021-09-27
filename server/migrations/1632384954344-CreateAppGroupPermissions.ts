import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateAppGroupPermissions1632384954344
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "app_group_permissions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isGenerated: true,
            default: "gen_random_uuid()",
            isPrimary: true,
          },
          {
            name: "app_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "group_permission_id",
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
            name: "read",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "update",
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
      "app_group_permissions",
      new TableForeignKey({
        columnNames: ["app_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "apps",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "app_group_permissions",
      new TableForeignKey({
        columnNames: ["group_permission_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "group_permissions",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("app_group_permissions");
  }
}
