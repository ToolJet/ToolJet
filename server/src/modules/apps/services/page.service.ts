import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Page } from '@entities/page.entity';
import { ComponentsService } from './component.service';
import { CreatePageDto, UpdatePageDto } from '../dto/page';
import { dbTransactionWrap, dbTransactionForAppVersionAssociationsUpdate } from 'src/helpers/database.helper';
import { EventsService } from './event.service';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { EventHandler } from 'src/entities/event_handler.entity';
import { updateEntityReferences } from 'src/helpers/import_export.helpers';
import { isEmpty } from 'class-validator';
import { PageHelperService } from './page.util.service';
import * as _ from 'lodash';
import * as uuid from 'uuid';
import { AppVersion } from '@entities/app_version.entity';
import { IPageService } from '../interfaces/services/IPageService';

@Injectable()
export class PageService implements IPageService {
  constructor(
    protected componentsService: ComponentsService,
    protected pageHelperService: PageHelperService,
    protected eventHandlerService: EventsService
  ) {}

  async findPagesForVersion(appVersionId: string, manager?: EntityManager): Promise<Page[]> {
    const allPages = await this.pageHelperService.fetchPages(appVersionId, manager);
    const pagesWithComponents = await Promise.all(
      allPages.map(async (page) => {
        const components = await this.componentsService.getAllComponents(page.id, manager);
        delete page.appVersionId;
        return { ...page, components, restricted: false };
      })
    );
    return pagesWithComponents;
  }

  async findOne(id: string): Promise<Page> {
    return dbTransactionWrap((manager) => {
      return manager.findOne(Page, { where: { id } });
    });
  }

