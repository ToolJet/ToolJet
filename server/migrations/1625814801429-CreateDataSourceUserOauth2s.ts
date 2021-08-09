import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateDataSourceUserOauth2s1625814801429 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "data_source_user_oauth2s",
      columns: [
        {
          name: "id",
          type: "uuid",
          isGenerated: true,
          default: "gen_random_uuid()",
          isPrimary: true
        },
        {
          name: "user_id",
          type: "uuid",
          isNullable: false
        },
        {
          name: "data_source_id",
          type: "uuid",
          isNullable: false
        },
        {
          name: "options_ciphertext",
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

    await queryRunner.createForeignKey("data_source_user_oauth2s", new TableForeignKey({
      columnNames: ["user_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "users",
      onDelete: "CASCADE"
    }));

    await queryRunner.createForeignKey("data_source_user_oauth2s", new TableForeignKey({
      columnNames: ["data_source_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "data_sources",
      onDelete: "CASCADE"
    }));
    
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
