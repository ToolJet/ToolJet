import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateFolders1625814801422 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "folders",
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
          name: "organization_id",
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

    await queryRunner.createForeignKey("folders", new TableForeignKey({
      columnNames: ["organization_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "organizations",
      onDelete: "CASCADE"
    }));

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
