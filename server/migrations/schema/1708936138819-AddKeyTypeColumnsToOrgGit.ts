import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKeyTypeColumnToOrgGitTable1708320592518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type
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

    // Add column with ENUM type
    await queryRunner.query(`
            ALTER TABLE organization_git_sync 
            ADD COLUMN IF NOT EXISTS key_type ssh_key_type NOT NULL DEFAULT 'ed25519';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert migration: drop column and ENUM type
    await queryRunner.query(`
            ALTER TABLE organization_git_sync 
            DROP COLUMN IF EXISTS key_type;
        `);

    await queryRunner.query(`
            DROP TYPE IF EXISTS key_type_enum;
        `);
  }
}
