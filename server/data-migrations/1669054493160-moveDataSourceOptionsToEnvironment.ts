import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppsService } from '@services/apps.service';
import { DataSourcesService } from '@services/data_sources.service';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';

export class moveDataSourceOptionsToEnvironment1669054493160 implements MigrationInterface {
  private nestApp;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default environment for all apps
    this.nestApp = await NestFactory.createApplicationContext(AppModule);
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);
    if (appVersions?.length) {
      for (const appVersion of appVersions) {
        await this.associateDataQueriesAndSources(entityManager, appVersion);
      }
    }
  }

  private async associateDataQueriesAndSources(entityManager: EntityManager, appVersion: AppVersion) {
    const dataSourcesService = this.nestApp.get(DataSourcesService);
    const appsService = this.nestApp.get(AppsService);

    for (const { name, isDefault } of defaultAppEnvironments) {
      const environment: AppEnvironment = await entityManager.save(
        entityManager.create(AppEnvironment, {
          name,
          isDefault,
          appVersionId: appVersion.id,
        })
      );
      // Get all data sources under app
      const dataSources = await entityManager.query('select * from data_sources where app_id = $1', [appVersion.appId]);

      if (dataSources?.length) {
        for (const dataSource of dataSources) {
          const convertedOptions = appsService.convertToArrayOfKeyValuePairs(dataSource.options);
          const options = !environment.isDefault
            ? await dataSourcesService.parseOptionsForCreate(convertedOptions, true, entityManager)
            : dataSource.options;
          await entityManager.save(
            entityManager.create(DataSourceOptions, {
              dataSourceId: dataSource.id,
              environmentId: environment.id,
              options,
            })
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
