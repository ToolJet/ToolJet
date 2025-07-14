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
import { AppVersion } from '@entities/app_version.entity';
import { IPageService } from '../interfaces/services/IPageService';

@Injectable()
export class PageService implements IPageService {
  constructor(
    protected componentsService: ComponentsService,
    protected pageHelperService: PageHelperService,
    protected eventHandlerService: EventsService
  ) {}

  async findPagesForVersion(
    appVersionId: string,
    organizationId: string,
    mode?: string,
    manager?: EntityManager
  ): Promise<Page[]> {
    // const allPages = await this.pageRepository.find({ where: { appVersionId }, order: { index: 'ASC' } });
    const allPages = await this.pageHelperService.fetchPages(appVersionId, organizationId, manager);
    const pagesWithComponents = await Promise.all(
      allPages.map(async (page) => {
        const components = await this.componentsService.getAllComponents(page.id, manager);
        delete page.appVersionId;
        return { ...page, components };
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
    // TODO - Should use manager here - multiple db operations found
    return dbTransactionForAppVersionAssociationsUpdate(async (manager) => {
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

      const clonedpage = await manager.save(newPage);

      await this.clonePageEventsAndComponents(pageId, clonedpage.id, manager);

      const pages = await this.findPagesForVersion(appVersionId, organizationId, '', manager);
      const events = await this.eventHandlerService.findEventsForVersion(appVersionId, manager);

      return { pages, events };
    }, appVersionId);
  }

  async cloneGroup(groupPageId: string, appVersionId: string, organizationId) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager) => {
      const groupToClone = await manager.findOne(Page, {
        where: { id: groupPageId, appVersionId, isPageGroup: true },
      });

      if (!groupToClone) {
        throw new Error('Group page not found');
      }

      let groupName = `${groupToClone.name} (copy)`;
      let groupHandle = `${groupToClone.handle}-copy`;

      const allPages = await manager.find(Page, { where: { appVersionId } });

      const similarGroupPages = allPages.filter((page) => {
        return page.name.includes(groupName) || page.handle.includes(groupHandle);
      });

      if (similarGroupPages.length > 0) {
        groupName = `${groupToClone.name} (copy ${similarGroupPages.length})`;
        groupHandle = `${groupToClone.handle}-copy-${similarGroupPages.length}`;
      }

      const newGroupPage = new Page();
      newGroupPage.name = groupName;
      newGroupPage.handle = groupHandle;
      newGroupPage.index = 999;
      newGroupPage.pageGroupIndex = groupToClone.pageGroupIndex;
      newGroupPage.isPageGroup = true;
      newGroupPage.icon = groupToClone.icon || 'IconFolder';
      newGroupPage.appVersionId = appVersionId;
      newGroupPage.autoComputeLayout = groupToClone.autoComputeLayout;
      newGroupPage.type = groupToClone.type;
      newGroupPage.openIn = groupToClone.openIn;
      newGroupPage.appId = groupToClone.appId;
      newGroupPage.url = groupToClone.url;
      newGroupPage.disabled = groupToClone.disabled;
      newGroupPage.hidden = groupToClone.hidden;

      const clonedGroup = await manager.save(newGroupPage);

      // Find child pages in this group
      const childPages = await manager.find(Page, {
        where: {
          appVersionId,
          pageGroupId: groupToClone.id,
        },
      });

      for (const child of childPages) {
        let childName = `${child.name} (copy)`;
        let childHandle = `${child.handle}-copy`;

        const existingSimilar = allPages.filter(
          (page) => page.name.includes(childName) || page.handle.includes(childHandle)
        );

        if (existingSimilar.length > 0) {
          childName = `${child.name} (copy ${existingSimilar.length})`;
          childHandle = `${child.handle}-copy-${existingSimilar.length}`;
        }

        const clonedChild = new Page();
        clonedChild.name = childName;
        clonedChild.handle = childHandle;
        clonedChild.index = child.index + 1;
        clonedChild.pageGroupIndex = child.pageGroupIndex;
        clonedChild.pageGroupId = clonedGroup.id;
        clonedChild.isPageGroup = false;
        clonedChild.icon = child.icon || 'IconFile';
        clonedChild.appVersionId = appVersionId;
        clonedChild.autoComputeLayout = true;
        clonedChild.type = child.type;
        clonedChild.openIn = child.openIn;
        clonedChild.appId = child.appId;
        clonedChild.url = child.url;
        clonedChild.disabled = child.disabled;
        clonedChild.hidden = child.hidden;

        const newChildPage = await manager.save(clonedChild);

        // Clone events and components for each child page
        await this.clonePageEventsAndComponents(child.id, newChildPage.id, manager);
      }

      const pages = await this.findPagesForVersion(appVersionId,organizationId, '', manager);
      const events = await this.eventHandlerService.findEventsForVersion(appVersionId, manager);

      return { pages, events };
    }, appVersionId);
  }

