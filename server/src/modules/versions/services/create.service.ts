import { Injectable } from '@nestjs/common';
import { AppEnvironment } from '@entities/app_environments.entity';
import { AppVersion } from '@entities/app_version.entity';
import { DataQuery } from '@entities/data_query.entity';
import { DataSource } from '@entities/data_source.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { EventHandler, Target } from '@entities/event_handler.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager, In } from 'typeorm';
import { Credential } from 'src/entities/credential.entity';
import * as uuid from 'uuid';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { Layout } from '@entities/layout.entity';
import { isEmpty, set } from 'lodash';
import { updateEntityReferences } from 'src/helpers/import_export.helpers';
import { AppResourceMappings } from '@modules/apps/types';
import { LayoutDimensionUnits } from '@modules/apps/constants';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { DataSourceScopes } from '@modules/data-sources/constants';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { IVersionsCreateService } from '../interfaces/services/ICreateService';
import { PagePermission } from '@entities/page_permissions.entity';
import { PageUser } from '@entities/page_users.entity';

@Injectable()
export class VersionsCreateService implements IVersionsCreateService {
  constructor(
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService,
    protected readonly dataSourceUtilService: DataSourcesUtilService,
    protected readonly dataSourceRepository: DataSourcesRepository,
    protected readonly dataQueryRepository: DataQueryRepository
  ) {}
  async setupNewVersion(
    appVersion: AppVersion,
    versionFrom: AppVersion,
    organizationId: string,
    manager: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      (appVersion.showViewerNavigation = versionFrom.showViewerNavigation),
        (appVersion.globalSettings = versionFrom.globalSettings),
        (appVersion.pageSettings = versionFrom.pageSettings);
      await manager.save(appVersion);

      const oldDataQueryToNewMapping = await this.createNewDataSourcesAndQueriesForVersion(
        appVersion,
        versionFrom,
        organizationId,
        manager
      );

      const { oldComponentToNewComponentMapping, oldPageToNewPageMapping } =
        await this.createNewPagesAndComponentsForVersion(manager, appVersion, versionFrom.id, versionFrom.homePageId);

      await this.updateEntityReferencesForNewVersion(manager, {
        componentsMapping: oldComponentToNewComponentMapping,
        dataQueryMapping: oldDataQueryToNewMapping,
      });

      if (appVersion.globalSettings) {
        const globalSettings = appVersion.globalSettings;
        const updatedGlobalSettings = updateEntityReferences(globalSettings, {
          ...oldDataQueryToNewMapping,
          ...oldComponentToNewComponentMapping,
        });
        await manager.update(AppVersion, { id: appVersion.id }, { globalSettings: updatedGlobalSettings });
      }

      await this.updateEventActionsForNewVersionWithNewMappingIds(
        manager,
        appVersion.id,
        oldDataQueryToNewMapping,
        oldComponentToNewComponentMapping,
        oldPageToNewPageMapping
      );
    }, manager);
  }

  protected async createNewDataSourcesAndQueriesForVersion(
    appVersion: AppVersion,
    versionFrom: AppVersion,
    organizationId: string,
    manager: EntityManager
  ) {
    const oldDataQueryToNewMapping = {};

    const appEnvironments: AppEnvironment[] = await this.appEnvironmentUtilService.getAll(
      organizationId,
      null,
      manager
    );

    if (!versionFrom) {
      //create default data sources
      for (const defaultSource of ['restapi', 'runjs', 'tooljetdb', 'workflows']) {
        const dataSource = await this.dataSourceRepository.createDefaultDataSource(
          defaultSource,
          appVersion.id,
          manager
        );
        await this.dataSourceUtilService.createDataSourceInAllEnvironments(organizationId, dataSource.id, manager);
      }
    } else {
      const globalQueries: DataQuery[] = await this.dataQueryRepository.getQueriesByVersionId(
        versionFrom.id,
        DataSourceScopes.GLOBAL,
        manager
      );
      const dataSources = versionFrom?.dataSources.filter((ds) => ds.scope == DataSourceScopes.LOCAL); //Local data sources
      const globalDataSources = [...new Map(globalQueries.map((gq) => [gq.dataSource.id, gq.dataSource])).values()];

      const dataSourceMapping = {};
      const newDataQueries = [];
      const allEvents = await manager.find(EventHandler, {
        where: { appVersionId: versionFrom?.id, target: Target.dataQuery },
      });

      if (dataSources?.length > 0 || globalDataSources?.length > 0) {
        if (dataSources?.length > 0) {
          for (const dataSource of dataSources) {
            const dataSourceParams: Partial<DataSource> = {
              name: dataSource.name,
              kind: dataSource.kind,
              type: dataSource.type,
              appVersionId: appVersion.id,
            };
            const newDataSource = await manager.save(manager.create(DataSource, dataSourceParams));
            dataSourceMapping[dataSource.id] = newDataSource.id;

            const dataQueries = versionFrom?.dataSources?.find((ds) => ds.id === dataSource.id).dataQueries;

            for (const dataQuery of dataQueries) {
              const dataQueryParams = {
                name: dataQuery.name,
                options: dataQuery.options,
                dataSourceId: newDataSource.id,
                appVersionId: appVersion.id,
              };
              const newQuery = await manager.save(manager.create(DataQuery, dataQueryParams));

              const dataQueryEvents = allEvents.filter((event) => event.sourceId === dataQuery.id);

              dataQueryEvents.forEach(async (event, index) => {
                const newEvent = new EventHandler();

                newEvent.id = uuid.v4();
                newEvent.name = event.name;
                newEvent.sourceId = newQuery.id;
                newEvent.target = event.target;
                newEvent.event = event.event;
                newEvent.index = event.index ?? index;
                newEvent.appVersionId = appVersion.id;

                await manager.save(newEvent);
              });

              oldDataQueryToNewMapping[dataQuery.id] = newQuery.id;
              newDataQueries.push(newQuery);
            }
          }
        }

        if (globalQueries?.length > 0) {
          for (const globalQuery of globalQueries) {
            const dataQueryParams = {
              name: globalQuery.name,
              options: globalQuery.options,
              dataSourceId: globalQuery.dataSourceId,
              appVersionId: appVersion.id,
            };

            const newQuery = await manager.save(manager.create(DataQuery, dataQueryParams));
            const dataQueryEvents = allEvents.filter((event) => event.sourceId === globalQuery.id);

            dataQueryEvents.forEach(async (event, index) => {
              const newEvent = new EventHandler();

              newEvent.id = uuid.v4();
              newEvent.name = event.name;
              newEvent.sourceId = newQuery.id;
              newEvent.target = event.target;
              newEvent.event = event.event;
              newEvent.index = event.index ?? index;
              newEvent.appVersionId = appVersion.id;

              await manager.save(newEvent);
            });
            oldDataQueryToNewMapping[globalQuery.id] = newQuery.id;
            newDataQueries.push(newQuery);
          }
        }

        for (const newQuery of newDataQueries) {
          const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(
            newQuery.options,
            oldDataQueryToNewMapping
          );
          newQuery.options = newOptions;

          await manager.save(newQuery);
        }

        appVersion.definition = this.replaceDataQueryIdWithinDefinitions(
          appVersion.definition,
          oldDataQueryToNewMapping
        );
        await manager.save(appVersion);

        for (const appEnvironment of appEnvironments) {
          for (const dataSource of dataSources) {
            const dataSourceOption = await manager.findOneOrFail(DataSourceOptions, {
              where: { dataSourceId: dataSource.id, environmentId: appEnvironment.id },
            });

            const convertedOptions = this.convertToArrayOfKeyValuePairs(dataSourceOption.options);
            const newOptions = await this.dataSourceUtilService.parseOptionsForCreate(convertedOptions, false, manager);
            await this.setNewCredentialValueFromOldValue(newOptions, convertedOptions, manager);

            await manager.save(
              manager.create(DataSourceOptions, {
                options: newOptions,
                dataSourceId: dataSourceMapping[dataSource.id],
                environmentId: appEnvironment.id,
              })
            );
          }
        }
      }
    }

    return oldDataQueryToNewMapping;
  }

  protected replaceDataQueryOptionsWithNewDataQueryIds(options, dataQueryMapping) {
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

  protected replaceDataQueryIdWithinDefinitions(definition, dataQueryMapping) {
    if (definition?.pages) {
      for (const pageId of Object.keys(definition?.pages)) {
        if (definition.pages[pageId].events) {
          const replacedPageEvents = definition.pages[pageId].events.map((event) => {
            if (event.queryId) {
              event.queryId = dataQueryMapping[event.queryId];
            }
            return event;
          });
          definition.pages[pageId].events = replacedPageEvents;
        }
        if (definition.pages[pageId].components) {
          for (const id of Object.keys(definition.pages[pageId].components)) {
            const component = definition.pages[pageId].components[id].component;

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

            definition.pages[pageId].components[id].component = component;
          }
        }
      }
    }
    return definition;
  }

  protected convertToArrayOfKeyValuePairs(options): Array<object> {
    if (!options) return;
    return Object.keys(options).map((key) => {
      return {
        key: key,
        value: options[key]['value'],
        encrypted: options[key]['encrypted'],
        credential_id: options[key]['credential_id'],
      };
    });
  }

  protected async setNewCredentialValueFromOldValue(newOptions: any, oldOptions: any, manager: EntityManager) {
    const newOptionsWithCredentials = this.convertToArrayOfKeyValuePairs(newOptions).filter((opt) => opt['encrypted']);

    for (const newOption of newOptionsWithCredentials) {
      const oldOption = oldOptions.find((oldOption) => oldOption['key'] == newOption['key']);
      const oldCredential = await manager.findOne(Credential, {
        where: { id: oldOption.credential_id },
      });
      const newCredential = await manager.findOne(Credential, {
        where: { id: newOption['credential_id'] },
      });
      newCredential.valueCiphertext = oldCredential.valueCiphertext;

      await manager.save(newCredential);
    }
  }

  protected async createNewPagesAndComponentsForVersion(
    manager: EntityManager,
    appVersion: AppVersion,
    versionFromId: string,
    prevHomePagePage: string
  ) {
    const pages = await manager
      .createQueryBuilder(Page, 'page')
      .leftJoinAndSelect('page.components', 'component')
      .leftJoinAndSelect('component.layouts', 'layout')
      .where('page.appVersionId = :appVersionId', { appVersionId: versionFromId })
      .getMany();

    const allEvents = await manager.find(EventHandler, {
      where: { appVersionId: versionFromId },
    });

    let homePageId = prevHomePagePage;

    const newComponents = [];
    const newComponentLayouts = [];
    const oldComponentToNewComponentMapping = {};
    const oldPageToNewPageMapping = {};

    const isChildOfTabsOrCalendar = (component, allComponents = [], componentParentId = undefined) => {
      if (componentParentId) {
        const parentId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];

        const parentComponent = allComponents.find((comp) => comp.id === parentId);

        if (parentComponent) {
          return parentComponent.type === 'Tabs' || parentComponent.type === 'Calendar';
        }
      }

      return false;
    };

    const isChildOfKanbanModal = (componentParentId: string, allComponents = []) => {
      if (!componentParentId.includes('modal')) return false;

      if (componentParentId) {
        const parentId = componentParentId.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];
        const isParentKandban = allComponents.find((comp) => comp.id === parentId)?.type === 'Kanban';

        return isParentKandban;
      }
    };

    for (const page of pages) {
      const savedPage = await manager.save(
        manager.create(Page, {
          name: page.name,
          handle: page.handle,
          index: page.index,
          disabled: page.disabled,
          hidden: page.hidden,
          appVersionId: appVersion.id,
        })
      );
      oldPageToNewPageMapping[page.id] = savedPage.id;
      if (page.id === prevHomePagePage) {
        homePageId = savedPage.id;
      }

      const oldPermissions = await manager.find(PagePermission, {
        where: { pageId: page.id },
      });

      const newPermissions = oldPermissions.map((permission) => {
        return manager.create(PagePermission, {
          ...permission,
          id: undefined,
          pageId: oldPageToNewPageMapping[permission.pageId],
        });
      });

      await manager.save(PagePermission, newPermissions);

      const permissionIdMap = new Map<string, string>();
      oldPermissions.forEach((oldPerm, index) => {
        const newPerm = newPermissions[index];
        permissionIdMap.set(oldPerm.id, newPerm.id);
      });

      const oldPermissionIds = oldPermissions.map((p) => p.id);

      const oldPageUsers = await manager.find(PageUser, {
        where: {
          pagePermissionsId: In(oldPermissionIds),
        },
      });

      const newPageUsers = oldPageUsers.map((pu) =>
        manager.create(PageUser, {
          ...pu,
          id: undefined,
          pagePermissionsId: permissionIdMap.get(pu.pagePermissionsId),
        })
      );

      await manager.save(PageUser, newPageUsers);

      const pageEvents = allEvents.filter((event) => event.sourceId === page.id);

      pageEvents.forEach(async (event, index) => {
        const newEvent = new EventHandler();

        newEvent.id = uuid.v4();
        newEvent.name = event.name;
        newEvent.sourceId = savedPage.id;
        newEvent.target = event.target;
        newEvent.event = event.event;
        newEvent.index = event.index ?? index;
        newEvent.appVersionId = appVersion.id;

        await manager.save(newEvent);
      });

      page.components.forEach(async (component) => {
        const newComponent = new Component();
        const componentEvents = allEvents.filter((event) => event.sourceId === component.id);

        newComponent.id = uuid.v4();

        oldComponentToNewComponentMapping[component.id] = newComponent.id;

        let parentId = component.parent ? component.parent : null;

        const isParentTabOrCalendar = isChildOfTabsOrCalendar(component, page.components, parentId);

        if (isParentTabOrCalendar) {
          const childTabId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[2];
          const _parentId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];
          const mappedParentId = oldComponentToNewComponentMapping[_parentId];

          parentId = `${mappedParentId}-${childTabId}`;
        } else {
          parentId = oldComponentToNewComponentMapping[parentId];
        }

        newComponent.name = component.name;
        newComponent.type = component.type;
        newComponent.pageId = savedPage.id;
        newComponent.properties = component.properties;
        newComponent.styles = component.styles;
        newComponent.validation = component.validation;
        newComponent.general = component.general;
        newComponent.generalStyles = component.generalStyles;
        newComponent.displayPreferences = component.displayPreferences;
        newComponent.parent = component.parent;
        newComponent.page = savedPage;

        newComponents.push(newComponent);

        component.layouts.forEach((layout) => {
          const newLayout = new Layout();
          newLayout.id = uuid.v4();
          newLayout.type = layout.type;
          newLayout.top = layout.top;
          newLayout.left = layout.left;
          newLayout.width = layout.width;
          newLayout.height = layout.height;
          newLayout.componentId = layout.componentId;
          newLayout.dimensionUnit = LayoutDimensionUnits.COUNT;

          newLayout.component = newComponent;

          newComponentLayouts.push(newLayout);
        });

        componentEvents.forEach(async (event, index) => {
          const newEvent = new EventHandler();

          newEvent.id = uuid.v4();
          newEvent.name = event.name;
          newEvent.sourceId = newComponent.id;
          newEvent.target = event.target;
          newEvent.event = event.event;
          newEvent.index = event.index ?? index;
          newEvent.appVersionId = appVersion.id;

          await manager.save(newEvent);
        });
      });
      newComponents.forEach((component) => {
        let parentId = component.parent ? component.parent : null;
        // re establish mapping relationship
        if (component?.properties?.buttonToSubmit) {
          const newButtonToSubmitValue =
            oldComponentToNewComponentMapping[component?.properties?.buttonToSubmit?.value];
          if (newButtonToSubmitValue) set(component, 'properties.buttonToSubmit.value', newButtonToSubmitValue);
        }

        if (!parentId) return;

        const isParentTabOrCalendar = isChildOfTabsOrCalendar(component, page.components, parentId);

        if (isParentTabOrCalendar) {
          const childTabId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[2];
          const _parentId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];
          const mappedParentId = oldComponentToNewComponentMapping[_parentId];

          parentId = `${mappedParentId}-${childTabId}`;
        } else if (isChildOfKanbanModal(component.parent, page.components)) {
          const _parentId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];
          const mappedParentId = oldComponentToNewComponentMapping[_parentId];

          parentId = `${mappedParentId}-modal`;
        } else {
          parentId = oldComponentToNewComponentMapping[parentId];
        }

        component.parent = parentId;
      });

      await manager.save(newComponents);
      await manager.save(newComponentLayouts);
    }

    await manager.update(AppVersion, { id: appVersion.id }, { homePageId });

    return { oldComponentToNewComponentMapping, oldPageToNewPageMapping };
  }

  protected async updateEntityReferencesForNewVersion(manager: EntityManager, resourceMapping: AppResourceMappings) {
    const mappings = { ...resourceMapping.componentsMapping, ...resourceMapping.dataQueryMapping };
    const newComponentIds = Object.values(resourceMapping.componentsMapping);
    const newQueriesIds = Object.values(resourceMapping.dataQueryMapping);

    if (newComponentIds.length > 0) {
      const components = await manager
        .createQueryBuilder(Component, 'components')
        .where('components.id IN(:...componentIds)', { componentIds: newComponentIds })
        .select([
          'components.id',
          'components.properties',
          'components.styles',
          'components.general',
          'components.validation',
          'components.generalStyles',
          'components.displayPreferences',
        ])
        .getMany();

      const toUpdateComponents = components.filter((component) => {
        return updateEntityReferences(component, mappings);
      });

      if (!isEmpty(toUpdateComponents)) {
        await manager.save(toUpdateComponents);
      }
    }

    if (newQueriesIds.length > 0) {
      const dataQueries = await manager
        .createQueryBuilder(DataQuery, 'dataQueries')
        .where('dataQueries.id IN(:...dataQueryIds)', { dataQueryIds: newQueriesIds })
        .select(['dataQueries.id', 'dataQueries.options'])
        .getMany();

      const toUpdateDataQueries = dataQueries.filter((dataQuery) => {
        return updateEntityReferences(dataQuery, mappings);
      });

      if (!isEmpty(toUpdateDataQueries)) {
        await manager.save(toUpdateDataQueries);
      }
    }
  }

  protected async updateEventActionsForNewVersionWithNewMappingIds(
    manager: EntityManager,
    versionId: string,
    oldDataQueryToNewMapping: Record<string, unknown>,
    oldComponentToNewComponentMapping: Record<string, unknown>,
    oldPageToNewPageMapping: Record<string, unknown>
  ) {
    const allEvents = await manager.find(EventHandler, {
      where: { appVersionId: versionId },
    });

    const mappings = { ...oldDataQueryToNewMapping, ...oldComponentToNewComponentMapping } as Record<string, string>;

    for (const event of allEvents) {
      const eventDefinition = updateEntityReferences(event.event, mappings);

      if (eventDefinition?.actionId === 'run-query') {
        eventDefinition.queryId = oldDataQueryToNewMapping[eventDefinition.queryId];
      }

      if (eventDefinition?.actionId === 'control-component') {
        eventDefinition.componentId = oldComponentToNewComponentMapping[eventDefinition.componentId];
      }

      if (eventDefinition?.actionId === 'switch-page') {
        eventDefinition.pageId = oldPageToNewPageMapping[eventDefinition.pageId];
      }

      if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'close-modal') {
        eventDefinition.modal = oldComponentToNewComponentMapping[eventDefinition.modal];
      }

      if (eventDefinition?.actionId === 'set-table-page') {
        eventDefinition.table = oldComponentToNewComponentMapping[eventDefinition.table];
      }
      event.event = eventDefinition;

      await manager.save(event);
    }
  }
}
