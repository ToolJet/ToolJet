import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceSignupToSource1714999026964 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE users ALTER COLUMN source TYPE VARCHAR(255), ALTER COLUMN source SET NOT NULL, ALTER COLUMN source set DEFAULT 'invite'"
    );
    await queryRunner.query('DROP TYPE IF EXISTS source');
    await queryRunner.query(
      "CREATE TYPE source AS ENUM ('signup', 'invite', 'google', 'git', 'openid', 'ldap', 'saml', 'workspace_signup')"
    );
    await queryRunner.query("ALTER TABLE users ALTER COLUMN source set DEFAULT 'invite'::source");
    await queryRunner.query(
      'ALTER TABLE users ALTER COLUMN source TYPE source USING (source::source), ALTER COLUMN source set not null'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
