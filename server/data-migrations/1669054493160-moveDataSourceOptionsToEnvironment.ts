import { App } from 'src/entities/app.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppsService } from '@services/apps.service';
import { DataSourcesService } from '@services/data_sources.service';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';

export class moveDataSourceOptionsToEnvironment1669054493160 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create default environment for all apps
    const entityManager = queryRunner.manager;
    const apps = await entityManager.find(App);
    if (apps?.length) {
      await Promise.all(
        apps.map(async (app: App) => {
          const appVersions = await entityManager.find(AppVersion, { where: { appId: app.id } });
          if (appVersions?.length) {
            await Promise.all(
              appVersions.map(async (appVersion: AppVersion) => {
                await this.associateDataQueriesAndSources(entityManager, app, appVersion);
              })
            );
          } else {
            // apps who doesnt have versions; create default version and env, migrate ds and queries
            const { definition } = await entityManager
              .createQueryBuilder()
              .select()
              .from('apps', 'app')
              .where('app.id = :id', { id: app.id })
              .getRawOne();

            const defaultAppVersion = await entityManager.save(
              AppVersion,
              entityManager.create(AppVersion, {
                name: 'v1',
                app,
                definition,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            );
            await this.associateExistingDataSourceAndQueriesToVersion(entityManager, defaultAppVersion);
            await this.associateDataQueriesAndSources(entityManager, app, defaultAppVersion);
          }
        })
      );
    }
  }

  private async associateDataQueriesAndSources(entityManager: EntityManager, app: App, appVersion: AppVersion) {
    const nestApp = await NestFactory.createApplicationContext(AppModule);
    const dataSourcesService = nestApp.get(DataSourcesService);
    const appsService = nestApp.get(AppsService);
    return await Promise.all(
      defaultAppEnvironments.map(async ({ name, isDefault }) => {
        const environment: AppEnvironment = await entityManager.save(
          entityManager.create(AppEnvironment, {
            name,
            isDefault,
            appVersionId: appVersion.id,
          })
        );
        // Get all data sources under app
        const dataSources = await entityManager.query('select * from data_sources where app_id = $1', [
          appVersion.appId,
        ]);

        if (dataSources?.length) {
          await Promise.all(
            dataSources.map(async (dataSource: any) => {
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
            })
          );
        }
      })
    );
  }

  async associateExistingDataSourceAndQueriesToVersion(manager: EntityManager, appVersion: AppVersion) {
    const dataSources = await manager.query(
      'select id from data_sources where app_id = $1 and app_version_id IS NULL',
      [appVersion.appId]
    );
    for await (const { id } of dataSources) {
      await manager.update(DataSource, id, {
        appVersionId: appVersion.id,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
