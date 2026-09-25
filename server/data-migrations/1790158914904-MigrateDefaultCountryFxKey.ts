import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'MigrateDefaultCountryFxKey';
// Phone Input and Currency Input share the custom inspector panel that owns Default Country.
const TYPES = ['PhoneInput', 'CurrencyInput'];

export class MigrateDefaultCountryFxKey1790158914904 implements MigrationInterface {
  /**
   * The Default Country fx toggle stored its state under `properties.dateFormat.fxActive`, a
   * Datepicker key copied into the Phone Input and Currency Input inspectors. The read used the
   * same wrong key, so the toggle worked, but every app that used it carries a phantom
   * `dateFormat` property and the real `defaultCountry.fxActive` was never written.
   *
   * The inspector now reads and writes `defaultCountry.fxActive`. Without this migration an app
   * saved with the toggle ON would read `undefined` and silently show the country dropdown in
   * place of the builder's expression — and the next dropdown selection would overwrite it. The
   * expression itself lives in `defaultCountry.value` and is never touched here.
   *
   * `properties` is a `json` column, not `jsonb`, so it carries no containment operators and the
   * phantom key cannot be filtered in SQL. Every component of these types is therefore scanned
   * and only the ones actually holding a `dateFormat` are written.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;
    const touchedPageIds = new Set<string>();

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = ANY($1)`, [TYPES]);
    const totalComponents = parseInt(countResult[0].count, 10);

    if (totalComponents === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No Phone or Currency Input components found. | Total: 0`);
      return;
    }

    console.log(
      `${MIGRATION_NAME}: [START] Move the Default Country fx flag off the Datepicker key | Total: ${totalComponents}`
    );
    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalComponents);

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, page_id, properties
           FROM components
           WHERE type = ANY($1)
           ORDER BY "created_at" ASC
           LIMIT $2 OFFSET $3`,
        [TYPES, batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      totalUpdated += await this.processUpdates(queryRunner, components, migrationProgress, touchedPageIds);
      offset += batchSize;
    }

    // The fx flag moves between property keys, which is a structural change to the component
    // definition. Invalidate app version history so stale undo/redo snapshots cannot resurrect the
    // old key and reintroduce the phantom property. Scoped to the pages actually rewritten, so an
    // app that never used the toggle keeps its history.
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
      `${MIGRATION_NAME}: [SUCCESS] Move the Default Country fx flag off the Datepicker key finished. Updated ${totalUpdated} components.`
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

      // Untouched toggles never wrote the key, so most components need no write at all.
      if (properties.dateFormat === undefined) {
        migrationProgress.show();
        continue;
      }

      // Carry the flag over only when the target has none, so a value already written under the
      // correct key wins; then drop the phantom key. Neither widget has a real `dateFormat`
      // property, so removing it outright is safe.
      if (properties.dateFormat?.fxActive !== undefined) {
        const defaultCountry = properties.defaultCountry ? { ...properties.defaultCountry } : {};
        if (defaultCountry.fxActive === undefined) {
          defaultCountry.fxActive = properties.dateFormat.fxActive;
        }
        properties.defaultCountry = defaultCountry;
      }
      delete properties.dateFormat;

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
