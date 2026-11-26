import { QueryRunner } from 'typeorm';
import { deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'BackfillStripPercentRangeSliderV21792950330429';
const BATCH_SIZE = 2000;
const NO_ID = '00000000-0000-0000-0000-000000000000';
const STRIP_PERCENT = { value: '{{true}}' };

type SliderRow = { id: string; properties: string | null };
type Properties = Record<string, unknown>;

/**
 * Reads a slider's properties from their stored text. `::jsonb` fails on an escaped NUL or half an emoji anywhere in
 * the column, even under an unrelated key, so the text is parsed here; JSON.parse keeps both and JSON.stringify writes
 * them back escaped, so the rest of the stored content is unchanged.
 */
function parseProperties({ id, properties }: SliderRow): Properties {
  if (properties === null) return {};
  try {
    return JSON.parse(properties) ?? {};
  } catch {
    throw new Error(`${MIGRATION_NAME}: Could not parse properties of component ${id}`);
  }
}

/**
 * RangeSliderV2 stripped the first `%` from every mark label at render, so a slider
 * configured with the shipped default marks `25%`/`50%`/`75%` displayed `25`/`50`/`75`.
 * That strip is now conditional, and this marks the components that already existed so
 * they keep rendering exactly as their builders see them today.
 *
 * `stripPercent` is deliberately NOT a registered property: it is absent from the widget
 * config, so it never appears in the inspector and a newly dropped slider never carries
 * it. Absence is what tells a new slider from an old one. Old exports get the same flag on
 * import (`migrateProperties()` in app-import-export.service.ts).
 */
export class BackfillStripPercentRangeSliderV21792950330429 implements DataMigration {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const touchedVersions = await this.rewriteSliders(queryRunner, 'Mark existing sliders', (properties) => {
      if (properties.stripPercent !== undefined) return false;
      properties.stripPercent = STRIP_PERCENT;
      return true;
    });

    // A snapshot taken before this ran carries no `stripPercent`, so restoring an app to one
    // would put the pre-fix mark labels straight back onto components this just corrected.
    if (touchedVersions.length > 0) {
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: touchedVersions },
        MIGRATION_NAME
      );
    }
  }

  /**
   * Removes the key again, restoring the pre-migration state: `stripPercent` exists in no
   * release before this one, so a RangeSliderV2 carrying it got it either from `up()` or
   * from the matching backfill in `app-import-export.service.ts`. Both exist only to serve
   * this flag, so clearing every occurrence is the faithful inverse.
   *
   * Reverting leaves those sliders rendering the `%` in their mark labels — which is the
   * point: without the production change this undoes, nothing reads the key at all.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.rewriteSliders(queryRunner, 'Unmark sliders', (properties) => {
      if (properties.stripPercent === undefined) return false;
      delete properties.stripPercent;
      return true;
    });
  }

  /**
   * Walks every RangeSliderV2 in batches by id, applies `change` to its parsed properties and writes back, in one
   * UPDATE per batch, only the sliders `change` reports as changed. Returns the app versions it changed.
   */
  private async rewriteSliders(
    queryRunner: QueryRunner,
    action: string,
    change: (properties: Properties) => boolean
  ): Promise<string[]> {
    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = 'RangeSliderV2'`);
    const total = parseInt(count, 10);
    console.log(`${MIGRATION_NAME}: [START] ${action}: ${total}`);

    const touchedVersions = new Set<string>();
    let lastId = NO_ID;
    let scanned = 0;
    let updated = 0;

    while (true) {
      const rows: SliderRow[] = await queryRunner.query(
        `SELECT id, properties::text AS properties FROM components
          WHERE type = 'RangeSliderV2' AND id > $1
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
        if (!change(properties)) continue;
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

    console.log(`${MIGRATION_NAME}: [SUCCESS] ${action} finished. Updated: ${updated}`);
    return [...touchedVersions];
  }
}
