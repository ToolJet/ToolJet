import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import { Component } from 'src/entities/component.entity';
import { Page } from 'src/entities/page.entity';
import { Layout } from 'src/entities/layout.entity';
import { EventHandler, Target } from 'src/entities/event_handler.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { MigrationProgress, processDataInBatches } from 'src/helpers/utils.helper';

export class MigrateAppsDefinitionSchemaTransition1697473340856 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // let progress = 0;
    const entityManager = queryRunner.manager;
    const appVersionRepository = entityManager.getRepository(AppVersion);
    const appVersions = await appVersionRepository.find();
    const totalApps = appVersions.length;

    const migrationProgress = new MigrationProgress('MigrateAppsDefinitionSchemaTransition1697473340856', totalApps);

    const batchSize = 100; // Number of apps to migrate at a time

    await processDataInBatches(
      entityManager,
      async (entityManager, skip, take) => {
        return entityManager.find(AppVersion, {
          where: { id: In(appVersions.map((appVersion) => appVersion.id)) },
          take,
          skip,
        });
      },
      async (entityManager, versions: AppVersion[]) => {
        for (const version of versions) {
          const definition = version['definition'];

          if (!definition) return;

          const dataQueriesRepository = entityManager.getRepository(DataQuery);
          const dataQueries = await dataQueriesRepository.find({
            where: { appVersionId: version.id },
          });

          let updateHomepageId = null;

          if (definition?.pages) {
            for (const pageId of Object.keys(definition?.pages)) {
              const page = definition.pages[pageId];
              const pageEvents = page.events || [];
              const componentEvents = [];
              const pagePositionInTheList = Object.keys(definition?.pages).indexOf(pageId);
              const isHomepage = (definition['homePageId'] as any) === pageId;
              const pageComponents = page.components;
              const componentLayouts = [];
              const mappedComponents = this.transformComponentData(pageComponents, componentEvents);
              const newPage = entityManager.create(Page, {
                name: page.name,
                handle: page.handle,
                appVersionId: version.id,
                disabled: page.disabled || false,
                hidden: page.hidden || false,
                index: pagePositionInTheList,
              });

              const pageCreated = await entityManager.save(newPage);
              mappedComponents.forEach((component) => {
                component.page = pageCreated;
              });

              const savedComponents = await entityManager.save(Component, mappedComponents);

              savedComponents.forEach((component) => {
                const componentLayout = pageComponents[component.id]['layouts'];

                if (componentLayout) {
                  for (const type in componentLayout) {
                    const layout = componentLayout[type];
                    const newLayout = new Layout();
                    newLayout.type = type;
                    newLayout.top = layout.top;
                    newLayout.left = layout.left;
                    newLayout.width = layout.width;
                    newLayout.height = layout.height;
                    newLayout.component = component;
                    componentLayouts.push(newLayout);
                  }
                }
              });

              await entityManager.save(Layout, componentLayouts);

              if (pageEvents.length > 0) {
                pageEvents.forEach(async (event, index) => {
                  const newEvent = {
                    name: event.eventId,
                    sourceId: pageCreated.id,
                    target: Target.page,
                    event: event,
                    index: pageEvents.index || index,
                    appVersionId: version.id,
                  };

                  await entityManager.save(EventHandler, newEvent);
                });
              }

              componentEvents.forEach((eventObj) => {
                if (eventObj.event?.length === 0) return;

                eventObj.event.forEach(async (event, index) => {
                  const newEvent = {
                    name: event.eventId,
                    sourceId: eventObj.componentId,
                    target: Target.component,
                    event: event,
                    index: eventObj.index || index,
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
                        name: event.eventId,
                        sourceId: component.id,
                        target: Target.tableColumn,
                        event: { ...event, ref: column.name },
                        index: event.index ?? index,
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
                  name: event.eventId,
                  sourceId: dataQuery.id,
                  target: Target.dataQuery,
                  event: event,
                  index: queryEvents.index || index,
                  appVersionId: version.id,
                };

                await entityManager.save(EventHandler, newEvent);
              });
            }
          }

          migrationProgress.show();
          await entityManager.update(
            AppVersion,
            { id: version.id },
            {
              homePageId: updateHomepageId,
              showViewerNavigation: definition?.showViewerNavigation || true,
              globalSettings: definition.globalSettings,
            }
          );
        }
      },
      batchSize
    );
  }

  private transformComponentData(data: object, componentEvents: any[]): Component[] {
    const transformedComponents: Component[] = [];

    for (const componentId in data) {
      const componentData = data[componentId]['component'];

      const transformedComponent: Component = new Component();

      transformedComponent.id = componentId;
      transformedComponent.name = componentData.name;
      transformedComponent.type = componentData.component;
      transformedComponent.properties = componentData.definition.properties || {};
      transformedComponent.styles = componentData.definition.styles || {};
      transformedComponent.validation = componentData.definition.validation || {};
      transformedComponent.parent = data[componentId].parent || null;
      transformedComponents.push(transformedComponent);

      componentEvents.push({
        componentId: componentId,
        event: componentData.definition.events,
      });
    }

    return transformedComponents;
  }

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
