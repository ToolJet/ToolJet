import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateDataQueries1625814801428 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "data_queries",
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
          name: "data_source_id",
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

    await queryRunner.createForeignKey("data_queries", new TableForeignKey({
      columnNames: ["app_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "apps",
      onDelete: "CASCADE"
    }));

    await queryRunner.createForeignKey("data_queries", new TableForeignKey({
      columnNames: ["data_source_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "data_sources",
      onDelete: "CASCADE"
    }));
    
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
