import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

// /Users/ahimns / Desktop / work / arm / ToolJet / server / data - migrations / 1780550424338 - BackfillTooltipFormat.ts;

const MIGRATION_NAME = 'BackfillTooltipFormat1780550424338';
const BATCH_SIZE = 2000;

// Widgets whose tooltip lives in `properties.tooltip` (rendered in the
// Additional Actions section of the inspector). DB column: `properties`.
const PROPERTIES_TYPES = [
  'Accordion',
  'AudioRecorder',
  'Button',
  'ButtonGroupV2',
  'Camera',
  'Checkbox',
  'CircularProgressBar',
  'ColorPicker',
  'CurrencyInput',
  'DatePickerV2',
  'DaterangePicker',
  'DatetimePickerV2',
  'Divider',
  'DropdownV2',
  'EmailInput',
  'FileButton',
  'FileInput',
  'FilePicker',
  'Form',
  'Icon',
  'IFrame',
  'Image',
  'JSONEditor',
  'JSONExplorer',
  'Kanban',
  'KeyValuePair',
  'Link',
  'Listview',
  'MultiselectV2',
  'NumberInput',
  'PasswordInput',
  'PhoneInput',
  'PopoverMenu',
  'ProgressBar',
  'RadioButtonV2',
  'RangeSliderV2',
  'ReorderableList',
  'StarRating',
  'Statistics',
  'Tabs',
  'Tags',
  'TagsInput',
  'Text',
  'TextArea',
  'TextInput',
  'TimePicker',
  'ToggleSwitchV2',
  'TreeSelect',
  'VerticalDivider',
];

// Widgets whose tooltip lives in `general.tooltip` (rendered in the
// General section of the inspector). DB column: `general_properties`.
const GENERAL_TYPES = [
  'Modal',
  'ModalV2',
  'Container',
  'Calendar',
  'RichTextEditor',
  'Pagination',
  'SvgImage',
  'PDF',
  'Map',
  'Timeline',
  'Timer',
  'Spinner',
  'Html',
  'CodeEditor',
  'BoundedBox',
  'QrScanner',
];

const TOOLTIP_FORMAT_PATCH = JSON.stringify({
  tooltipFormat: { value: 'plainText' },
});

// columnName is restricted to a literal-string union so the dynamic identifier
// interpolation is safe — values can only come from the two hardcoded callers.
type BackfillColumn = 'properties' | 'general_properties';

async function backfillColumn(
  queryRunner: QueryRunner,
  componentTypes: string[],
  columnName: BackfillColumn,
  label: string
): Promise<number> {
  const [{ count }] = await queryRunner.query(
    `SELECT COUNT(*) FROM components
     WHERE type = ANY($1)
       AND (${columnName} IS NULL OR NOT (${columnName}::jsonb ? 'tooltipFormat'))`,
    [componentTypes]
  );
  const total = parseInt(count, 10);
  console.log(`${MIGRATION_NAME}: [START ${label}] Total: ${total}`);

  let lastId = '00000000-0000-0000-0000-000000000000';
  let totalUpdated = 0;

  while (true) {
    const rows: { id: string }[] = await queryRunner.query(
      `SELECT id FROM components
       WHERE type = ANY($1)
         AND id > $2
         AND (${columnName} IS NULL OR NOT (${columnName}::jsonb ? $3))
       ORDER BY id ASC
       LIMIT $4`,
      [componentTypes, lastId, 'tooltipFormat', BATCH_SIZE]
    );

    if (rows.length === 0) break;

    lastId = rows[rows.length - 1].id;
    const ids = rows.map((r) => r.id);

    await queryRunner.query(
      `UPDATE components
       SET ${columnName} = (COALESCE(${columnName}, '{}')::jsonb || $1::jsonb)::json
       WHERE id = ANY($2::uuid[])`,
      [TOOLTIP_FORMAT_PATCH, ids]
    );

    totalUpdated += rows.length;
    const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
    console.log(`${MIGRATION_NAME}: [PROGRESS ${label}] ${totalUpdated}/${total} (${percentage}%)`);
  }

  console.log(`${MIGRATION_NAME}: [SUCCESS ${label}] Backfill finished.`);
  return totalUpdated;
}

export class BackfillTooltipFormat1780550424338 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const propsUpdated = await backfillColumn(queryRunner, PROPERTIES_TYPES, 'properties', 'additionalActions');
    const generalUpdated = await backfillColumn(queryRunner, GENERAL_TYPES, 'general_properties', 'general');
    const totalUpdated = propsUpdated + generalUpdated;

    if (totalUpdated > 0) {
      const appVersionRows: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT p.app_version_id
         FROM components c
         INNER JOIN pages p ON c.page_id = p.id
         WHERE c.type = ANY($1)`,
        [[...PROPERTIES_TYPES, ...GENERAL_TYPES]]
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
