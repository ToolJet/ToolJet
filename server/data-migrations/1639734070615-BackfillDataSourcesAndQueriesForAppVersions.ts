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
import { cloneDeep } from 'lodash';

export class BackfillDataSourcesAndQueriesForAppVersions1639734070615 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const organizations = await entityManager.find(Organization, {
      select: ['id', 'name'],
    });
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

    for (const appVersion of restAppVersions) {
      const oldDataSourceToNewMapping = {};
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

      const newDataQueries = [];
      const dataQueryMapping = {};
      for (const dataQuery of dataQueries) {
        const dataQueryParams = {
          name: dataQuery.name,
          kind: dataQuery.kind,
          options: cloneDeep(dataQuery.options),
          dataSourceId: oldDataSourceToNewMapping[dataQuery.dataSourceId],
          appId: dataQuery.appId,
          appVersionId: appVersion.id,
        };
        const newDataQuery = await entityManager.save(entityManager.create(DataQuery, { ...dataQueryParams }));
        newDataQueries.push(newDataQuery);
        dataQueryMapping[dataQuery.id] = newDataQuery.id;
      }
      for (const newQuery of newDataQueries) {
        const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, dataQueryMapping);
        newQuery.options = newOptions;
        await entityManager.save(newQuery);
      }
      appVersion.definition = this.replaceDataQueryIdWithinDefinitions(appVersion.definition, dataQueryMapping);
      await entityManager.save(appVersion);
    }
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

  replaceDataQueryOptionsWithNewDataQueryIds(options, dataQueryMapping) {
    if (options && options.events) {
      const replacedEvents = options.events.map((event) => {
        if (event.queryId) {
          event.queryId = dataQueryMapping[event.queryId];
        }
        return event;
      });
      options.events = replacedEvents;
    }
    return options;
  }

  replaceDataQueryIdWithinDefinitions(definition, dataQueryMapping) {
    if (definition?.components) {
      for (const id of Object.keys(definition.components)) {
        const component = definition.components[id].component;

        if (component?.definition?.events) {
          const replacedComponentEvents = component.definition.events.map((event) => {
            if (event.queryId) {
              event.queryId = dataQueryMapping[event.queryId];
            }
            return event;
          });
          component.definition.events = replacedComponentEvents;
        }

        if (component?.definition?.properties?.actions?.value) {
          for (const value of component.definition.properties.actions.value) {
            if (value?.events) {
              const replacedComponentActionEvents = value.events.map((event) => {
                if (event.queryId) {
                  event.queryId = dataQueryMapping[event.queryId];
                }
                return event;
              });
              value.events = replacedComponentActionEvents;
            }
          }
        }

        if (component?.component === 'Table') {
          for (const column of component?.definition?.properties?.columns?.value ?? []) {
            if (column?.events) {
              const replacedComponentActionEvents = column.events.map((event) => {
                if (event.queryId) {
                  event.queryId = dataQueryMapping[event.queryId];
                }
                return event;
              });
              column.events = replacedComponentActionEvents;
            }
          }
        }

        definition.components[id].component = component;
      }
    }
    return definition;
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
