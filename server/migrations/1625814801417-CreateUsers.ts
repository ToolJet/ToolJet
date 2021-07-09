import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateUsers1625814801417 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: "users",
      columns: [
        {
          name: "id",
          type: "uuid",
          isGenerated: true,
          default: "uuid_generate_v4()",
          isPrimary: true
        },
        {
          name: "first_name",
          type: "varchar",
          isNullable: true
        },
        {
          name: "last_name",
          type: "varchar",
          isNullable: true
        },
        {
          name: "email",
          type: "varchar",
          isUnique: true,
          isNullable: true
        },
        {
          name: "password_digest",
          type: "varchar",
          isNullable: true
        },
        {
          name: "invitation_token",
          type: "varchar",
          isNullable: true
        },
        {
          name: "forgot_password_token",
          type: "varchar",
          isNullable: true
        },
        {
          name: "created_at",
          type: "timestamp",
          isNullable: true
        },
        {
          name: "updated_at",
          type: "timestamp",
          isNullable: true
        }
      ]
    }), true)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
