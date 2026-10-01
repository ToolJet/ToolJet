import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { dbTransactionWrap } from '@helpers/database.helper';

/**
 * Backfills the auth type / grant type dropdown values introduced with the
 * "Authorization code with PKCE" grant. Existing values are never overwritten.
 * New optional fields (code_verifier) are left unset.
 */
export class BackfillSalesforceAuthOptions1790400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const totalRecords = await entityManager.query(
      `
        SELECT COUNT(*)
        FROM data_source_options dso
        JOIN data_sources ds ON dso.data_source_id = ds.id
        WHERE ds.kind = $1
      `,
      ['salesforce']
    );
    const totalCount = parseInt(totalRecords[0].count);
    if (totalCount === 0) {
      console.log('No records found to update for Salesforce data sources.');
      return;
    }
    await this.backfill(entityManager, totalCount);
  }

  private async backfill(entityManager: EntityManager, totalCount: number): Promise<void> {
    return dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress('BackfillSalesforceAuthOptions1790400000000', totalCount);
      const batchSize = 100;

      const fetchBatch = async (entityManager: EntityManager, skip: number, take: number) => {
        return await entityManager.query(
          `
          SELECT dso.id, dso.options
          FROM data_source_options dso
          JOIN data_sources ds ON dso.data_source_id = ds.id
          WHERE ds.kind = $1
          ORDER BY dso.id
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
            const defaults = { auth_type: 'oauth2', grant_type: 'authorization_code' };
            for (const [key, value] of Object.entries(defaults)) {
              if (!options[key]?.value) {
                options[key] = { value, encrypted: false };
                changed = true;
              }
            }
            if (changed) {
              await entityManager.query(`UPDATE data_source_options SET options = $1 WHERE id = $2`, [
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
