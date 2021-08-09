import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateCredentials1625814801421 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "credentials",
      columns: [
        {
          name: "id",
          type: "uuid",
          isGenerated: true,
          default: "gen_random_uuid()",
          isPrimary: true
        },
        {
          name: "value_ciphertext",
          type: "varchar",
          isNullable: true
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
