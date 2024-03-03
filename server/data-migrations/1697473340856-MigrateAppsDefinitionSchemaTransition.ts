import { In, MigrationInterface, QueryRunner, EntityManager } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import { Component } from 'src/entities/component.entity';
import { Page } from 'src/entities/page.entity';
import { Layout } from 'src/entities/layout.entity';
import { EventHandler, Target } from 'src/entities/event_handler.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { MigrationProgress, processDataInBatches } from 'src/helpers/utils.helper';
import { v4 as uuid } from 'uuid';

interface AppResourceMappings {
  pagesMapping: Record<string, string>;
  componentsMapping: Record<string, string>;
}

export class MigrateAppsDefinitionSchemaTransition1697473340856 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersionRepository = entityManager.getRepository(AppVersion);
    const appVersions = await appVersionRepository.find();
    const totalVersions = appVersions.length;

    const migrationProgress = new MigrationProgress(
      'MigrateAppsDefinitionSchemaTransition1697473340856',
      totalVersions
    );

    const batchSize = 100; // Number of apps to migrate at a time

    await processDataInBatches(
      entityManager,
      async (entityManager: EntityManager, skip: number, take: number) => {
        return entityManager.find(AppVersion, {
          where: { id: In(appVersions.map((appVersion) => appVersion.id)) },
          take,
          skip,
        });
      },
      async (entityManager: EntityManager, versions: AppVersion[]) => {
        await this.processVersions(entityManager, versions, migrationProgress);
      },
      batchSize
    );
  }

  private async processVersions(
    entityManager: EntityManager,
    versions: AppVersion[],
    migrationProgress: MigrationProgress
  ) {
    for (const version of versions) {
      const definition = version['definition'];

      if (!definition) return;

      const dataQueriesRepository = entityManager.getRepository(DataQuery);
      const dataQueries = await dataQueriesRepository.find({
        where: { appVersionId: version.id },
      });

      let updateHomepageId = null;

      const appResourceMappings: AppResourceMappings = {
        pagesMapping: {},
        componentsMapping: {},
      };
      if (definition?.pages) {
        for (const pageId of Object.keys(definition?.pages)) {
          const page = definition.pages[pageId];
          const pagePositionInTheList = Object.keys(definition?.pages).indexOf(pageId);
          const pageEvents = page.events || [];
          const pageComponents = page.components;

          const isHomepage = (definition['homePageId'] as any) === pageId;

          const componentEvents = [];
          const componentLayouts = [];
          const transformedComponents = this.transformComponentData(
            pageComponents,
            componentEvents,
            appResourceMappings.componentsMapping
          );

          const newPage = entityManager.create(Page, {
            name: page.name || page.handle || pageId,
            handle: page.handle || pageId,
            appVersionId: version.id,
            disabled: page.disabled || false,
            hidden: page.hidden || false,
            index: pagePositionInTheList,
          });

          const pageCreated = await entityManager.save(newPage);

          appResourceMappings.pagesMapping[pageId] = pageCreated.id;

          transformedComponents.forEach((component) => {
            component.page = pageCreated;
          });

          const savedComponents = await entityManager.save(Component, transformedComponents);

          for (const componentId in pageComponents) {
            const componentLayout = pageComponents[componentId]['layouts'];

            if (componentLayout && appResourceMappings.componentsMapping[componentId]) {
              for (const type in componentLayout) {
                const layout = componentLayout[type];
                const newLayout = new Layout();
                newLayout.type = type;
                newLayout.top = layout.top;
                newLayout.left = layout.left;
                newLayout.width = layout.width;
                newLayout.height = layout.height;
                newLayout.componentId = appResourceMappings.componentsMapping[componentId];

                componentLayouts.push(newLayout);
              }
            }
          }

          await entityManager.save(Layout, componentLayouts);

          if (pageEvents.length > 0) {
            pageEvents.forEach(async (event, index) => {
              const newEvent = {
                name: event.eventId || `${pageCreated.name} Page Event ${index}`,
                sourceId: pageCreated.id,
                target: Target.page,
                event: event,
                index: index,
                appVersionId: version.id,
              };

              await entityManager.save(EventHandler, newEvent);
            });
          }

          componentEvents.forEach((eventObj) => {
            if (eventObj.event?.length === 0) return;

            eventObj.event.forEach(async (event, index) => {
              const newEvent = {
                name: event.eventId || `event ${index}`,
                sourceId: appResourceMappings.componentsMapping[eventObj.componentId],
                target: Target.component,
                event: event,
                index: index,
                appVersionId: version.id,
              };

              await entityManager.save(EventHandler, newEvent);
            });
          });

          savedComponents.forEach(async (component) => {
            if (component.type === 'Table') {
              const tableActions = component.properties?.actions?.value || [];
              const tableColumns = component.properties?.columns?.value || [];
              const tableActionAndColumnEvents = [];

              tableActions.forEach((action) => {
                const actionEvents = action.events || [];

                actionEvents.forEach((event, index) => {
                  tableActionAndColumnEvents.push({
                    name: event.eventId,
                    sourceId: component.id,
                    target: Target.tableAction,
                    event: { ...event, ref: action.name },
                    index: event.index ?? index,
                    appVersionId: version.id,
                  });
                });
              });

              tableColumns.forEach((column) => {
                if (column?.columnType !== 'toggle') return;
                const columnEvents = column.events || [];

                columnEvents.forEach((event, index) => {
                  tableActionAndColumnEvents.push({
                    name: event.eventId || `event ${index}`,
                    sourceId: component.id,
                    target: Target.tableColumn,
                    event: { ...event, ref: column.name },
                    index: index,
                    appVersionId: version.id,
                  });
                });
              });

              await entityManager.save(EventHandler, tableActionAndColumnEvents);
            }
          });

          if (isHomepage) {
            updateHomepageId = pageCreated.id;
          }
        }
      }

      for (const dataQuery of dataQueries) {
        const queryEvents = dataQuery?.options?.events || [];

        if (queryEvents.length > 0) {
          queryEvents.forEach(async (event, index) => {
            const newEvent = {
              name: event.eventId || `${dataQuery.name} Query Event ${index}`,
              sourceId: dataQuery.id,
              target: Target.dataQuery,
              event: event,
              index: index,
              appVersionId: version.id,
            };

            await entityManager.save(EventHandler, newEvent);
          });
        }
      }

      let globalSettings = definition?.globalSettings;
      if (!definition?.globalSettings) {
        globalSettings = {
          hideHeader: false,
          appInMaintenance: false,
          canvasMaxWidth: 100,
          canvasMaxWidthType: '%',
          canvasMaxHeight: 2400,
          canvasBackgroundColor: '#edeff5',
          backgroundFxQuery: '',
        };
      }

      await entityManager.update(
        AppVersion,
        { id: version.id },
        {
          homePageId: updateHomepageId,
          showViewerNavigation: definition?.showViewerNavigation || true,
          globalSettings: globalSettings,
        }
      );

      await this.updateEventActionsForNewVersionWithNewMappingIds(
        entityManager,
        version.id,
        appResourceMappings.componentsMapping,
        appResourceMappings.pagesMapping
      );

      migrationProgress.show();
    }
  }

  async updateEventActionsForNewVersionWithNewMappingIds(
    manager: EntityManager,
    versionId: string,
    oldComponentToNewComponentMapping: Record<string, unknown>,
    oldPageToNewPageMapping: Record<string, unknown>
  ) {
    const allEvents = await manager.find(EventHandler, {
      where: { appVersionId: versionId },
    });

    if (!allEvents || allEvents.length === 0) return;

    for (const event of allEvents) {
      const eventDefinition = event.event;

      if (eventDefinition?.actionId === 'switch-page') {
        eventDefinition.pageId = oldPageToNewPageMapping[eventDefinition.pageId];
      }

      if (eventDefinition?.actionId === 'control-component') {
        eventDefinition.componentId = oldComponentToNewComponentMapping[eventDefinition.componentId];
      }

      if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'close-modal') {
        eventDefinition.modal = oldComponentToNewComponentMapping[eventDefinition.modal];
      }

      event.event = eventDefinition;

      await manager.save(event);
    }
  }

  private transformComponentData(
    data: object,
    componentEvents: any[],
    componentsMapping: Record<string, string>
  ): Component[] {
    if (!data) return [];

    const transformedComponents: Component[] = [];

    const allComponents = Object.keys(data).map((key) => {
      return {
        id: key,
        ...data[key],
      };
    });

    if (!allComponents || allComponents.length === 0) return [];

    for (const componentId in data) {
      const component = data[componentId];

      if (!component) return;

      const componentData = component['component'];

      if (!componentData?.component) return;

      let skipComponent = false;
      const transformedComponent: Component = new Component();

      let parentId = component.parent ? component.parent : null;

      const isParentTabOrCalendar = this.isChildOfTabsOrCalendar(component, allComponents, parentId);

      if (isParentTabOrCalendar) {
        const childTabId = component?.parent.split('-')[component?.parent.split('-').length - 1];
        const _parentId = component?.parent?.split('-').slice(0, -1).join('-');
        const mappedParentId = componentsMapping[_parentId];

        parentId = `${mappedParentId}-${childTabId}`;
      } else {
        if (component.parent && !componentsMapping[parentId]) {
          skipComponent = true;
        }
        parentId = componentsMapping[parentId];
      }

      if (!skipComponent) {
        transformedComponent.id = uuid();
        transformedComponent.name = componentData.name || componentId;
        transformedComponent.type = componentData.component;
        transformedComponent.properties = componentData?.definition?.properties || {};
        transformedComponent.styles = componentData?.definition?.styles || {};
        transformedComponent.validation = componentData?.definition?.validation || {};
        transformedComponent.general = componentData?.definition?.general || {};
        transformedComponent.generalStyles = componentData?.definition?.generalStyles || {};
        transformedComponent.displayPreferences = componentData?.definition?.others || {};
        transformedComponent.parent = component?.parent ? parentId : null;

        transformedComponents.push(transformedComponent);

        componentEvents.push({
          componentId: componentId,
          event: componentData?.definition?.events || [],
        });
        componentsMapping[componentId] = transformedComponent.id;
      }
    }

    return transformedComponents;
  }

  isChildOfTabsOrCalendar = (component, allComponents = [], componentParentId = undefined) => {
    if (componentParentId) {
      const parentId = component?.parent?.split('-').slice(0, -1).join('-');

      const parentComponent = allComponents.find((comp) => comp.id === parentId);

      if (parentComponent) {
        return parentComponent.component.component === 'Tabs' || parentComponent.component.component === 'Calendar';
      }
    }

    return false;
  };

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM page');
    await queryRunner.query('DELETE FROM component');
    await queryRunner.query('DELETE FROM layout');
    await queryRunner.query('DELETE FROM event_handler');

    await queryRunner.query('ALTER TABLE app_version DROP COLUMN IF EXISTS homePageId');
    await queryRunner.query('ALTER TABLE app_version DROP COLUMN IF EXISTS globalSettings');
    await queryRunner.query('ALTER TABLE app_version DROP COLUMN IF EXISTS showViewerNavigation');
  }
}
