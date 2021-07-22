import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateAppVersions1625814801420 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "app_versions",
      columns: [
        {
          name: "id",
          type: "uuid",
          isGenerated: true,
          default: "gen_random_uuid()",
          isPrimary: true
        },
        {
          name: "name",
          type: "varchar",
          isNullable: true
        },
        {
          name: "definition",
          type: "json",
          isNullable: false
        },
        {
          name: "app_id",
          type: "uuid",
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

    await queryRunner.createForeignKey("app_versions", new TableForeignKey({
      columnNames: ["app_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "apps",
      onDelete: "CASCADE"
    }));

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
