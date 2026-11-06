import { MigrationInterface, QueryRunner } from 'typeorm';

// Per app version source files, with a revision for optimistic concurrency and an owner ('platform' or 'repository').
export class CreateCodeModeSources1792480000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_mode_sources (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        app_version_id uuid NOT NULL UNIQUE REFERENCES app_versions(id) ON DELETE CASCADE,
        revision integer NOT NULL DEFAULT 1,
        content_hash varchar(64) NOT NULL,
        owner varchar(16) NOT NULL DEFAULT 'platform' CHECK (owner IN ('platform', 'repository')),
        library_correlation_id uuid NULL,
        total_size integer NOT NULL DEFAULT 0,
        updated_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_mode_source_files (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id uuid NOT NULL REFERENCES code_mode_sources(id) ON DELETE CASCADE,
        path varchar(512) NOT NULL,
        content text NOT NULL,
        size integer NOT NULL,
        content_hash varchar(64) NOT NULL,
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT code_mode_source_files_source_path_unique UNIQUE (source_id, path)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS code_mode_source_files');
    await queryRunner.query('DROP TABLE IF EXISTS code_mode_sources');
  }
}
