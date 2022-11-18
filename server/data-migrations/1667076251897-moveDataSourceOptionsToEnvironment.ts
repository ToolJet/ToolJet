import { App } from 'src/entities/app.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppsService } from '@services/apps.service';
import { DataSourcesService } from '@services/data_sources.service';
import { defaultAppEnvironments } from 'src/helpers/utils.helper';
import { DataQuery } from 'src/entities/data_query.entity';

export class moveDataSourceOptionsToEnvironment1667076251897 implements MigrationInterface {
  constructor(private dataSourcesService: DataSourcesService, private appsService: AppsService) {}

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
    // await queryRunner.dropColumn('data_sources', 'options');
    // await queryRunner.dropColumn('data_sources', 'app_id');
    // await queryRunner.dropColumn('data_sources', 'app_version_id');
  }

  private async associateDataQueriesAndSources(entityManager: EntityManager, app: App, appVersion: AppVersion) {
    return await Promise.all(
      defaultAppEnvironments.map(async ({ name, isDefault }) => {
        const environment: AppEnvironment = await entityManager.save(
          entityManager.create(AppEnvironment, {
            name,
            isDefault,
            versionId: appVersion.id,
          })
        );
        // Get all data sources under app
        const dataSources = await entityManager.find(DataSource, {
          where: { appId: app.id },
        });
        if (dataSources?.length) {
          await Promise.all(
            dataSources.map(async (dataSource: DataSource) => {
              const convertedOptions = this.appsService.convertToArrayOfKeyValuePairs(dataSource.options);
              const options = !environment.isDefault
                ? await this.dataSourcesService.parseOptionsForCreate(convertedOptions, true, entityManager)
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
    const dataSources = await manager.find(DataSource, {
      where: { appId: appVersion.appId, appVersionId: null },
    });
    for await (const dataSource of dataSources) {
      await manager.update(DataSource, dataSource.id, {
        appVersionId: appVersion.id,
      });
    }

    const dataQueries = await manager.find(DataQuery, {
      where: { appId: appVersion.appId, appVersionId: null },
    });
    for await (const dataQuery of dataQueries) {
      await manager.update(DataQuery, dataQuery.id, {
        appVersionId: appVersion.id,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
