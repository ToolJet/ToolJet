import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillExpandFieldIfLabelEmpty1784505600000';
const BATCH_SIZE = 2000;
const COMPONENT_TYPES = [
  'TextInput',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'NumberInput',
  'Cascader',
  'TextArea',
];
const EXPAND_FIELD_IF_LABEL_EMPTY_PATCH = JSON.stringify({
  expandFieldIfLabelEmpty: { value: '{{true}}' },
});

export class BackfillExpandFieldIfLabelEmpty1784505600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(
      `SELECT COUNT(*) FROM components
       WHERE type = ANY($1)
         AND (properties IS NULL OR NOT (properties::jsonb ? 'expandFieldIfLabelEmpty'))`,
      [COMPONENT_TYPES]
    );
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfill expandFieldIfLabelEmpty | Total: ${total}`);

    let lastId = '00000000-0000-0000-0000-000000000000';
    let totalUpdated = 0;

    while (true) {
      const rows: { id: string }[] = await queryRunner.query(
        `SELECT id FROM components
         WHERE type = ANY($1)
           AND id > $2
           AND (properties IS NULL OR NOT (properties::jsonb ? 'expandFieldIfLabelEmpty'))
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPES, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;

      lastId = rows[rows.length - 1].id;
      const ids = rows.map((row) => row.id);

      await queryRunner.query(
        `UPDATE components
         SET properties = (COALESCE(properties, '{}')::jsonb || $1::jsonb)::json
         WHERE id = ANY($2::uuid[])`,
        [EXPAND_FIELD_IF_LABEL_EMPTY_PATCH, ids]
      );

      totalUpdated += rows.length;
      const percentage = total > 0 ? ((totalUpdated / total) * 100).toFixed(1) : '0.0';
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${totalUpdated}/${total} (${percentage}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill expandFieldIfLabelEmpty finished.`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op - data migrations are not reversed.
  }
}
