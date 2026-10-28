import { dbTransactionWrap } from '@helpers/database.helper';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class RenameGrantTypeKeyInSSOConfig1762770971766 implements MigrationInterface {
  private readonly SSO_TYPE = 'openid';
  private readonly BATCH_SIZE = 100;

  private async getTotalCount(entityManager: EntityManager): Promise<number> {
    const totalRecords = await entityManager.query(
      `
        SELECT COUNT(*)
        FROM sso_configs
        WHERE sso = $1
      `,
      [this.SSO_TYPE]
    );
    return parseInt(totalRecords[0].count, 10);
  }

  private fetchSSOConfigsBatch = async (entityManager: EntityManager, skip: number, take: number): Promise<any[]> => {
    return await entityManager.query(
      `
        SELECT id, configs
        FROM sso_configs
        WHERE sso = $1
        ORDER BY id
        LIMIT $2 OFFSET $3
      `,
      [this.SSO_TYPE, take, skip]
    );
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const totalCount = await this.getTotalCount(entityManager);
    if (totalCount === 0) return;

    await dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress('RenameGrantTypeKeyInSSOConfig1762770971766', totalCount);

      const processBatch = async (entityManager: EntityManager, ssoConfigs: any[]) => {
        for (const ssoConfig of ssoConfigs) {
          const configs = ssoConfig.configs;
          if (configs && configs.grant_type && !configs.grantType) {
            // Copy value from grant_type to grantType
            configs.grantType = configs.grant_type;
            delete configs.grant_type;

            await entityManager.query(
              `
                UPDATE sso_configs
                SET configs = $1
                WHERE id = $2
              `,
              [configs, ssoConfig.id]
            );
          }
          migrationProgress.show();
        }
      };

      await processDataInBatches(entityManager, this.fetchSSOConfigsBatch, processBatch, this.BATCH_SIZE);
    }, entityManager);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const totalCount = await this.getTotalCount(entityManager);
    if (totalCount === 0) return;

    await dbTransactionWrap(async (entityManager: EntityManager) => {
      const migrationProgress = new MigrationProgress('RenameGrantTypeKeyInSSOConfig1762770971766', totalCount);

      const processBatch = async (entityManager: EntityManager, ssoConfigs: any[]) => {
        for (const ssoConfig of ssoConfigs) {
          const configs = ssoConfig.configs;
          if (configs && configs.grantType && !configs.grant_type) {
            // Revert the change
            configs.grant_type = configs.grantType;
            delete configs.grantType;

            await entityManager.query(
              `
                UPDATE sso_configs
                SET configs = $1
                WHERE id = $2
              `,
              [configs, ssoConfig.id]
            );
          }
          migrationProgress.show();
        }
      };

      await processDataInBatches(entityManager, this.fetchSSOConfigsBatch, processBatch, this.BATCH_SIZE);
    });
  }
}
