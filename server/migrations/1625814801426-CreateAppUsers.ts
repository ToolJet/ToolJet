import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateAppUsers1625814801426 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "app_users",
      columns: [
        {
          name: "id",
          type: "uuid",
          isGenerated: true,
          default: "gen_random_uuid()",
          isPrimary: true
        },
        {
          name: "app_id",
          type: "uuid",
          isNullable: false
        },
        {
          name: "user_id",
          type: "uuid",
          isNullable: false
        },
        {
          name: "role",
          type: "varchar",
          isNullable: false
        },
        {
          name: "created_at",
          type: "timestamp",
          isNullable: true,
          default: "now()"
        },
        {
          name: "updated_at",
          type: "timestamp",
          isNullable: true,
          default: "now()"
        }
      ]
    }), true)

    await queryRunner.createForeignKey("app_users", new TableForeignKey({
      columnNames: ["app_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "apps",
      onDelete: "CASCADE"
    }));

    await queryRunner.createForeignKey("app_users", new TableForeignKey({
      columnNames: ["user_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "users",
      onDelete: "CASCADE"
    }));
    
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
