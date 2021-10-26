import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateUserGroupPermissions1632383798339
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "user_group_permissions",
        columns: [
          {
            name: "id",
            type: "uuid",
            isGenerated: true,
            default: "gen_random_uuid()",
            isPrimary: true,
          },
          {
            name: "user_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "group_permission_id",
            type: "uuid",
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
      "user_group_permissions",
      new TableForeignKey({
        columnNames: ["user_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "users",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "user_group_permissions",
      new TableForeignKey({
        columnNames: ["group_permission_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "group_permissions",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("user_group_permissions");
  }
}
