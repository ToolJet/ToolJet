import { MigrationInterface, QueryRunner } from 'typeorm';

// One-time backfill for the legacy percent-based layout positioning system.
// ComponentsService.getAllComponents (and getAllComponentsForVersion) convert these
// rows lazily on every read and write the result back — at ~981K affected rows on
// Cloud, that's a real per-request cost on the version-load endpoint, not dead data.
// This migration converts everything up front so that runtime conversion path can be
// deleted once verified. `left` transform matches
// ComponentsService.resolveGridPositionForComponent exactly: Math.round((left * 43) / 100).
// NOTE: intentionally NOT using helpers/migration.helper.ts's processDataInBatches here —
// that helper pages with an incrementing OFFSET, which is unsafe when the UPDATE removes
// rows from the same WHERE clause being paged over (each batch shrinks the matching set,
// so OFFSET-based paging would skip over never-processed rows). Instead we always
// re-query for the next remaining batch (no OFFSET), since converted rows drop out of
// the WHERE clause on their own.
//
// NOTE: ormconfig.ts sets migrationsTransactionMode: 'all', so this still runs inside the
// single shared transaction covering every pending migration in the deploy — batching here
// does not release row locks incrementally, all ~981K rows' locks are held until that
// transaction commits at the end of the run. Deliberately left this way (not worth the
// added complexity of a separate connection/transaction per batch) — run this during a
// maintenance window / low-traffic deploy, not against a table under live write load.
const BATCH_SIZE = 2000;
const GRID_COLUMNS = 43;

export class BackfillPercentLayoutsToCount1782600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let totalUpdated = 0;

    for (;;) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM layouts WHERE dimension_unit = 'percent' ORDER BY id ASC LIMIT $1`,
        [BATCH_SIZE]
      );

      if (rows.length === 0) {
        break;
      }

      const ids = rows.map((row) => row.id);

      await queryRunner.query(
        `UPDATE layouts
         SET "left" = ROUND(("left" * ${GRID_COLUMNS})::numeric / 100)::double precision,
             dimension_unit = 'count'
         WHERE id = ANY($1)`,
        [ids]
      );

      totalUpdated += rows.length;
      console.log(`[BackfillPercentLayoutsToCount] Converted ${totalUpdated} layouts so far...`);

      if (rows.length < BATCH_SIZE) {
        break;
      }
    }

    console.log(`[BackfillPercentLayoutsToCount] Done. Total converted: ${totalUpdated}`);
  }

  public async down(): Promise<void> {
    // Irreversible by design: original percent values aren't recoverable once converted.
    // This mirrors the existing runtime migrate-on-read behavior, which also never
    // converts count back to percent.
  }
}
