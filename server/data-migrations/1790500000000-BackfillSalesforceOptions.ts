import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { dbTransactionWrap } from '@helpers/database.helper';

/**
 * Backfills the Salesforce plugin options introduced with the PKCE grant, login type and
 * "CRUD on any object" changes. Existing values are never overwritten, and it is safe to re-run.
 *
 * 1. Data sources: auth_type = oauth2, grant_type = authorization_code, login_type = production
 *    (the values the plugin always used) where missing. The plugin also treats missing values as these defaults.
 * 2. Queries: the plugin used to ignore `resource_name` and ran every CRUD query on Account. The field is now
 *    honoured, so every existing CRUD query is set to Account to keep returning exactly what it returned before.
 *    Blank values also fall back to Account inside the plugin, for queries created or imported later.
 */
export class BackfillSalesforceOptions1790500000000 implements MigrationInterface {
  private static readonly DATA_SOURCE_DEFAULTS = {
    auth_type: 'oauth2',
    grant_type: 'authorization_code',
    login_type: 'production',
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.backfillDataSourceOptions(queryRunner.manager);
    await this.backfillCrudResourceName(queryRunner);
  }

  // data_source_options was dropped in DropDataSourceOptionsTable1773300000000 once its data was copied to
  // data_source_version_options, so main targets the new table. LTS installs that already ran this migration
  // against data_source_options carry the backfilled values over through that copy.
  private async backfillDataSourceOptions(entityManager: EntityManager): Promise<void> {
    const totalRecords = await entityManager.query(
      `
        SELECT COUNT(*)
        FROM data_source_version_options dsvo
        JOIN data_source_versions dsv ON dsv.id = dsvo.data_source_version_id
        JOIN data_sources ds ON ds.id = dsv.data_source_id
        WHERE ds.kind = $1
      `,
      ['salesforce']
    );
    const totalCount = parseInt(totalRecords[0].count);
    if (totalCount === 0) {
      console.log('No records found to update for Salesforce data sources.');
      return;
    }

    return dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress('BackfillSalesforceOptions1790500000000', totalCount);
      const batchSize = 100;

      const fetchBatch = async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.query(
          `
          SELECT dsvo.id, dsvo.options
          FROM data_source_version_options dsvo
          JOIN data_source_versions dsv ON dsv.id = dsvo.data_source_version_id
          JOIN data_sources ds ON ds.id = dsv.data_source_id
          WHERE ds.kind = $1
          ORDER BY dsvo.id
          LIMIT $2 OFFSET $3
          `,
          ['salesforce', take, skip]
        );
      };

      const processBatch = async (entityManager: EntityManager, dataSourceOptions: any[]) => {
        for (const dataSourceOption of dataSourceOptions) {
          const options = dataSourceOption.options;
          if (options) {
            let changed = false;
            for (const [key, value] of Object.entries(BackfillSalesforceOptions1790500000000.DATA_SOURCE_DEFAULTS)) {
              if (!options[key]?.value) {
                options[key] = { value, encrypted: false };
                changed = true;
              }
            }
            if (changed) {
              await entityManager.query(`UPDATE data_source_version_options SET options = $1 WHERE id = $2`, [
                options,
                dataSourceOption.id,
              ]);
            }
          }
          migrationProgress.show();
        }
      };

      await processDataInBatches(entityManager, fetchBatch, processBatch, batchSize);
    }, entityManager);
  }

  private async backfillCrudResourceName(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`
      SELECT COUNT(*)::int AS count
      FROM data_queries dq
      JOIN data_sources ds ON ds.id = dq.data_source_id
      WHERE ds.kind = 'salesforce'
        AND dq."options"::jsonb->>'operation' = 'crud'
        AND COALESCE(TRIM(dq."options"::jsonb->>'resource_name'), '') NOT IN ('', 'Account')
    `);
    if (count > 0) {
      console.log(`Salesforce CRUD queries with a non-Account resource_name being reset to Account: ${count}`);
    }

    await queryRunner.query(`
      UPDATE data_queries dq
      SET "options" = (dq."options"::jsonb || jsonb_build_object('resource_name', 'Account'))::json
      FROM data_sources ds
      WHERE ds.id = dq.data_source_id
        AND ds.kind = 'salesforce'
        AND dq."options"::jsonb->>'operation' = 'crud'
        AND COALESCE(dq."options"::jsonb->>'resource_name', '') <> 'Account'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
