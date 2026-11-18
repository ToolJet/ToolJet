import { MigrationInterface, QueryRunner } from 'typeorm';

// Revision history for stored sources: each revision's file list by content hash, each content stored once per
// source. Existing sources get their current revision as the first entry from the data migration
// BackfillCodeModeSourceRevisions1794808629632.
// Keys to existing tables (apps, app_versions, users, organizations) are added in the data phase by
// AddCodeModeAndReviewForeignKeys1794896718037: adding them here would stop writes to those tables while old pods serve.
// summary, kind and the 'copy' and 'git' origins are also added by AddCodeModeFreezeColumns1792500000000,
// CodeModeRevisionSummary1792520000000 and CodeModeSourceSyncHash1793260000000, for databases that ran this table's
// first version during development.
export class CreateCodeModeSourceRevisions1792490000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS code_mode_source_revisions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id uuid NOT NULL REFERENCES code_mode_sources(id) ON DELETE CASCADE,
        revision integer NOT NULL,
        content_hash varchar(64) NOT NULL,
        files jsonb NOT NULL,
        origin varchar(16) NOT NULL CHECK (origin IN ('editor', 'import', 'restore', 'copy', 'git')),
        restored_from integer NULL,
        summary varchar(200) NULL DEFAULT NULL,
        kind varchar(16) NULL DEFAULT NULL,
        created_by uuid NULL,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS code_mode_source_blobs');
    await queryRunner.query('DROP TABLE IF EXISTS code_mode_source_revisions');
  }
}
