import { MigrationInterface, QueryRunner } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { defaultAppEnvironments } from '@helpers/utils.helper';
import { AppEnvironment } from '@entities/app_environments.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { filterEncryptedFromOptions } from '@helpers/migration.helper';
import { ConfigService } from '@nestjs/config';
import { TOOLJET_EDITIONS, getImportPath } from '@modules/app/constants';

export class addMultipleEnvForCEcreatedApps1681463532466 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const configs = nestApp.get(ConfigService);
    const edition: TOOLJET_EDITIONS = configs.get<string>('TOOLJET_EDITIONS') as TOOLJET_EDITIONS;
    const { EncryptionService } = await import(`${await getImportPath(true, edition)}/encryption/service`);
    const { CredentialsService } = await import(
      `${await getImportPath(true, edition)}/encryption/services/credentials.service`
    );
    const encryptionService = nestApp.get(EncryptionService);
    const credentialService = nestApp.get(CredentialsService);
    const entityManager = queryRunner.manager;

    const organizations = await entityManager.find(Organization, {
      relations: ['appEnvironments'],
    });

    for (const organization of organizations) {
      const appEnvironments = organization.appEnvironments;
      if (appEnvironments.length === 1) {
        //fetch default datasource option (prod env)
        const defaultEnv = appEnvironments[0];
        const dataSourceOptions = await entityManager.find(DataSourceOptions, {
          where: {
            environmentId: defaultEnv.id,
          },
        });

        //delete RestAPI Oauth token data
        dataSourceOptions?.forEach((dso) => {
          delete dso?.options?.tokenData;
        });

        /* rename the default environment to development and create the rest*/
        const startingEnv = defaultAppEnvironments.find((env) => env.priority === 1);
        await entityManager.update(AppEnvironment, defaultEnv.id, {
          name: startingEnv.name,
          isDefault: startingEnv.isDefault,
          priority: startingEnv.priority,
        });

        // create other two environments
        for (const { name, isDefault, priority } of defaultAppEnvironments.filter(
          (env) => env.priority !== startingEnv.priority
        )) {
          const newEnvironment: AppEnvironment = await entityManager.save(
            entityManager.create(AppEnvironment, {
              name,
              isDefault,
              organizationId: organization.id,
              priority,
            })
          );

          for (const dsOption of dataSourceOptions) {
            //copy the options and remove secrets, then create new one for new environments
            const newOptions = await filterEncryptedFromOptions(
              dsOption.options,
              encryptionService,
              credentialService,
              true,
              entityManager
            );

            await entityManager.save(
              entityManager.create(DataSourceOptions, {
                environmentId: newEnvironment.id,
                options: newOptions,
                dataSourceId: dsOption.dataSourceId,
              })
            );
          }
        }
      }
    }
    await nestApp.close();
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
