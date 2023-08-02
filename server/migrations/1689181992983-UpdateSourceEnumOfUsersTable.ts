import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSourceEnumOfUsersTable1689181992983 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TYPE source ADD VALUE 'ldap'");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
