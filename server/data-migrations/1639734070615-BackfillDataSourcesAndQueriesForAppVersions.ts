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

    const dataSources = await entityManager
      .createQueryBuilder()
      .select()
      .from('data_sources', 'data_sources')
      .where('data_sources.app_id = :id', { id: app.id })
      .andWhere('data_sources.app_version_id IS NULL')
      .getRawMany();

    const dataQueries = await entityManager
      .createQueryBuilder()
      .select()
      .from('data_queries', 'data_queries')
      .where('data_queries.app_id = :id', { id: app.id })
      .andWhere('data_queries.app_version_id IS NULL')
      .getRawMany();

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

    if (dataQueries?.length) {
      await entityManager
        .createQueryBuilder()
        .update('data_queries')
        .set({
          app_version_id: firstAppVersion.id,
        })
        .where('id IN(:idList)', { idList: dataQueries.map((dq) => dq.id) })
        .execute();
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

        const dataSourceParams = {
          name: dataSource.name,
          kind: dataSource.kind,
          options: newOptions,
          app_id: dataSource.app_id,
          app_version_id: appVersion.id,
        };

        const newDataSource = await entityManager
          .createQueryBuilder()
          .insert()
          .into('data_sources')
          .values(dataSourceParams)
          .execute();

        oldDataSourceToNewMapping[dataSource.id] = newDataSource.generatedMaps[0].id;
      }

      const newDataQueries = [];
      const dataQueryMapping = {};
      for (const dataQuery of dataQueries) {
        const dataQueryParams = {
          name: dataQuery.name,
          kind: dataQuery.kind,
          options: cloneDeep(dataQuery.options),
          data_source_id: oldDataSourceToNewMapping[dataQuery.data_source_id],
          app_id: dataQuery.app_id,
          app_version_id: appVersion.id,
        };
        const newDataQueryResult = await entityManager
          .createQueryBuilder()
          .insert()
          .into('data_queries')
          .values(dataQueryParams)
          .execute();

        const newDataQuery = newDataQueryResult.generatedMaps[0];
        newDataQueries.push(newDataQuery);
        dataQueryMapping[dataQuery.id] = newDataQuery.id;
      }
      for (const newQuery of newDataQueries) {
        const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, dataQueryMapping);
        newQuery.options = newOptions;

        await entityManager
          .createQueryBuilder()
          .update('data_queries')
          .set({ options: newOptions })
          .where({ id: newQuery.id })
          .execute();
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
