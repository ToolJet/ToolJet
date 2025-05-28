import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertDataGithubSSH1742215016773 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO organization_git_ssh (git_url, ssh_private_key, ssh_public_key, key_type, config_id, is_finalized)
      SELECT git_url, ssh_private_key, ssh_public_key, key_type, id , is_finalized FROM organization_git_sync;
    `);
    await queryRunner.query(`
      ALTER TABLE organization_git_sync
      DROP COLUMN IF EXISTS git_url,
      DROP COLUMN IF EXISTS ssh_private_key,
      DROP COLUMN IF EXISTS ssh_public_key,
      DROP COLUMN IF EXISTS key_type,
      DROP COLUMN IF EXISTS is_finalized;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add the columns back to the old table
    await queryRunner.query(`
      DO $$ 
      BEGIN 
          IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'ssh_key_type'
          ) THEN
              CREATE TYPE ssh_key_type AS ENUM (
                  'rsa',
                  'ed25519'
              );
          END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE organization_git_sync
      ADD COLUMN git_url VARCHAR(255),
      ADD COLUMN ssh_private_key TEXT,
      ADD COLUMN ssh_public_key TEXT,
      ADD COLUMN key_type ssh_key_type DEFAULT 'ed25519',
      ADD COLUMN is_finalized BOOLEAN DEFAULT false;
    `);

    // Copy the data back from the new table to the old table
    await queryRunner.query(`
      UPDATE organization_git_sync
      SET git_url = s.git_url,
          ssh_private_key = s.ssh_private_key,
          ssh_public_key = s.ssh_public_key,
          key_type = s.key_type,
          is_finalized = s.is_finalized,
      FROM organization_git_ssh s
      WHERE organization_git_sync.id = s.config_id;
    `);
  }
}
