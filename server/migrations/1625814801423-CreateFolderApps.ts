import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateFolderApps1625814801423 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "folder_apps",
      columns: [
        {
          name: "id",
          type: "uuid",
          isGenerated: true,
          default: "gen_random_uuid()",
          isPrimary: true
        },
        {
          name: "folder_id",
          type: "uuid",
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

    await queryRunner.createForeignKey("folder_apps", new TableForeignKey({
      columnNames: ["app_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "apps",
      onDelete: "CASCADE"
    }));

    await queryRunner.createForeignKey("folder_apps", new TableForeignKey({
      columnNames: ["folder_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "folders",
      onDelete: "CASCADE"
    }));

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
