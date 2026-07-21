import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'RemoveStaleGeneralStylesBoxShadowFromComponents1776846695994';
const BATCH_SIZE = 2000;
const COMPONENT_TYPES = [
  'Text',
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'EmailInput',
  'DropdownV2',
  'Table',
  'Checkbox',
  'Button',
  'Divider',
  'VerticalDivider',
  'Link',
  'Datepicker',
  'DatePickerV2',
  'TimePicker',
  'DatetimePickerV2',
  'DaterangePicker',
  'TextArea',
  'Container',
  'Tabs',
  'Form',
  'Image',
  'FilePicker',
  'Icon',
  'Steps',
  'Statistics',
  'StarRating',
  'Tags',
  'CircularProgressBar',
  'Html',
  'Chat',
  'CurrencyInput',
  'PhoneInput',
  'IFrame',
  'TreeSelect',
  'Listview',
  'ColorPicker',
  'ButtonGroupV2',
  'ModalV2',
  'PopoverMenu',
];

export class RemoveStaleGeneralStylesBoxShadowFromComponents1776846695994 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
           WHERE type = ANY($1)
             AND styles IS NOT NULL
             AND styles::jsonb ? 'boxShadow'
             AND general_styles IS NOT NULL
             AND general_styles::jsonb ? 'boxShadow'`,
      [COMPONENT_TYPES]
    );
    const total = parseInt(count, 10);

    console.log(`${MIGRATION_NAME}: [START] Remove stale generalStyles.boxShadow | Total: ${total}`);

    if (total === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No stale generalStyles.boxShadow found.`);
      return;
    }

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
             WHERE type = ANY($1)
               AND id > $2
               AND styles IS NOT NULL
               AND styles::jsonb ? 'boxShadow'
               AND general_styles IS NOT NULL
               AND general_styles::jsonb ? 'boxShadow'
             ORDER BY id ASC
             LIMIT $3`,
        [COMPONENT_TYPES, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((row) => row.id);

      await queryRunner.query(
        `UPDATE components
             SET general_styles = (COALESCE(general_styles, '{}')::jsonb - 'boxShadow')::json
             WHERE id = ANY($1::uuid[])`,
        [ids]
      );

      totalUpdated += rows.length;
      const percentage = ((totalUpdated / total) * 100).toFixed(1);
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Removed stale generalStyles.boxShadow.`);

    if (totalUpdated > 0) {
      const appVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
             FROM components c
             INNER JOIN pages p ON c.page_id = p.id
             WHERE c.type = ANY($1)
               AND c.styles IS NOT NULL
               AND c.styles::jsonb ? 'boxShadow'
               AND c.general_styles IS NOT NULL
               AND c.general_styles::jsonb ? 'boxShadow'`,
        [COMPONENT_TYPES]
      );

      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: appVersionRows.map((row) => row.app_version_id) },
        MIGRATION_NAME
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op — structural migrations are not reversed
  }
}
