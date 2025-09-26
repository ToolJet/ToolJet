import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGitTypeEnumColumn1742215921099 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type
    await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'git_type'
                ) THEN
                    CREATE TYPE git_type AS ENUM (
                        'github_ssh',
                        'github_https',
                        'disabled'
                    );
                END IF;
            END $$;
        `);

    // Add column with ENUM type
    await queryRunner.query(`
            ALTER TABLE organization_git_sync 
            ADD COLUMN IF NOT EXISTS git_type git_type NOT NULL DEFAULT 'github_ssh';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert migration: drop column and ENUM type
    await queryRunner.query(`
            ALTER TABLE organization_git_sync 
            DROP COLUMN IF EXISTS git_type;
        `);

    await queryRunner.query(`
            DROP TYPE IF EXISTS git_type_enum;
        `);
  }
}