  async clonePageEventsAndComponents(pageId: string, clonePageId: string, manager?: EntityManager) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const pageComponents = await manager.find(Component, { where: { pageId } });
      const pageEvents = await this.eventHandlerService.findAllEventsWithSourceId(pageId);
      const componentsIdMap = {};

      // Clone components
      // array to store maapings and update them later with path
      const mappingsToUpdate = [];
      const clonedComponents = await Promise.all(
        pageComponents.map(async (component) => {
          const clonedComponent = { ...component, id: undefined, pageId: clonePageId };
          const newComponent = await manager.save(manager.create(Component, clonedComponent));
          componentsIdMap[component.id] = newComponent.id;
          const componentLayouts = await manager.find(Layout, { where: { componentId: component.id } });
          if (component?.properties?.buttonToSubmit?.value) {
            mappingsToUpdate.push({
              component: newComponent,
              pathToUpdate: 'properties.buttonToSubmit.value',
            });
          }
          const clonedLayouts = componentLayouts.map((layout) => ({
            ...layout,
            id: undefined,
            componentId: newComponent.id,
          }));
          // Clone component events
          const clonedComponentEvents = await this.eventHandlerService.findAllEventsWithSourceId(component.id);
          const clonedEvents = clonedComponentEvents.map((event) => {
            const eventDefinition = updateEntityReferences(event.event, componentsIdMap);

            if (eventDefinition?.actionId === 'control-component') {
              eventDefinition.componentId = componentsIdMap[eventDefinition.componentId];
            }

            if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'hide-modal') {
              eventDefinition.modal = componentsIdMap[eventDefinition.modal];
            }

            if (eventDefinition?.actionId === 'set-table-page') {
              eventDefinition.table = componentsIdMap[eventDefinition.table];
            }

            event.event = eventDefinition;

            const clonedEvent = new EventHandler();
            clonedEvent.event = event.event;
            clonedEvent.index = event.index;
            clonedEvent.name = event.name;
            clonedEvent.sourceId = newComponent.id;
            clonedEvent.target = event.target;
            clonedEvent.appVersionId = event.appVersionId;

            return clonedEvent;
          });

          await manager.save(Layout, clonedLayouts);
          await manager.save(EventHandler, clonedEvents);

          return newComponent;
        })
      );
      // re estabilish mappings
      await Promise.all(
        mappingsToUpdate.map((itemToUpdate) => {
          const { component, pathToUpdate: path } = itemToUpdate;
          const oldId = _.get(component, path);
          const newId = componentsIdMap[oldId];
          if (newId) {
            _.set(component, path, newId);
          }
          manager.save(component);
        })
      );
      // Clone events
      await Promise.all(
        pageEvents.map(async (event) => {
          const eventDefinition = updateEntityReferences(event.event, componentsIdMap);

          if (eventDefinition?.actionId === 'control-component') {
            eventDefinition.componentId = componentsIdMap[eventDefinition.componentId];
          }

          if (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'hide-modal') {
            eventDefinition.modal = componentsIdMap[eventDefinition.modal];
          }

          if (eventDefinition?.actionId == 'set-table-page' && componentsIdMap[eventDefinition.table]) {
            eventDefinition.table = componentsIdMap[eventDefinition.table];
          }

          event.event = eventDefinition;

          const clonedEvent = new EventHandler();
          clonedEvent.event = event.event;
          clonedEvent.index = event.index;
          clonedEvent.name = event.name;
          clonedEvent.sourceId = clonePageId;
          clonedEvent.target = event.target;
          clonedEvent.appVersionId = event.appVersionId;

          await manager.save(EventHandler, clonedEvent);
        })
      );

      const hasParentIdSuffixed = (component, allComponents = [], componentParentId = undefined) => {
        if (componentParentId) {
          const parentId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];

          const parentComponent = allComponents.find((comp) => comp.id === parentId);

          if (parentComponent) {
            return (
              parentComponent.type === 'Tabs' ||
              parentComponent.type === 'Calendar' ||
              parentComponent.type === 'Kanban'
            );
          }
        }

        return false;
      };
      let index = 0;
      for (const component of clonedComponents) {
        let parentId = component.parent ? component.parent : null;

        const isParentIdSuffixed = hasParentIdSuffixed(component, pageComponents, parentId);

        if (isParentIdSuffixed) {
          const childTabId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[2];
          const _parentId = component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];
          const mappedParentId = componentsIdMap[_parentId];

          parentId = `${mappedParentId}-${childTabId}`;
        } else {
          parentId = componentsIdMap[parentId];
        }

        if (parentId) {
          await manager.update(Component, component.id, { parent: parentId });
          // update in variable too, so that parent field doesn't get overriden in next step
          component.parent = parentId;
          clonedComponents[index] = component;
        }
        index++;
      }

      const toUpdateComponents = clonedComponents.filter((component) => {
        return updateEntityReferences(component, componentsIdMap);
      });

      if (!isEmpty(toUpdateComponents)) {
        await manager.save(toUpdateComponents);
      }
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
