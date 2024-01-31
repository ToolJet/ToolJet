import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { Organization } from 'src/entities/organization.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { EncryptionService } from '@services/encryption.service';
import { filterEncryptedFromOptions } from 'src/helpers/utils.helper';

export class environmentDataSourceMappingFix1683022868045 implements MigrationInterface {
  // This is to fix apps having only single environment option values (Imported from CE)
  public async up(queryRunner: QueryRunner): Promise<void> {
    const nestApp = await NestFactory.createApplicationContext(AppModule);
    const encryptionService = nestApp.get(EncryptionService);
    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization, {
      relations: ['appEnvironments'],
    });

    for (const organization of organizations) {
      const appEnvironments = organization.appEnvironments;
      const defaultEnv = appEnvironments.find((e) => e.isDefault).id;
      const nonDefaultEnvs = appEnvironments.filter((ae) => !ae.isDefault);
      const defaultEnvOption = await entityManager.find(DataSourceOptions, {
        where: { environmentId: defaultEnv },
      });

      if (defaultEnvOption?.length) {
        for (const nonDefaultEnv of nonDefaultEnvs) {
          const envOptionCount = await entityManager.count(DataSourceOptions, {
            where: { environmentId: nonDefaultEnv.id },
          });

          if (defaultEnvOption?.length !== envOptionCount) {
            const envOption = await entityManager.find(DataSourceOptions, {
              where: { environmentId: nonDefaultEnv.id },
              select: ['dataSourceId'],
            });

            const envOptionDS = envOption.map((options) => options.dataSourceId);

            const dataSourcesOptionsToAdd = defaultEnvOption.filter(
              (dsOptions) => !envOptionDS?.includes(dsOptions.dataSourceId)
            );

            for (const dataSourcesOptionToAdd of dataSourcesOptionsToAdd) {
              //copy the options and remove secrets, then create new one for new environments
              const newOptions = await filterEncryptedFromOptions(
                dataSourcesOptionToAdd.options,
                encryptionService,
                null,
                false,
                entityManager
              );

              await entityManager.save(
                entityManager.create(DataSourceOptions, {
                  environmentId: nonDefaultEnv.id,
                  options: newOptions,
                  dataSourceId: dataSourcesOptionToAdd.dataSourceId,
                })
              );
            }
          }
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
