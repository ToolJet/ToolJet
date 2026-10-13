import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillPatPermissionsOnDefaultGroups1791891636602';
const BATCH_SIZE = 2000;

// Keeps today's behaviour: admins and builders could already mint PATs; only admins get Revoke.
// End-user and custom groups keep the column default (false).
const NEEDS_BACKFILL = `
  type = 'default'
  AND (
    (name = 'admin' AND NOT (pat_create AND pat_revoke))
    OR (name = 'builder' AND NOT pat_create)
  )`;

export class BackfillPatPermissionsOnDefaultGroups1791891636602 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM permission_groups WHERE ${NEEDS_BACKFILL}`);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Default groups to backfill: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM permission_groups
         WHERE ${NEEDS_BACKFILL} AND id > $1
         ORDER BY id ASC
         LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      await queryRunner.query(
        `UPDATE permission_groups
         SET pat_create = true,
             pat_revoke = (name = 'admin')
         WHERE id = ANY($1::uuid[])`,
        [rows.map((r) => r.id)]
      );

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill finished. Updated: ${totalUpdated}`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
