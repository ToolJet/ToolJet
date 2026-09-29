import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'PreserveClearedCurrencyDefaultValue';
const TYPE = 'CurrencyInput';

export class PreserveClearedCurrencyDefaultValue1790534928633 implements MigrationInterface {
  /**
   * Currency Input's Default value was schema-typed `{ type: 'number' }`, which cannot hold an
   * empty string: clearing the field resolved to `0`, so the input was never actually empty. The
   * schema is now a pattern-guarded string/number union, so an empty Default value stays empty.
   *
   * That is the fix, but it would change what existing apps render. An author who cleared the
   * field saw `0` and could not have intended anything else, because empty was not reachable — and
   * a mandatory Currency Input with a cleared value was ALWAYS valid, since `0` counts as filled.
   * Left alone, those apps would start rendering an empty field and, if mandatory, start failing
   * validation on a form that used to submit.
   *
   * So a cleared value is pinned to an explicit `'0'`, which is exactly what it rendered before.
   * Authors can produce a genuinely empty Default value from now on by clearing the field again.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;
    const touchedPageIds = new Set<string>();

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [TYPE]);
    const totalComponents = parseInt(countResult[0].count, 10);

    if (totalComponents === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No Currency Input components found. | Total: 0`);
      return;
    }

    console.log(
      `${MIGRATION_NAME}: [START] Pin a cleared Default value to the zero it already rendered | Total: ${totalComponents}`
    );
    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalComponents);

    while (hasMoreData) {
      // `properties` is a `json` column, not `jsonb`, so the empty value cannot be filtered in SQL.
      // Every Currency Input is scanned and only the cleared ones are written.
      const components = await queryRunner.query(
        `SELECT id, page_id, properties
           FROM components
           WHERE type = $1
           ORDER BY "created_at" ASC
           LIMIT $2 OFFSET $3`,
        [TYPE, batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      totalUpdated += await this.processUpdates(queryRunner, components, migrationProgress, touchedPageIds);
      offset += batchSize;
    }

    // The resolved Default value changes shape for these components, which is a structural change
    // to the component definition. Invalidate app version history so a stale undo/redo snapshot
    // cannot restore the cleared value and reintroduce the behaviour change this migration exists
    // to prevent. Scoped to the pages actually rewritten.
    if (touchedPageIds.size > 0) {
      const versions: { app_version_id: string }[] = await queryRunner.query(
        `SELECT DISTINCT app_version_id FROM pages WHERE id = ANY($1)`,
        [Array.from(touchedPageIds)]
      );
      await deleteAppHistoryForStructuralMigration(
        queryRunner.manager,
        { appVersionIds: versions.map((v) => v.app_version_id) },
        MIGRATION_NAME
      );
    }

    console.log(
      `${MIGRATION_NAME}: [SUCCESS] Pin a cleared Default value to the zero it already rendered finished. Updated ${totalUpdated} components.`
    );
  }

  private async processUpdates(
    queryRunner: QueryRunner,
    components: any[],
    migrationProgress: MigrationProgress,
    touchedPageIds: Set<string>
  ): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};
      const current = properties.value?.value;

      // Only a value that resolved to 0 BECAUSE it could not be empty is pinned. A component with
      // no `value` key at all is left alone: the server merges the registered default into every
      // component on page read, so it already behaves as '0' without being rewritten here.
      const wasForcedToZero = properties.value !== undefined && (current === '' || current === null);

      if (!wasForcedToZero) {
        migrationProgress.show();
        continue;
      }

      properties.value = { ...properties.value, value: '0' };

      await queryRunner.query(`UPDATE components SET properties = $1 WHERE id = $2`, [
        JSON.stringify(properties),
        component.id,
      ]);

      if (component.page_id) touchedPageIds.add(component.page_id);
      updatedCount++;

      migrationProgress.show();
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
