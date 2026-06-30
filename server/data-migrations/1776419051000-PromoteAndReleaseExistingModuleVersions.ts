import { MigrationInterface, QueryRunner } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { MigrationProgress } from '@helpers/migration.helper';
import { APP_TYPES } from '@modules/apps/constants';

export class PromoteAndReleaseExistingModuleVersions1776419051000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;

    const organizations = await manager.find(Organization, {
      select: ['id'],
      relations: ['appEnvironments'],
    });

    const migrationProgress = new MigrationProgress(
      'PromoteAndReleaseExistingModuleVersions',
      organizations.length
    );

    for (const organization of organizations) {
      const productionEnvironment = organization.appEnvironments.find((env) => env.isDefault);

      if (!productionEnvironment) {
        migrationProgress.show();
        continue;
      }

      const moduleApps = await manager.find(App, {
        where: { organizationId: organization.id, type: APP_TYPES.MODULE },
        select: ['id', 'currentVersionId'],
      });

      for (const app of moduleApps) {
        const versions = await manager.find(AppVersion, {
          where: { appId: app.id },
          order: { createdAt: 'DESC' },
          select: ['id', 'createdAt'],
        });

        if (!versions.length) continue;

        const latestVersion = versions[0];

        await manager.update(
          AppVersion,
          { id: latestVersion.id },
          {
            currentEnvironmentId: productionEnvironment.id,
            status: AppVersionStatus.PUBLISHED,
          }
        );

        await manager.update(App, { id: app.id }, { currentVersionId: latestVersion.id });

        console.log(`Released module ${app.id} → version ${latestVersion.id}`);
      }

      migrationProgress.show();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
