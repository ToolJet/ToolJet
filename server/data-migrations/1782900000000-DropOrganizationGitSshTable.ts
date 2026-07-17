import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * GitHub SSH git-sync is deprecated and removed. This migration deletes all stored SSH
 * configurations and drops the organization_git_ssh table.
 *
 * The ssh_key_type enum is intentionally NOT dropped: a legacy key_type column on
 * organization_git_sync still references it, so dropping the type would fail with a dependency
 * error. Leaving the (now unused-by-SSH) enum in place is harmless; the down() migration reuses it.
 */
export class DropOrganizationGitSshTable1782900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Dropping the table purges all stored SSH configs (secrets included). IF EXISTS keeps this
    // idempotent across environments where the table may already be absent.
    await queryRunner.query('DROP TABLE IF EXISTS organization_git_ssh');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ssh_key_type usually still exists (see note above); create it only if it's missing.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssh_key_type') THEN
          CREATE TYPE ssh_key_type AS ENUM ('rsa', 'ed25519');
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      CREATE TABLE organization_git_ssh (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        config_id uuid NOT NULL,
        git_url character varying NOT NULL,
        ssh_private_key character varying NOT NULL,
        ssh_public_key character varying NOT NULL,
        key_type ssh_key_type NOT NULL DEFAULT 'ed25519',
        is_finalized boolean NOT NULL DEFAULT false,
        is_enabled boolean DEFAULT false,
        git_branch character varying NOT NULL DEFAULT 'main',
        created_at timestamp without time zone NOT NULL DEFAULT now(),
        updated_at timestamp without time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_32d45842ea7315507dcf1c91094" PRIMARY KEY (id),
        CONSTRAINT "UQ_81ad1877df5dcb5360157bed2ca" UNIQUE (config_id),
        CONSTRAINT "UQ_620f5b6c5d7ef7741cfaa0c5e47" UNIQUE (ssh_private_key),
        CONSTRAINT "UQ_cf0451c47ef5bee726b6708c97c" UNIQUE (ssh_public_key),
        CONSTRAINT "FK_81ad1877df5dcb5360157bed2ca" FOREIGN KEY (config_id)
          REFERENCES organization_git_sync(id) ON DELETE CASCADE
      )
    `);
  }
}
