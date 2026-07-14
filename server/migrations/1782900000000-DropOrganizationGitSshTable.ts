import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * GitHub SSH git-sync is deprecated and removed. This migration deletes all stored SSH
 * configurations and drops the organization_git_ssh table along with its ssh_key_type enum
 * (used only by that table). The down() migration recreates the empty structure — stored
 * secrets are not restored.
 */
export class DropOrganizationGitSshTable1782900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Explicitly clear the SSH configs first (DROP TABLE would remove them anyway, but the
    // intent is to purge the stored secrets), then drop the table and its dedicated enum.
    await queryRunner.query('DELETE FROM organization_git_ssh');
    await queryRunner.query('DROP TABLE IF EXISTS organization_git_ssh');
    await queryRunner.query('DROP TYPE IF EXISTS ssh_key_type');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE ssh_key_type AS ENUM ('rsa', 'ed25519')`);
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
