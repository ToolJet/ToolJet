import { MigrationInterface, QueryRunner } from 'typeorm';

// Revision history for stored sources: each revision's file list by content hash, each content stored once per
// source. Existing sources get their current revision as the first entry.
export class CreateCodeModeSourceRevisions1792490000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_mode_source_revisions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id uuid NOT NULL REFERENCES code_mode_sources(id) ON DELETE CASCADE,
        revision integer NOT NULL,
        content_hash varchar(64) NOT NULL,
        files jsonb NOT NULL,
        origin varchar(16) NOT NULL CHECK (origin IN ('editor', 'import', 'restore')),
        restored_from integer NULL,
        created_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT code_mode_source_revisions_source_revision_unique UNIQUE (source_id, revision)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_mode_source_blobs (
        source_id uuid NOT NULL REFERENCES code_mode_sources(id) ON DELETE CASCADE,
        content_hash varchar(64) NOT NULL,
        content text NOT NULL,
        PRIMARY KEY (source_id, content_hash)
      )
    `);
    await queryRunner.query(`
      INSERT INTO code_mode_source_blobs (source_id, content_hash, content)
      SELECT DISTINCT ON (source_id, content_hash) source_id, content_hash, content FROM code_mode_source_files
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO code_mode_source_revisions (source_id, revision, content_hash, files, origin, created_by, created_at)
      SELECT s.id, s.revision, s.content_hash,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('path', f.path, 'contentHash', f.content_hash, 'size', f.size) ORDER BY f.path)
           FROM code_mode_source_files f WHERE f.source_id = s.id),
          '[]'::jsonb
        ),
        'import', s.updated_by, s.updated_at
      FROM code_mode_sources s
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS code_mode_source_blobs');
    await queryRunner.query('DROP TABLE IF EXISTS code_mode_source_revisions');
  }
}
