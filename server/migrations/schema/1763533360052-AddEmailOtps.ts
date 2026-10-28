import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserMfa1763533360052 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "user_mfa",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            default: "gen_random_uuid()",
          },
          {
            name: "identifier",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "type",
            type: "varchar",
            default: "'email_otp'",
          },
          {
            name: "resend_count",
            type: "integer",
            default: 0,
          },
          {
            name: "last_sent_at",
            type: "timestamptz",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamptz",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamptz",
            default: "now()",
          },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("user_mfa");
  }
}
