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
      const productionEnvironment = organization.appEnvironments.find((appEnvironment) => appEnvironment.isDefault);
      const developmentEnvironment = organization.appEnvironments.find(
        (appEnvironment) => appEnvironment.priority === 1
      );
      const apps = await manager.query('select id, current_version_id from apps where organization_id = $1', [
        organization.id,
      ]);

      for (const { current_version_id, id } of apps) {
        const appVersions = await manager.query('select id from app_versions where app_id = $1', [id]);
        for (const appVersion of appVersions) {
          console.log('Updating app version =>', appVersion.id);
          let envToUpdate = developmentEnvironment.id;

          if (current_version_id && current_version_id === appVersion.id) {
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
