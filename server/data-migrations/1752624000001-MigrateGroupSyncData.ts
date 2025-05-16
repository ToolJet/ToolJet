import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { processDataInBatches } from '@helpers/migration.helper';
import { SSOConfigs } from '@entities/sso_config.entity';
import { SsoConfigOidcGroupSync } from '@entities/sso_config_oidc_group_sync.entity';

export class MigrateGroupSyncData1752624000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager) => {
        return await entityManager
          .createQueryBuilder(SSOConfigs, 'sso_configs')
          .select(['sso_configs.id', 'sso_configs.configs'])
          .where('sso_configs.config_scope = :scope', { scope: 'organization' })
          .andWhere('sso_configs.sso = :sso', { sso: 'openid' })
          .getMany();
      },
      async (entityManager: EntityManager, ssoConfigs: SSOConfigs[]) => {
        await this.processUpdates(entityManager, ssoConfigs);
      },
      100
    );
  }

  private async processUpdates(entityManager: EntityManager, ssoConfigs: SSOConfigs[]) {
    for (const config of ssoConfigs) {
      const { id: ssoConfigId, configs } = config;
      const { claimName, groupMapping, enableGroupSync } = configs as any;

      const enrty = entityManager.create(SsoConfigOidcGroupSync, {
        ssoConfigId,
        organizationId: null,
        claimName: claimName || null,
        groupMapping: groupMapping || null,
        enableGroupSync: enableGroupSync || false,
      });
      entityManager.save(SsoConfigOidcGroupSync, enrty);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all rows from the sso_config_oidc_group_sync table
    await queryRunner.query(`DELETE FROM sso_config_oidc_group_sync`);
  }
}
