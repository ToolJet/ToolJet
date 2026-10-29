import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillFontAndHoverStylesForButtonWidgets1774589474535';
const BATCH_SIZE = 2000;
const COMPONENT_TYPES = ['Button', 'ButtonGroupV2', 'ModalV2', 'PopoverMenu'];

// Patch applied to Button and PopoverMenu (5 props)
const BUTTON_POPOVER_PATCH = JSON.stringify({
  textSize: { value: '{{14}}' },
  fontWeight: { value: 'normal' },
  contentAlignment: { value: 'center' },
  hoverBackgroundMode: { value: 'auto' },
  hoverBackgroundColor: { value: 'var(--cc-primary-brand)' },
});

// Patch applied to ButtonGroupV2 (4 props — no contentAlignment)
const BUTTON_GROUP_PATCH = JSON.stringify({
  textSize: { value: '{{14}}' },
  fontWeight: { value: 'normal' },
  hoverBackgroundMode: { value: 'auto' },
  hoverBackgroundColor: { value: 'var(--cc-primary-brand)' },
});

// Patch applied to ModalV2 (5 props with triggerButton prefix)
const MODAL_V2_PATCH = JSON.stringify({
  triggerButtonTextSize: { value: '{{14}}' },
  triggerButtonFontWeight: { value: 'normal' },
  triggerButtonContentAlignment: { value: 'center' },
  triggerButtonHoverBackgroundMode: { value: 'auto' },
  triggerButtonHoverBackgroundColor: { value: 'var(--cc-primary-brand)' },
});

export class BackfillFontAndHoverStylesForButtonWidgets1774589474535 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = ANY($1)
         AND (
           (type IN ('Button', 'ButtonGroupV2', 'PopoverMenu') AND (styles IS NULL OR NOT (styles::jsonb ? 'textSize')))
           OR (type = 'ModalV2' AND (styles IS NULL OR NOT (styles::jsonb ? 'triggerButtonTextSize')))
         )`,
      [COMPONENT_TYPES]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfill font and hover styles | Total: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = ANY($1)
           AND id > $2
           AND (
             (type IN ('Button', 'ButtonGroupV2', 'PopoverMenu') AND (styles IS NULL OR NOT (styles::jsonb ? 'textSize')))
             OR (type = 'ModalV2' AND (styles IS NULL OR NOT (styles::jsonb ? 'triggerButtonTextSize')))
           )
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPES, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((r) => r.id);

      await queryRunner.query(
        `UPDATE components
         SET styles = (COALESCE(styles, '{}')::jsonb ||
           CASE
             WHEN type = 'ButtonGroupV2' THEN $1::jsonb
             WHEN type = 'ModalV2'       THEN $2::jsonb
             ELSE                             $3::jsonb
           END
         )::json
         WHERE id = ANY($4::uuid[])`,
        [BUTTON_GROUP_PATCH, MODAL_V2_PATCH, BUTTON_POPOVER_PATCH, ids]
      );

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill font and hover styles finished.`);

    if (totalUpdated > 0) {
      const appVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
         FROM components c
         INNER JOIN pages p ON c.page_id = p.id
         WHERE c.type = ANY($1)`,
        [COMPONENT_TYPES]
      );

      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: appVersionRows.map((r) => r.app_version_id) },
        MIGRATION_NAME
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op — structural migrations are not reversed
  }
}
