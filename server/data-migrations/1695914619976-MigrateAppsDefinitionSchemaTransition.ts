import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import { Component } from 'src/entities/component.entity';
import { Page } from 'src/entities/page.entity';
import { Layout } from 'src/entities/layout.entity';
import { EventHandler, Target } from 'src/entities/event_handler.entity';

export class MigrateAppsDefinitionSchemaTransition1695914619976 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    let progress = 0;

    const entityManager = queryRunner.manager;

    const queryBuilder = queryRunner.connection.createQueryBuilder();

    const appVersionRepository = entityManager.getRepository(AppVersion);

    const appVersions = await appVersionRepository.find();

    console.log(`MigrateAppsDefinitionSchemaTransition1695902112489 Progress ${progress} %`);

    for (const version of appVersions) {
      progress++;
      const definition = version['definition'];

      const dataQueries = await queryBuilder
        .select()
        .from('data_queries', 'data_queries')
        .where('app_version_id = :appVersionId', { appVersionId: version.id })
        .getRawMany();

      let updateHomepageId = null;

      if (definition?.pages) {
        for (const pageId of Object.keys(definition?.pages)) {
          const page = definition.pages[pageId];

          const pageEvents = page.events || [];

          const componentEvents = [];

          const pagePostionIntheList = Object.keys(definition?.pages).indexOf(pageId);

          const isHompage = (definition['homePageId'] as any) === pageId;

          const pageComponents = page.components;

          const componentLayouts = [];

          const mappedComponents = this.transformComponentData(pageComponents, componentEvents);

          const newPage = entityManager.create(Page, {
            name: page.name,
            handle: page.handle,
            appVersionId: version.id,
            disabled: page.disabled || false,
            hidden: page.hidden || false,
            index: pagePostionIntheList,
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

          if (isHompage) {
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
      console.log(
        `MigrateAppsDefinitionSchemaTransition1695902112489 Progress ${Math.round(
          (progress / appVersions.length) * 100
        )} %`
      );
      await entityManager.update(
        AppVersion,
        { id: version.id },
        {
          homePageId: updateHomepageId,
          showViewerNavigation: definition.showViewerNavigation || true,
          globalSettings: definition.globalSettings,
        }
      );
    }
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
