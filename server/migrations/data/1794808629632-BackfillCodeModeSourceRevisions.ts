import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillCodeModeSourceRevisions1794808629632';

/**
 * Gives every stored source written before CreateCodeModeSourceRevisions1792490000000 its file contents in
 * code_mode_source_blobs and its current revision as the first history entry (origin 'import'). Both inserts skip
 * rows already there, so a source the editor has saved since is left alone and a rerun adds nothing.
 */
export class BackfillCodeModeSourceRevisions1794808629632 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(`SELECT COUNT(*)::int AS total FROM code_mode_sources`);
    console.log(`${MIGRATION_NAME}: [START] Backfill stored source revisions: ${total}`);
    if (total === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill stored source revisions finished. Nothing to backfill.`);
      return;
    }

    const [blobs] = await queryRunner.query(`
      WITH inserted AS (
        INSERT INTO code_mode_source_blobs (source_id, content_hash, content)
        SELECT DISTINCT ON (source_id, content_hash) source_id, content_hash, content FROM code_mode_source_files
        ON CONFLICT DO NOTHING
        RETURNING 1
      )
      SELECT COUNT(*)::int AS count FROM inserted
    `);
    console.log(`${MIGRATION_NAME}: [PROGRESS] step 1/2 (50.0%) file contents stored: ${blobs.count}`);

    const [revisions] = await queryRunner.query(`
      WITH inserted AS (
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
        RETURNING 1
      )
      SELECT COUNT(*)::int AS count FROM inserted
    `);
    console.log(`${MIGRATION_NAME}: [PROGRESS] step 2/2 (100.0%) first revisions recorded: ${revisions.count}`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill stored source revisions finished.`);
  }

  public async down(): Promise<void> {
    // Not reversed: a backfilled revision or blob can't be told apart from one the editor wrote. The tables are
    // dropped by CreateCodeModeSourceRevisions1792490000000's down().
  }
}
