import { MigrationProgress, deleteAppHistoryForStructuralMigration } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'MigrateVisibilityForSvgImage';
const TYPE = 'SvgImage';

export class MigrateVisibilityForSvgImage1791946693334 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let totalUpdated = 0;

    const countResult = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [TYPE]);
    const totalComponents = parseInt(countResult[0].count, 10);

    if (totalComponents === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] No SvgImage components found. | Total: 0`);
      return;
    }

    console.log(
      `${MIGRATION_NAME}: [START] Move SvgImage visibility from styles to properties | Total: ${totalComponents}`
    );
    const migrationProgress = new MigrationProgress(MIGRATION_NAME, totalComponents);
    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties, styles
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

      totalUpdated += await this.processUpdates(queryRunner, components, migrationProgress);
      offset += batchSize;
    }

    // visibility changed bucket (styles → properties): invalidate app version history so stale
    // undo/redo snapshots don't resurrect the old shape.
    const versions: { app_version_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT p.app_version_id FROM components c
         INNER JOIN pages p ON c.page_id = p.id WHERE c.type = $1`,
      [TYPE]
    );
    await deleteAppHistoryForStructuralMigration(
      queryRunner.manager,
      { appVersionIds: versions.map((v) => v.app_version_id) },
      MIGRATION_NAME
    );

    console.log(`${MIGRATION_NAME}: [SUCCESS] Move SvgImage visibility finished. Updated ${totalUpdated} components.`);
  }

  private async processUpdates(
    queryRunner: QueryRunner,
    components: any[],
    migrationProgress: MigrationProgress
  ): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};
      const styles = component.styles ? { ...component.styles } : {};

      // visibility: styles → properties. Fill the target only when unset so a value already on
      // properties is preserved; always drop the stale styles key.
      if (styles.visibility === undefined) {
        migrationProgress.show();
        continue;
      }
      if (properties.visibility === undefined) {
        properties.visibility = styles.visibility;
      }
      delete styles.visibility;

      await queryRunner.query(`UPDATE components SET properties = $1, styles = $2 WHERE id = $3`, [
        JSON.stringify(properties),
        JSON.stringify(styles),
        component.id,
      ]);

      updatedCount++;
      migrationProgress.show();
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
