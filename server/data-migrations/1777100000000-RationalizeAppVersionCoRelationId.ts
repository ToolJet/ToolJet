import { MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress } from '@helpers/migration.helper';

/**
 * Gives every app_versions row its own unique co_relation_id within an app.
 *
 * Existing data is in three different states:
 *   - some rows have no co_relation_id
 *   - some rows share their parent app's co_relation_id (an older backfill
 *     copied a single value across all versions of an app)
 *   - some rows already have their own unique value
 *
 * After this migration: every row has a unique value within its app.
 */

const MIGRATION_NAME = 'RationalizeAppVersionCoRelationId1777100000000';
const BATCH_SIZE = 2000;
const UUID_ZERO = '00000000-0000-0000-0000-000000000000';

export class RationalizeAppVersionCoRelationId1777100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.fillBlankAndSharedIds(queryRunner);
    await this.replaceDuplicateIds(queryRunner);
  }

  /**
   * For rows with no co_relation_id, or rows that share their parent app's
   * value, set a unique one. Reuses module_reference_id when present so module
   * pins keep working; otherwise generates a fresh UUID.
   */
  private async fillBlankAndSharedIds(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`
      SELECT COUNT(*) FROM app_versions av
      LEFT JOIN apps a ON av.app_id = a.id
      WHERE av.co_relation_id IS NULL
         OR av.co_relation_id = a.co_relation_id
    `);
    const total = parseInt(count, 10);
    if (total === 0) return;

    const totalBatches = Math.ceil(total / BATCH_SIZE);
    const progress = new MigrationProgress(`${MIGRATION_NAME} (fill)`, totalBatches);

    let lastId = UUID_ZERO;
    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT av.id FROM app_versions av
         LEFT JOIN apps a ON av.app_id = a.id
         WHERE av.id > $1
           AND (av.co_relation_id IS NULL OR av.co_relation_id = a.co_relation_id)
         ORDER BY av.id ASC
         LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE app_versions
         SET co_relation_id = COALESCE(module_reference_id, gen_random_uuid())
         WHERE id = ANY($1::uuid[])`,
        [ids]
      );
      progress.show();
    }
  }

  /**
   * Where two or more rows under the same app still share a co_relation_id,
   * keep the oldest one's value and give the rest fresh UUIDs. Catches leftovers
   * from old import paths or from the previous step reusing a module_reference_id
   * that happened to match an existing sibling.
   */
  private async replaceDuplicateIds(queryRunner: QueryRunner): Promise<void> {
    const dupIds: { id: string }[] = await queryRunner.query(`
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY app_id, co_relation_id
          ORDER BY created_at ASC, id ASC
        ) AS rn
        FROM app_versions
      ) ranked
      WHERE ranked.rn > 1
      ORDER BY id ASC
    `);

    if (dupIds.length === 0) return;

    const totalBatches = Math.ceil(dupIds.length / BATCH_SIZE);
    const progress = new MigrationProgress(`${MIGRATION_NAME} (dedupe)`, totalBatches);

    for (let i = 0; i < dupIds.length; i += BATCH_SIZE) {
      const batch = dupIds.slice(i, i + BATCH_SIZE).map((r) => r.id);
      await queryRunner.query(
        `UPDATE app_versions
         SET co_relation_id = gen_random_uuid()
         WHERE id = ANY($1::uuid[])`,
        [batch]
      );
      progress.show();
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Original (broken) values cannot be reconstructed.
  }
}
