import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillTooltipFormat1780586959120';
const BATCH_SIZE = 2000;

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

const MOVE_TYPES = ['ModalV2', 'Container'];

const TOOLTIP_FORMAT_PATCH = JSON.stringify({
  tooltipFormat: { value: 'plainText' },
});

type BackfillColumn = 'properties';

async function backfillProperties(
  queryRunner: QueryRunner,
  componentTypes: string[],
  updatedAppVersionIds: Set<string>
): Promise<number> {
  const label = 'additionalActions';
  const columnName: BackfillColumn = 'properties';

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

    const batchVersionRows: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT p.app_version_id
       FROM components c
       INNER JOIN pages p ON c.page_id = p.id
       WHERE c.id = ANY($1::uuid[])`,
      [ids]
    );
    for (const row of batchVersionRows) {
      if (row.app_version_id) updatedAppVersionIds.add(row.app_version_id);
    }

    totalUpdated += rows.length;
    const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
    console.log(`${MIGRATION_NAME}: [PROGRESS ${label}] ${totalUpdated}/${total} (${percentage}%)`);
  }

  console.log(`${MIGRATION_NAME}: [SUCCESS ${label}] Backfill finished.`);
  return totalUpdated;
}

async function moveTooltipToProperties(
  queryRunner: QueryRunner,
  componentTypes: string[],
  updatedAppVersionIds: Set<string>
): Promise<number> {
  const label = 'moveToProperties';

  const [{ count }] = await queryRunner.query(
    `SELECT COUNT(*) FROM components
     WHERE type = ANY($1)
       AND (properties IS NULL OR NOT (properties::jsonb ? 'tooltipFormat'))`,
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
         AND (properties IS NULL OR NOT (properties::jsonb ? $3))
       ORDER BY id ASC
       LIMIT $4`,
      [componentTypes, lastId, 'tooltipFormat', BATCH_SIZE]
    );

    if (rows.length === 0) break;

    lastId = rows[rows.length - 1].id;
    const ids = rows.map((r) => r.id);

    // The SET clause does three things atomically per row:
    //   1. Adds tooltipFormat = { value: 'plainText' } to properties (always).
    //   2. Adds the existing general_properties.tooltip (if any) to
    //      properties.tooltip — using `jsonb_set` only when the source exists,
    //      so we don't overwrite an existing properties.tooltip with NULL.
    //   3. Removes the `tooltip` key from general_properties so there's no
    //      stale duplicate in the data.
    await queryRunner.query(
      `UPDATE components
       SET properties = (
             CASE
               WHEN general_properties IS NOT NULL AND general_properties::jsonb ? 'tooltip'
                 THEN jsonb_set(
                        COALESCE(properties, '{}')::jsonb || $1::jsonb,
                        '{tooltip}',
                        general_properties::jsonb -> 'tooltip'
                      )
               ELSE COALESCE(properties, '{}')::jsonb || $1::jsonb
             END
           )::json,
           general_properties = CASE
             WHEN general_properties IS NOT NULL
               THEN (general_properties::jsonb - 'tooltip')::json
             ELSE general_properties
           END
       WHERE id = ANY($2::uuid[])`,
      [TOOLTIP_FORMAT_PATCH, ids]
    );

    const batchVersionRows: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT p.app_version_id
       FROM components c
       INNER JOIN pages p ON c.page_id = p.id
       WHERE c.id = ANY($1::uuid[])`,
      [ids]
    );
    for (const row of batchVersionRows) {
      if (row.app_version_id) updatedAppVersionIds.add(row.app_version_id);
    }

    totalUpdated += rows.length;
    const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
    console.log(`${MIGRATION_NAME}: [PROGRESS ${label}] ${totalUpdated}/${total} (${percentage}%)`);
  }

  console.log(`${MIGRATION_NAME}: [SUCCESS ${label}] Move finished.`);
  return totalUpdated;
}

export class BackfillTooltipFormat1780586959120 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const updatedAppVersionIds = new Set<string>();

    const propsUpdated = await backfillProperties(queryRunner, PROPERTIES_TYPES, updatedAppVersionIds);
    const movedUpdated = await moveTooltipToProperties(queryRunner, MOVE_TYPES, updatedAppVersionIds);
    const totalUpdated = propsUpdated + movedUpdated;

    if (totalUpdated > 0 && updatedAppVersionIds.size > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: Array.from(updatedAppVersionIds) },
        MIGRATION_NAME
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
