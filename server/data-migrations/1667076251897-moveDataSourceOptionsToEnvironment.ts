import { App } from 'src/entities/app.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceOptions } from 'src/entities/data_source_options.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class moveDataSourceOptionsToEnvironment1667076251897 implements MigrationInterface {
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
                const environment: AppEnvironment = await entityManager.save(
                  entityManager.create(AppEnvironment, {
                    name: 'production',
                    isDefault: true,
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
                      await entityManager.save(
                        entityManager.create(DataSourceOptions, {
                          dataSourceId: dataSource.id,
                          environmentId: environment.id,
                          options: dataSource.options,
                        })
                      );
                    })
                  );
                }
              })
            );
          }
        })
      );
    }
    await queryRunner.dropColumn('data_sources', 'options');
    // await queryRunner.dropColumn('data_sources', 'app_id');
    // await queryRunner.dropColumn('data_sources', 'app_version_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
