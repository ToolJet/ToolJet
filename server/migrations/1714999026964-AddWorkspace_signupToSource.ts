import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkspaceSignupToSource1714999026964 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the 'workspace_signup' enum exists
    const checkEnumQuery =
      "SELECT EXISTS (SELECT * FROM unnest(enum_range(NULL::source)) AS t(name) WHERE t.name::text = 'workspace_signup');";
    const checkEnumResult = await queryRunner.query(checkEnumQuery);
    const enumExists = checkEnumResult[0].exists;

    if (!enumExists) {
      const checkResult = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'organization_users' AND column_name = 'source'
        )`
      );
      if (checkResult[0].exists) {
        await queryRunner.query(
          "ALTER TABLE organization_users ALTER COLUMN source TYPE VARCHAR(255), ALTER COLUMN source SET NOT NULL, ALTER COLUMN source set DEFAULT 'invite'"
        );
      }
      await queryRunner.query(
        "ALTER TABLE users ALTER COLUMN source TYPE VARCHAR(255), ALTER COLUMN source SET NOT NULL, ALTER COLUMN source set DEFAULT 'invite'"
      );
      await queryRunner.query('DROP TYPE IF EXISTS source');
      await queryRunner.query(
        "CREATE TYPE source AS ENUM ('signup', 'invite', 'google', 'git', 'openid', 'ldap', 'saml', 'workspace_signup')"
      );
      if (checkResult[0].exists) {
        await queryRunner.query("ALTER TABLE organization_users ALTER COLUMN source set DEFAULT 'invite'::source");
        await queryRunner.query(
          'ALTER TABLE organization_users ALTER COLUMN source TYPE source USING (source::source), ALTER COLUMN source set not null'
        );
      }
      await queryRunner.query("ALTER TABLE users ALTER COLUMN source set DEFAULT 'invite'::source");
      await queryRunner.query(
        'ALTER TABLE users ALTER COLUMN source TYPE source USING (source::source), ALTER COLUMN source set not null'
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
