import { App } from 'src/entities/app.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { Organization } from 'src/entities/organization.entity';
import { MigrationProgress } from 'src/helpers/utils.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class BackFillCurrentEnvironmentId1686829426671 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //back fill current_environment_id to production env id
    await this.backFillNewColumn(queryRunner.manager);
  }

  async backFillNewColumn(manager: EntityManager) {
    const organizations = await manager.find(Organization, {
      select: ['id'],
      // relations: ['appEnvironments'], not getting this data in single query since it timeout in cloud
    });

    const migrationProgress = new MigrationProgress('BackFillCurrentEnvironmentId1686829426671', organizations.length);

    for (const organization of organizations) {
      const appEnvironments = await manager.find(AppEnvironment, {
        select: ['id', 'isDefault', 'priority'],
        where: {
          organizationId: organization.id,
        },
      });
      const productionEnvironment = appEnvironments.find((appEnvironment) => appEnvironment.isDefault);
      const developmentEnvironment = appEnvironments.find((appEnvironment) => appEnvironment.priority === 1);
      const apps = await manager.find(App, {
        select: ['id', 'appVersions', 'currentVersionId'],
        where: {
          organizationId: organization.id,
        },
        relations: ['appVersions'],
      });

      for (const { appVersions, currentVersionId } of apps) {
        for (const appVersion of appVersions) {
          console.log('Updating app version =>', appVersion.id);
          let envToUpdate = developmentEnvironment.id;

          if (currentVersionId && currentVersionId === appVersion.id) {
            envToUpdate = productionEnvironment.id;
          }
          await manager.update(
            AppVersion,
            { id: appVersion.id },
            {
              currentEnvironmentId: envToUpdate,
            }
          );
        }
      }
      migrationProgress.show();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
