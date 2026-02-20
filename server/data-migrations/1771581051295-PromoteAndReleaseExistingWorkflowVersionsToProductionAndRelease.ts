import { MigrationInterface, QueryRunner } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { App } from '@entities/app.entity';
import { AppVersion } from '@entities/app_version.entity';
import { MigrationProgress } from '@helpers/migration.helper';
import { getTooljetEdition } from '@helpers/utils.helper';
import { APP_TYPES } from '@modules/apps/constants';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

export class PromoteAndReleaseExistingWorkflowVersionsToProductionAndRelease1771581051295 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        if (getTooljetEdition() === TOOLJET_EDITIONS.CE) {
            console.log('Skipping migration: workflows are not available in CE edition');
            return;
        }

        const manager = queryRunner.manager;

        const organizations = await manager.find(Organization, {
            select: ['id'],
            relations: ['appEnvironments'],
        });

        const migrationProgress = new MigrationProgress(
            'PromoteAndReleaseExistingWorkflowVersions',
            organizations.length
        );

        for (const organization of organizations) {
            const productionEnvironment = organization.appEnvironments.find((env) => env.isDefault);

            if (!productionEnvironment) {
                migrationProgress.show();
                continue;
            }

            const workflowApps = await manager.find(App, {
                where: { organizationId: organization.id, type: APP_TYPES.WORKFLOW },
                select: ['id', 'currentVersionId'],
            });

            for (const app of workflowApps) {
                const versions = await manager.find(AppVersion, {
                    where: { appId: app.id },
                    order: { createdAt: 'DESC' },
                    select: ['id', 'createdAt'],
                });

                if (!versions.length) continue;

                const version = versions[0];

                await manager.update(
                    AppVersion,
                    { id: version.id },
                    {
                        currentEnvironmentId: productionEnvironment.id,
                    }
                );

                await manager.update(App, { id: app.id }, { currentVersionId: version.id });

                console.log(`Released workflow ${app.id} → version ${version.id}`);
            }

            migrationProgress.show();
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> { }
}
