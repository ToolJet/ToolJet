import { NestFactory } from '@nestjs/core';
import { DataSourcesService } from 'src/services/data_sources.service';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
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

    const dataSources = await entityManager.query(
      'select * from data_sources where app_id = $1 and app_version_id IS NULL',
      [app.id]
    );

    const dataQueries = await entityManager.query(
      'select * from data_queries where app_id = $1 and app_version_id IS NULL',
      [app.id]
    );

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
    dataSources: any[],
    dataQueries: any[],
    entityManager: EntityManager
  ) {
    if (!firstAppVersion) return;

    for (const dataSource of dataSources) {
      await entityManager.update(DataSource, dataSource.id, {
        appVersionId: firstAppVersion.id,
      });
    }

    if (dataQueries?.length) {
      await entityManager.query(
        `update data_queries set app_version_id = $1 where id IN(${dataQueries.map((dq) => `'${dq.id}'`)?.join()})`,
        [firstAppVersion.id]
      );
    }
  }

  async createNewDataSourcesAndQueriesForVersions(
    restAppVersions: AppVersion[],
    dataSources,
    dataQueries,
    entityManager: EntityManager,
    dataSourcesService: DataSourcesService
  ) {
    if (restAppVersions.length == 0) return;

    for (const appVersion of restAppVersions) {
      const oldDataSourceToNewMapping = {};
      for (const dataSource of dataSources) {
        const convertedOptions = this.convertToArrayOfKeyValuePairs(dataSource.options);
        const newOptions = await dataSourcesService.parseOptionsForCreate(convertedOptions, false, entityManager);
        await this.setNewCredentialValueFromOldValue(newOptions, convertedOptions, entityManager);

        const newDataSource = await entityManager.query(
          'insert into data_sources (name, kind, options, app_id, app_version_id) values ($1, $2, $3, $4, $5) returning "id"',
          [dataSource.name, dataSource.kind, newOptions, dataSource.app_id, appVersion.id]
        );

        oldDataSourceToNewMapping[dataSource.id] = newDataSource[0].id;
      }

      const newDataQueries = [];
      const dataQueryMapping = {};
      for (const dataQuery of dataQueries) {
        const newDataQueryResult = await entityManager.query(
          'insert into data_queries (name, kind, options, data_source_id, app_id, app_version_id) values ($1, $2, $3, $4, $5, $6) returning *',
          [
            dataQuery.name,
            dataQuery.kind,
            cloneDeep(dataQuery.options),
            oldDataSourceToNewMapping[dataQuery.data_source_id],
            dataQuery.app_id,
            appVersion.id,
          ]
        );

        const newDataQuery = newDataQueryResult[0];
        newDataQueries.push(newDataQuery);
        dataQueryMapping[dataQuery.id] = newDataQuery.id;
      }
      for (const newQuery of newDataQueries) {
        const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, dataQueryMapping);
        newQuery.options = newOptions;

        await entityManager.query('update data_queries set options = $1 where id = $2', [newOptions, newQuery.id]);
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
