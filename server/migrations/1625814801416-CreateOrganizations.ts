import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateOrganizations1625814801416 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "organizations",
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
          name: "domain",
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
