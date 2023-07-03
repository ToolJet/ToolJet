import { AppEnvironment } from 'src/entities/app_environments.entity';
import { Organization } from 'src/entities/organization.entity';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateEnvironmentsUnderWorkspace1675844361118 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    let progress = 0;

    const organizations = await entityManager.find(Organization, {
      select: ['id', 'name'],
    });

    //Insert new environments under workspace
    for (const org of organizations) {
      progress++;
      console.log(
        `MigrateEnvironmentsUnderWorkspace1675844361118 Progress ${Math.round(
          (progress / organizations.length) * 100
        )} %`
      );

      const newMappingForEnvironments = {};
      console.log(`Performing environment migration for ${org.name}: ${org.id}`);
      for (const { name, isDefault } of defaultAppEnvironments) {
        console.log(`Current Environment name: ${name}`);
        const environment: AppEnvironment = await entityManager.save(
          entityManager.create(AppEnvironment, {
            name,
            isDefault,
            organizationId: org.id,
          })
        );
        newMappingForEnvironments[name] = {
          ...newMappingForEnvironments[name],
          [org.id]: environment.id,
        };

        //Retrieve old environments under app_versions
        const oldMappingForEnvironments = {};
        const envs = await queryRunner.query(
          `select app_environments.id from app_versions inner join apps on apps.organization_id = $1
                 inner join app_environments on app_environments.app_version_id = app_versions.id
                  where app_versions.app_id = apps.id and app_environments.name=$2`,
          [org.id, name]
        );
        oldMappingForEnvironments[name] = {
          ...oldMappingForEnvironments[name],
          [org.id]: envs,
        };

        //Update datasources options from old and new mapping

        if (oldMappingForEnvironments[name][org.id] && oldMappingForEnvironments[name][org.id].length > 0) {
          await queryRunner.query(
            `update data_source_options set environment_id = $1
                   where environment_id IN (${oldMappingForEnvironments[name][org.id]
                     .map((env) => `'${env.id}'`)
                     ?.join()})`,
            [newMappingForEnvironments[name][org.id]]
          );
        }
      }

      console.log(`Env migration completed for organization: ${org.name}: ${org.id}`);
    }

    //Drop app_version_id column as it is no longer needed
    await queryRunner.dropColumn('app_environments', 'app_version_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
