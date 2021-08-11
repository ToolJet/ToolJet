import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateOrganizationUsers1625814801425 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "organization_users",
      columns: [
        {
          name: "id",
          type: "uuid",
          isGenerated: true,
          default: "gen_random_uuid()",
          isPrimary: true
        },
        {
          name: "organization_id",
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
          name: "status",
          type: "varchar",
          default: "'invited'",
          isNullable: false,
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

    await queryRunner.createForeignKey("organization_users", new TableForeignKey({
      columnNames: ["organization_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "organizations",
      onDelete: "CASCADE"
    }));

    await queryRunner.createForeignKey("organization_users", new TableForeignKey({
      columnNames: ["user_id"],
      referencedColumnNames: ["id"],
      referencedTableName: "users",
      onDelete: "CASCADE"
    }));
    
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
