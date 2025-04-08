import { AppEnvironment } from '@entities/app_environments.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { OrgEnvironmentConstantValue } from '@entities/org_environment_constant_values.entity';
import { MigrationProgress } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateCEOrgConstantsToOtherEnvs1698841869350 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const manager = queryRunner.manager;
    const organizations = await manager.find(Organization);
    const migrationProgress = new MigrationProgress(
      'PopulateCEOrgConstantsToOtherEnvs1698841869350',
      organizations.length
    );

    for (const organization of organizations) {
      const { id: organizationId } = organization;
      const appEnvironments = await manager.find(AppEnvironment, {
        where: {
          organizationId,
        },
      });
      const orgConstants = await manager.find(OrganizationConstant, {
        where: {
          organizationId,
        },
      });

      for (const orgConstant of orgConstants) {
        const { id: organizationConstantId } = orgConstant;
        const orgConstantValues = await manager.find(OrgEnvironmentConstantValue, {
          where: {
            organizationConstantId,
          },
        });
        if (orgConstantValues.length === 1) {
          /* other values are missing, means, migrated from CE */
          const existedValue = orgConstantValues[0];
          for (const appEnvironment of appEnvironments.filter((env) => env.id !== existedValue.environmentId)) {
            const otherEnvConstantValue = manager.create(OrgEnvironmentConstantValue, {
              organizationConstantId,
              environmentId: appEnvironment.id,
              value: '',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            await manager.save(OrgEnvironmentConstantValue, otherEnvConstantValue);
          }
        }
      }
      migrationProgress.show();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