  async createPage(page: CreatePageDto, appVersionId: string, organizationId: string): Promise<Page> {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager) => {
      const newPage = await this.pageHelperService.preparePageObject(page, appVersionId, organizationId);

      return await manager.save(Page, newPage);
    }, appVersionId);
  }

  async clonePage(pageId: string, appVersionId: string, organizationId: string) {
    await dbTransactionForAppVersionAssociationsUpdate(async (manager) => {
      const pageToClone = await manager.findOne(Page, {
        where: { id: pageId, appVersionId },
      });

      if (!pageToClone) {
        throw new Error('Page not found');
      }

      let pageName = `${pageToClone.name} (copy)`;
      let pageHandle = `${pageToClone.handle}-copy`;

      const allPages = await manager.find(Page, { where: { appVersionId } });

      const pageNameORHandleExists = allPages.filter((page) => {
        return page.name.includes(pageName) || page.handle.includes(pageHandle);
      });

      if (pageNameORHandleExists.length > 0) {
        pageName = `${pageToClone.name} (copy ${pageNameORHandleExists.length})`;
        pageHandle = `${pageToClone.handle}-copy-${pageNameORHandleExists.length}`;
      }

      const newPage = new Page();
      newPage.name = pageName;
      newPage.handle = pageHandle;
      newPage.index = pageToClone.index + 1;
      newPage.appVersionId = appVersionId;
      newPage.autoComputeLayout = true;
      newPage.type = pageToClone.type;
      newPage.icon = pageToClone.icon || 'IconFile';
      newPage.openIn = pageToClone.openIn;
      newPage.appId = pageToClone.appId;
      newPage.url = pageToClone.url;
      newPage.disabled = pageToClone.disabled;
      newPage.hidden = pageToClone.hidden;

      const clonedpage = await manager.save(newPage);

      await this.clonePageEventsAndComponents(pageId, clonedpage.id, manager);

      const pages = await this.findPagesForVersion(appVersionId, manager);
      const events = await this.eventHandlerService.findEventsForVersion(appVersionId, manager);

      return { pages, events };
    }, appVersionId);

    // Fetch pages and events separately after transaction completes
    const pages = await this.findPagesForVersion(appVersionId);
    const events = await this.eventHandlerService.findEventsForVersion(appVersionId);

    return { pages, events };
  }

  async clonePageEventsAndComponents(pageId: string, clonePageId: string, manager?: EntityManager) {
    const parseParentIdAndSuffix = (parentIdString: string) => {
      if (!parentIdString) {
        return { baseId: null, suffix: null };
      }
      const match = parentIdString.match(/([a-fA-F0-9-]{36})-(.+)/);
      if (match) {
        return { baseId: match[1], suffix: match[2] };
      }
      return { baseId: parentIdString, suffix: null };
    };

    const isChildOfHeaderOrFooter = (componentParentId: string) => {
      if (!componentParentId) return false;
      return componentParentId.endsWith('-header') || componentParentId.endsWith('-footer');
    };

    const isSpecialParentType = (originalComponent, allOriginalComponents = [], componentParentId = undefined) => {
      if (componentParentId) {
        const { baseId } = parseParentIdAndSuffix(componentParentId);
        if (!baseId) return false;

        const parentComponent = allOriginalComponents.find((comp) => comp.id === baseId);

        if (parentComponent) {
          return (
            parentComponent.type === 'Tabs' ||
            parentComponent.type === 'Calendar' ||
            parentComponent.type === 'Kanban' ||
            isChildOfHeaderOrFooter(componentParentId)
          );
        }
      }
      return false;
    };

    return dbTransactionWrap(async (manager: EntityManager) => {
      const pageComponents = await manager.find(Component, { where: { pageId } });
      const pageEvents = await this.eventHandlerService.findAllEventsWithSourceId(pageId);
      const componentsIdMap = {};
      const mappingsToUpdate = [];
      const clonedComponents: Component[] = [];
      const newComponentLayouts: Layout[] = [];

      for (const component of pageComponents) {
        const newComponentId = uuid.v4();
        componentsIdMap[component.id] = newComponentId;
      }

      await Promise.all(
        pageComponents.map(async (component) => {
          const newComponentId = componentsIdMap[component.id];

          const newComponent = manager.create(Component, {
            ...component,
            id: newComponentId,
            pageId: clonePageId,
            parent: null,
          });
          Object.assign(newComponent, {
            name: component.name,
            type: component.type,
            pageId: clonePageId,
            properties: component.properties,
            styles: component.styles,
            validation: component.validation,
            general: component.general,
            generalStyles: component.generalStyles,
            displayPreferences: component.displayPreferences,
          });

          clonedComponents.push(newComponent);

          if (component?.properties?.buttonToSubmit?.value) {
            mappingsToUpdate.push({
              component: newComponent,
              pathToUpdate: 'properties.buttonToSubmit.value',
              oldId: component.properties.buttonToSubmit.value,
            });
          }

          const componentLayouts = await manager.find(Layout, { where: { componentId: component.id } });
          // CORRECTED: Use manager.create(Layout, ...) to ensure entity instances are created
          const clonedLayouts = componentLayouts.map((layout) =>
            manager.create(Layout, {
              ...layout,
              id: undefined, // Let TypeORM generate a new ID
              componentId: newComponent.id,
            })
          );
          newComponentLayouts.push(...clonedLayouts);

          const clonedComponentEvents = await this.eventHandlerService.findAllEventsWithSourceId(component.id);
          const clonedEvents = clonedComponentEvents.map((event) => {
            const eventDefinition = updateEntityReferences(event.event, componentsIdMap);

            if (eventDefinition?.actionId === 'control-component' && eventDefinition?.componentId) {
              eventDefinition.componentId = componentsIdMap[eventDefinition.componentId];
            }
            if (
              (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'hide-modal') &&
              eventDefinition?.modal
            ) {
              eventDefinition.modal = componentsIdMap[eventDefinition.modal];
            }
            if (eventDefinition?.actionId === 'set-table-page' && eventDefinition?.table) {
              eventDefinition.table = componentsIdMap[eventDefinition.table];
            }

            const clonedEvent = new EventHandler();
            clonedEvent.event = eventDefinition;
            clonedEvent.index = event.index;
            clonedEvent.name = event.name;
            clonedEvent.sourceId = newComponent.id;
            clonedEvent.target = event.target;
            clonedEvent.appVersionId = event.appVersionId;

            return clonedEvent;
          });
          await manager.save(EventHandler, clonedEvents);
        })
      );

      await Promise.all(
        mappingsToUpdate.map(async (itemToUpdate) => {
          const { component, pathToUpdate: path, oldId } = itemToUpdate;
          const newId = componentsIdMap[oldId];
          if (newId) {
            _.set(component, path, newId);
          }
        })
      );

      await Promise.all(
        pageEvents.map(async (event) => {
          const eventDefinition = updateEntityReferences(event.event, componentsIdMap);

          if (eventDefinition?.actionId === 'control-component' && eventDefinition?.componentId) {
            eventDefinition.componentId = componentsIdMap[eventDefinition.componentId];
          }
          if (
            (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'hide-modal') &&
            eventDefinition?.modal
          ) {
            eventDefinition.modal = componentsIdMap[eventDefinition.modal];
          }
          if (eventDefinition?.actionId == 'set-table-page' && eventDefinition?.table) {
            eventDefinition.table = componentsIdMap[eventDefinition.table];
          }

          const clonedEvent = new EventHandler();
          clonedEvent.event = eventDefinition;
          clonedEvent.index = event.index;
          clonedEvent.name = event.name;
          clonedEvent.sourceId = clonePageId;
          clonedEvent.target = event.target;
          clonedEvent.appVersionId = event.appVersionId;

          await manager.save(EventHandler, clonedEvent);
        })
      );

      for (const component of clonedComponents) {
        const originalComponent = pageComponents.find((c) => componentsIdMap[c.id] === component.id);
        if (!originalComponent) {
          console.error(`Original component not found for cloned component ID: ${component.id}`);
          continue;
        }

        let parentId = originalComponent.parent ? originalComponent.parent : null;

        if (parentId) {
          const isParentIdSuffixed = isSpecialParentType(originalComponent, pageComponents, parentId);

          if (isParentIdSuffixed) {
            const { baseId: originalBaseParentId, suffix: originalParentSuffix } = parseParentIdAndSuffix(parentId);
            const mappedBaseParentId = componentsIdMap[originalBaseParentId];

            if (mappedBaseParentId) {
              parentId = `${mappedBaseParentId}-${originalParentSuffix}`;
            } else {
              parentId = null;
            }
          } else {
            parentId = componentsIdMap[parentId];
          }
        }
        component.parent = parentId;
      }

      await manager.save(clonedComponents);
      await manager.save(newComponentLayouts);
    }, manager);
  }

  async reorderPages(diff, appVersionId: string, organizationId: string) {
    return this.pageHelperService.reorderPages(diff, appVersionId, organizationId);
  }

  async updatePage(pageUpdates: UpdatePageDto, appVersionId: string) {
    if (Object.keys(pageUpdates.diff).length > 1) {
      throw new Error('Can not update multiple pages');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const currentPage = await manager.findOne(Page, {
        where: { id: pageUpdates.pageId },
      });

      if (!currentPage) {
        throw new Error('Page not found');
      }
      return manager.update(Page, pageUpdates.pageId, pageUpdates.diff);
    });
  }

  async deletePage(
    pageId: string,
    appVersionId: string,
    editingVersion: AppVersion,
    deleteAssociatedPages: boolean = false,
    organizationId: string
  ) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const pageExists = await manager.findOne(Page, {
        where: { id: pageId },
      });

      if (!pageExists) {
        throw new Error('Page not found');
      }

      if (editingVersion?.homePageId === pageId) {
        throw new Error('Cannot delete home page');
      }
      if (pageExists.isPageGroup) {
        return await this.pageHelperService.deletePageGroup(
          pageExists,
          appVersionId,
          deleteAssociatedPages,
          organizationId
        );
      }
      this.eventHandlerService.cascadeDeleteEvents(pageExists.id);
      const pageDeleted = await manager.delete(Page, pageId);

      if (pageDeleted.affected === 0) {
        throw new Error('Page not deleted');
      }

      return await this.pageHelperService.rearrangePagesOrderPostDeletion(pageExists, manager, organizationId);
    }, appVersionId);
  }

  async findModuleContainer(appVersionId: string, organizationId: string): Promise<any> {
    return this.pageHelperService.findModuleContainer(appVersionId, organizationId);
  }
}
