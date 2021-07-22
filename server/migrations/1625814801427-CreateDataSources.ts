import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateDataSources1625814801427 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "data_sources",
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
          name: "name",
          type: "varchar",
          isNullable: false
        },
        {
          name: "options",
          type: "json",
          isNullable: true
        },
        {
          name: "kind",
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

    await queryRunner.createForeignKey("data_sources", new TableForeignKey({
      columnNames: ["app_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "apps",
      onDelete: "CASCADE"
    }));

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
