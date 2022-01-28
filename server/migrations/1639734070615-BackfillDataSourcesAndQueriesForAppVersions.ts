import { NestFactory } from '@nestjs/core';
import { DataSourcesService } from 'src/services/data_sources.service';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { AppModule } from 'src/app.module';
import { Credential } from 'src/entities/credential.entity';

export class BackfillDataSourcesAndQueriesForAppVersions1639734070615 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization);
    const nestApp = await NestFactory.createApplicationContext(AppModule);
    const dataSourcesService = nestApp.get(DataSourcesService);

    for (const org of organizations) {
      console.log(`Backfilling for organization ${org.name} : ${org.id}`);

      const apps = await entityManager.find(App, {
        where: { organizationId: org.id },
      });
      for (const app of apps) {
        await this.associateDataSourcesAndQueriesToAppVersions(app, entityManager, dataSourcesService);
      }
    }

    console.log(`Backfill done for ${organizations.length} organization/s`);
  }

  async associateDataSourcesAndQueriesToAppVersions(
    app: App,
    entityManager: EntityManager,
    dataSourcesService: DataSourcesService
  ) {
    const appVersions = await entityManager.find(AppVersion, {
      where: { appId: app.id },
      order: { createdAt: 'ASC' },
    });
    const dataSources = await entityManager.find(DataSource, {
      where: { appId: app.id, appVersionId: null },
    });
    const dataQueries = await entityManager.find(DataQuery, {
      where: { appId: app.id, appVersionId: null },
    });
    const [firstAppVersion, ...restAppVersions] = appVersions;

    await this.associateExistingDataSourceAndQueriesToVersion(firstAppVersion, dataSources, dataQueries, entityManager);

    await this.createNewDataSourcesAndQueriesForVersions(
      restAppVersions,
      dataSources,
      dataQueries,
      entityManager,
      dataSourcesService
    );
  }

  async associateExistingDataSourceAndQueriesToVersion(
    firstAppVersion: AppVersion,
    dataSources: DataSource[],
    dataQueries: DataQuery[],
    entityManager: EntityManager
  ) {
    if (!firstAppVersion) return;

    for (const dataSource of dataSources) {
      await entityManager.update(DataSource, dataSource.id, {
        appVersionId: firstAppVersion.id,
      });
    }

    for (const dataQuery of dataQueries) {
      await entityManager.update(DataQuery, dataQuery.id, {
        appVersionId: firstAppVersion.id,
      });
    }
  }

  async createNewDataSourcesAndQueriesForVersions(
    restAppVersions: AppVersion[],
    dataSources: DataSource[],
    dataQueries: DataQuery[],
    entityManager: EntityManager,
    dataSourcesService: DataSourcesService
  ) {
    if (restAppVersions.length == 0) return;

    const oldDataSourceToNewMapping = {};
    const newDataQueries = [];

    for (const appVersion of restAppVersions) {
      for (const dataSource of dataSources) {
        const convertedOptions = this.convertToArrayOfKeyValuePairs(dataSource.options);
        const newOptions = await dataSourcesService.parseOptionsForCreate(convertedOptions, entityManager);
        await this.setNewCredentialValueFromOldValue(newOptions, convertedOptions, entityManager);

        const dataSourceParams = {
          name: dataSource.name,
          kind: dataSource.kind,
          options: newOptions,
          appId: dataSource.appId,
          appVersionId: appVersion.id,
        };

        const newDataSource = await entityManager.save(entityManager.create(DataSource, dataSourceParams));

        oldDataSourceToNewMapping[dataSource.id] = newDataSource.id;
      }

      for (const dataQuery of dataQueries) {
        const dataQueryParams = {
          name: dataQuery.name,
          kind: dataQuery.kind,
          options: dataQuery.options,
          dataSourceId: oldDataSourceToNewMapping[dataQuery.dataSourceId],
          appId: dataQuery.appId,
          appVersionId: appVersion.id,
        };
        const newDataQuery = await entityManager.save(entityManager.create(DataQuery, dataQueryParams));
        newDataQueries.push(newDataQuery);
      }
    }
    console.log(`New data sources created: ${Object.values(oldDataSourceToNewMapping)}`);
    console.log(`New data queries created: ${newDataQueries.map((q) => q.id)}`);
  }

  convertToArrayOfKeyValuePairs(options): Array<object> {
    return Object.keys(options).map((key) => {
      return {
        key: key,
        value: options[key]['value'],
        encrypted: options[key]['encrypted'],
        credential_id: options[key]['credential_id'],
      };
    });
  }

  async setNewCredentialValueFromOldValue(newOptions: any, oldOptions: any, entityManager: EntityManager) {
    const newOptionsWithCredentials = this.convertToArrayOfKeyValuePairs(newOptions).filter((opt) => opt['encrypted']);

    for (const newOption of newOptionsWithCredentials) {
      const oldOption = oldOptions.find((oldOption) => oldOption['key'] == newOption['key']);
      const oldCredential = await entityManager.findOne(Credential, { where: { id: oldOption.credential_id } });
      const newCredential = await entityManager.findOne(Credential, { where: { id: newOption['credential_id'] } });
      newCredential.valueCiphertext = oldCredential?.valueCiphertext;

      await entityManager.save(newCredential);
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
