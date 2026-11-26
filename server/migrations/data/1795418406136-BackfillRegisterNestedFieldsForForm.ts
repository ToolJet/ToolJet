import { MigrationInterface, QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';

const MIGRATION_NAME = 'BackfillRegisterNestedFieldsForForm1795418406136';
const BATCH_SIZE = 2000;
const NO_ID = '00000000-0000-0000-0000-000000000000';

// `registerNestedFields` ships enabled, so a newly dropped Form collects fields nested inside
// containers. Every Form that already exists was built against the old behaviour, where only
// direct children counted, so it is pinned to `false` here — turning it on retroactively would
// change what those forms submit and could let a nested required field block a submit that used
// to go through.
const REGISTER_NESTED_FIELDS_OFF = { value: '{{false}}' };

type FormRow = { id: string; properties: string | null };

/**
 * Reads a Form's properties from their stored text. `::jsonb` fails on an escaped NUL or half an emoji anywhere in
 * the column, even under an unrelated key, so the text is parsed here; JSON.parse keeps both and JSON.stringify writes
 * them back escaped, so the rest of the stored content is unchanged.
 */
function parseProperties({ id, properties }: FormRow): Record<string, unknown> {
  if (properties === null) return {};
  try {
    return JSON.parse(properties) ?? {};
  } catch {
    throw new Error(`${MIGRATION_NAME}: Could not parse properties of component ${id}`);
  }
}

export class BackfillRegisterNestedFieldsForForm1795418406136 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = 'Form'`);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] Backfill registerNestedFields: ${total}`);

    // Only the app versions whose Forms this run changed lose their history; an app whose Forms
    // already carried the key keeps its undo history.
    const touchedVersions = new Set<string>();
    let lastId = NO_ID;
    let scanned = 0;
    let updated = 0;

    while (true) {
      const rows: FormRow[] = await queryRunner.query(
        `SELECT id, properties::text AS properties FROM components
          WHERE type = 'Form' AND id > $1
          ORDER BY id
          LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      if (rows.length === 0) break;
      lastId = rows[rows.length - 1].id;
      scanned += rows.length;

      const ids: string[] = [];
      const texts: string[] = [];
      for (const row of rows) {
        const properties = parseProperties(row);
        if (properties.registerNestedFields !== undefined) continue;
        properties.registerNestedFields = REGISTER_NESTED_FIELDS_OFF;
        ids.push(row.id);
        texts.push(JSON.stringify(properties));
      }

      if (ids.length > 0) {
        await queryRunner.query(
          `UPDATE components c
              SET properties = v.properties::json
             FROM unnest($1::uuid[], $2::text[]) AS v(id, properties)
            WHERE c.id = v.id`,
          [ids, texts]
        );
        const versions: { app_version_id: string }[] = await queryRunner.query(
          `SELECT DISTINCT p.app_version_id FROM components c JOIN pages p ON p.id = c.page_id
            WHERE c.id = ANY($1::uuid[])`,
          [ids]
        );
        versions.forEach(({ app_version_id }) => app_version_id && touchedVersions.add(app_version_id));
        updated += ids.length;
      }

      console.log(`${MIGRATION_NAME}: [PROGRESS] ${scanned}/${total} (${((scanned / total) * 100).toFixed(1)}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Backfill registerNestedFields finished. Updated: ${updated}`);

    if (touchedVersions.size > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: [...touchedVersions] },
        MIGRATION_NAME
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op — structural migrations are not reversed
  }
}
