import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { Page } from 'src/entities/page.entity';
import { EventHandler } from 'src/entities/event_handler.entity';
import { dbTransactionForAppVersionAssociationsUpdate, dbTransactionWrap } from 'src/helpers/database.helper';
import { EventsService } from './event.service';
import { LayoutData } from '../dto/component';
import { CreateEventHandlerDto } from '../dto/event';
import { LayoutDimensionUnits } from '../constants';
import {
  IComponentsService,
  ComponentCreateContext,
  ComponentUpdateContext,
  ComponentDeleteContext,
  ComponentLayoutContext,
} from '../interfaces/services/IComponentService';
import { RequestContext } from '@modules/request-context/service';
const _ = require('lodash');

@Injectable()
export class ComponentsService implements IComponentsService {
  constructor(protected eventHandlerService: EventsService) {}

  findOne(id: string): Promise<Component> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(Component, { where: { id } });
    });
  }

  async findOneWithLayouts(id: string): Promise<Component> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const component = await manager
        .createQueryBuilder(Component, 'component')
        .leftJoinAndSelect('component.layouts', 'layout')
        .where('component.id = :id', { id })
        .getOne();

      if (!component) {
        throw new Error(`Component with id ${id} not found`);
      }

      return component;
    });
  }

  async create(componentDiff: object, pageId: string, appVersionId: string, skipHistoryCapture: boolean = false) {
    const componentIds = Object.keys(componentDiff);
    const historyUserId = (RequestContext.currentContext?.req as any)?.user?.id;

    const context = skipHistoryCapture
      ? null
      : await this.beforeComponentCreate(componentIds, pageId, appVersionId, componentDiff);

    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      await this.createComponentsAndLayouts(componentDiff, pageId, appVersionId, manager);
      return {};
    }, appVersionId);

    const operationTimestamp = Date.now();
    if (!skipHistoryCapture) {
      this.afterComponentCreate(context, componentDiff, pageId, appVersionId, historyUserId, operationTimestamp).catch(
        (err) => console.error('[AppHistory] Fire-and-forget afterComponentCreate failed:', err.message)
      );
    }
    return result;
  }

  /**
   * Create components using an external EntityManager (for use within existing transactions)
   * Use this when creating components within a transaction that has also created pages,
   * so both operations share the same transaction and can see each other's uncommitted changes.
   */
  async createWithManager(
    componentDiff: object,
    pageId: string,
    appVersionId: string,
    manager: EntityManager,
    skipHistoryCapture: boolean = false
  ): Promise<void> {
    const componentIds = Object.keys(componentDiff);
    const historyUserId = (RequestContext.currentContext?.req as any)?.user?.id;

    const context = skipHistoryCapture
      ? null
      : await this.beforeComponentCreate(componentIds, pageId, appVersionId, componentDiff);

    await this.createComponentsAndLayouts(componentDiff, pageId, appVersionId, manager);

    const operationTimestamp = Date.now();
    if (!skipHistoryCapture) {
      this.afterComponentCreate(context, componentDiff, pageId, appVersionId, historyUserId, operationTimestamp).catch(
        (err) => console.error('[AppHistory] Fire-and-forget afterComponentCreate failed:', err.message)
      );
    }
  }

  async update(componentDiff: object, appVersionId: string) {
    const componentIds = Object.keys(componentDiff);
    const historyUserId = (RequestContext.currentContext?.req as any)?.user?.id;

    const context = await this.beforeComponentUpdate(componentIds, appVersionId, componentDiff);

    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const result = await this.updateComponents(componentDiff, appVersionId, manager);
      if (result?.error) {
        return result;
      }
    }, appVersionId);

    const operationTimestamp = Date.now();
    this.afterComponentUpdate(context, componentDiff, appVersionId, historyUserId, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterComponentUpdate failed:', err.message)
    );

    return result;
  }

  async delete(componentIds: string[], appVersionId: string, isComponentCut = false) {
    const historyUserId = (RequestContext.currentContext?.req as any)?.user?.id;
    const context = await this.beforeComponentDelete(componentIds, appVersionId);

    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const result = await this.deleteComponents(componentIds, appVersionId, isComponentCut, manager);
      if (result?.error) {
        return result;
      }
    }, appVersionId);

    const operationTimestamp = Date.now();
    this.afterComponentDelete(context, componentIds, appVersionId, historyUserId, operationTimestamp).catch((err) =>
      console.error('[AppHistory] Fire-and-forget afterComponentDelete failed:', err.message)
    );

    return result;
  }

  async componentLayoutChange(
    componenstLayoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>,
    appVersionId: string,
    skipHistoryCapture: boolean = false
  ) {
    const historyUserId = (RequestContext.currentContext?.req as any)?.user?.id;

    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const parentWrites = this.collectParentWritesFromDiff(componenstLayoutDiff);
      if (Object.keys(parentWrites).length > 0) {
        await this.assertNoParentCycle(parentWrites, appVersionId, manager);
      }

      for (const componentId in componenstLayoutDiff) {
        const doesComponentExist = await manager.findAndCount(Component, {
          where: { id: componentId },
        });

        if (doesComponentExist[1] === 0) {
          return {
            error: {
              message: `Component with id ${componentId} does not exist`,
            },
          };
        }

        const { layouts, component } = componenstLayoutDiff[componentId];

        for (const type in layouts) {
          const componentLayout = await manager.findOne(Layout, {
            where: { componentId, type },
          });

          if (componentLayout) {
            const layout = {
              ...layouts[type],
            } as Partial<Layout>;

            await manager.update(Layout, { id: componentLayout.id }, layout);
          }
          //Handle parent change cases. component.parent can be undefined if the element is moved form container to canvas
          if (component) {
            await manager.update(Component, { id: componentId }, { parent: component.parent });
          }
        }
      }
    }, appVersionId);

    const operationTimestamp = Date.now();
    if (!skipHistoryCapture) {
      this.afterComponentLayoutChange(
        null,
        componenstLayoutDiff,
        appVersionId,
        historyUserId,
        operationTimestamp
      ).catch((err) => console.error('[AppHistory] Fire-and-forget afterComponentLayoutChange failed:', err.message));
    }

    return result;
  }

  async getAllComponents(pageId: string, externalManager?: EntityManager): Promise<Record<string, any>> {
    const byPage = await this.getAllComponentsForPages([pageId], externalManager);
    return byPage.get(pageId) ?? {};
  }

  async getAllComponentsForPages(
    pageIds: string[],
    externalManager?: EntityManager
  ): Promise<Map<string, Record<string, any>>> {
    if (pageIds.length === 0) return new Map();

    return dbTransactionWrap(async (manager: EntityManager) => {
      const rawComponents = await manager
        .createQueryBuilder(Component, 'component')
        .leftJoinAndSelect('component.layouts', 'layout')
        .where('component.pageId IN (:...pageIds)', { pageIds })
        .andWhere('layout.type IN (:...types)', { types: ['desktop', 'mobile'] })
        .orderBy('component.pageId', 'ASC')
        .addOrderBy('component.id', 'ASC')
        .addOrderBy('layout.updatedAt', 'DESC')
        .getMany();

      const { componentsByPage, layoutsNeedingMigration } = this.assembleComponentsByPage(rawComponents);

      if (layoutsNeedingMigration.length > 0) {
        await manager.save(Layout, layoutsNeedingMigration);
      }

      return componentsByPage;
    }, externalManager);
  }

  private assembleComponentsByPage(rawComponents: Component[]): {
    componentsByPage: Map<string, Record<string, any>>;
    layoutsNeedingMigration: Layout[];
  } {
    const componentsByPage = new Map<string, Record<string, any>>();
    const layoutsNeedingMigration: Layout[] = [];

    for (const component of rawComponents) {
      const normalisedLayouts = (component.layouts || [])
        .filter((l) => l && l.type)
        .map((layout) => {
          const next = { ...layout };
          if (next.dimensionUnit === LayoutDimensionUnits.PERCENT) {
            next.left = this.resolveGridPositionForComponent(next.left, next.type);
            next.dimensionUnit = LayoutDimensionUnits.COUNT;
            layoutsNeedingMigration.push(next);
          }
          return next;
        });

      const mostRecentLayouts = [...normalisedLayouts]
        .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
        .slice(0, 2);

      const transformed = this.createComponentWithLayout(component, mostRecentLayouts);
      const bucket = componentsByPage.get(component.pageId) ?? {};
      bucket[component.id] = transformed[component.id];
      componentsByPage.set(component.pageId, bucket);
    }

    return { componentsByPage, layoutsNeedingMigration };
  }

  transformComponentData(data: object): Component[] {
    const transformedComponents: Component[] = [];

    for (const componentId in data) {
      const componentData = data[componentId];

      const transformedComponent: Component = new Component();
      transformedComponent.id = componentId;
      transformedComponent.name = componentData.name;
      transformedComponent.type = componentData.type;
      transformedComponent.parent = componentData.parent || null;
      transformedComponent.properties = componentData.properties || {};
      transformedComponent.styles = componentData.styles || {};
      transformedComponent.validation = componentData.validation || {};
      transformedComponent.displayPreferences = componentData.others || null;
      transformedComponent.general = componentData.general || null;
      transformedComponent.generalStyles = componentData.generalStyles || null;

      transformedComponents.push(transformedComponent);
    }

    return transformedComponents;
  }

  createComponentWithLayout(componentData: Component, layoutData: Layout[] = []) {
    // Removed manager, it's not used here anymore for DB ops
    const { id, name, properties, styles, generalStyles, validation, parent, displayPreferences, general } =
      componentData;

    const layouts: Record<
      string,
      {
        top: number;
        left: number;
        width: number;
        height: number;
        widthPx?: number;
        fillWidth?: boolean;
        updatedAt: Date | null;
      }
    > = {};

    layoutData.forEach((layout) => {
      if (layout && layout.type) {
        const { type, top, left, width, height, widthPx, fillWidth, updatedAt } = layout;

        // Note: adjustedLeftValue logic will be handled BEFORE calling this function
        // so 'left' here is already the final desired value for the output.
        // `updatedAt` is exposed so the frontend can use it as a stack-order
        // tiebreaker for widgets sharing the same (top, left) — most recently
        // positioned widget renders at the bottom of the stack.
        layouts[type] = {
          top: top ?? 0,
          left: left ?? 0, // Use the already adjusted 'left' value
          width: width ?? 0,
          height: height ?? 0,
          updatedAt: updatedAt ?? null,
          ...(widthPx != null ? { widthPx } : {}),
          ...(fillWidth != null ? { fillWidth } : {}),
        };
      }
    });

    const componentWithLayout = {
      [id]: {
        component: {
          name,
          component: componentData.type,
          definition: {
            properties,
            styles,
            generalStyles,
            validation,
            general,
            others: displayPreferences,
          },
          parent,
        },
        layouts: {
          ...layouts,
        },
      },
    };

    return componentWithLayout;
  }

  resolveGridPositionForComponent(dimension: number, type: string): number {
    // const numberOfGrids = type === 'desktop' ? 43 : 12;
    const numberOfGrids = 43;
    return Math.round((dimension * numberOfGrids) / 100);
  }

  async batchOperations(
    batchOperations: {
      create?: { diff: object; pageId: string };
      update?: { diff: object };
      delete?: { diff: string[]; is_component_cut?: boolean };
      layout?: {
        diff: Record<string, { layouts: LayoutData; component?: { parent: string } }>;
      };
      events?: CreateEventHandlerDto[];
    },
    appVersionId: string
  ) {
    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const results: {
        created?: number;
        updated?: number;
        deleted?: number;
        layout?: number;
        events?: EventHandler[];
      } = {};

      // Handle create operation if present
      if (batchOperations.create) {
        const { diff, pageId } = batchOperations.create;
        await this.createComponentsAndLayouts(diff, pageId, appVersionId, manager);
        results.created = Object.keys(diff).length;
      }

      // Handle update operation if present
      if (batchOperations.update) {
        const { diff } = batchOperations.update;
        await this.updateComponents(diff, appVersionId, manager);
        results.updated = Object.keys(diff).length;
      }

      // Handle delete operation if present
      if (batchOperations.delete) {
        const { diff: componentIds, is_component_cut = false } = batchOperations.delete;
        await this.deleteComponents(componentIds, appVersionId, is_component_cut, manager);
        results.deleted = componentIds.length;
      }

      // Handle layout operation if present
      if (batchOperations.layout) {
        const { diff } = batchOperations.layout;
        await this.updateComponentLayouts(diff, manager);
        results.layout = Object.keys(diff).length;
      }

      // Handle events creation if present
      // skipValidation: true because components are created in the same transaction
      if (batchOperations.events && batchOperations.events.length > 0) {
        results.events = await this.eventHandlerService.createEventsInTransaction(
          batchOperations.events,
          appVersionId,
          manager,
          { skipValidation: true }
        );
      }

      return results;
    }, appVersionId);

    // History capture is handled by EE override
    return result;
  }

  // Strips the `-<slot>` suffix (e.g. `-tab1`, `-header`, `-modal`) and returns
  // the bare component UUID. Mirrors the frontend getBaseParentId helper.
  private extractBaseParentId(parentId: string | null | undefined): string | null {
    if (!parentId) return null;
    const match = parentId.match(/([a-fA-F0-9-]{36})-(.+)/);
    return match ? match[1] : parentId;
  }

  // Authoritative server-side cycle reject. Loads the (id, parent) graph for
  // the appVersion, overlays the proposed parent writes (and any in-flight
  // creations), and walks up from every affected node. Throws if any chain
  // closes back on itself. Pre-existing cycles unrelated to the write are
  // left intact — the import boundary's repairParentCycles handles those.
  protected async assertNoParentCycle(
    proposedParentById: Record<string, string | null | undefined>,
    appVersionId: string,
    manager: EntityManager,
    options: { newComponentParents?: Record<string, string | null | undefined> } = {}
  ): Promise<void> {
    const affectedIds = Object.keys(proposedParentById);
    if (affectedIds.length === 0) return;

    // Serialize concurrent parent-mutating transactions for the same app
    // version. Without this, two parallel autosaves can each independently
    // read a cycle-free snapshot, each pass the walk below, and both commit —
    // producing a cycle the per-transaction guard cannot see. The transaction-
    // scoped advisory lock blocks the second transaction at this point until
    // the first commits, then it re-reads the now-current graph and rejects
    // cleanly. Lock is auto-released on COMMIT/ROLLBACK. hashtext returns
    // int4; collisions across distinct app versions are possible but harmless
    // (they'd just serialize against each other unnecessarily, no correctness
    // impact).
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [appVersionId]);

    const rows: { id: string; parent: string | null }[] = await manager
      .createQueryBuilder(Component, 'component')
      .leftJoin('component.page', 'page')
      .where('page.appVersionId = :appVersionId', { appVersionId })
      .select('component.id', 'id')
      .addSelect('component.parent', 'parent')
      .getRawMany();

    const parentById = new Map<string, string | null>();
    rows.forEach((row) => parentById.set(row.id, row.parent ?? null));

    const { newComponentParents = {} } = options;
    for (const [id, parent] of Object.entries(newComponentParents)) {
      parentById.set(id, parent ?? null);
    }
    for (const [id, parent] of Object.entries(proposedParentById)) {
      parentById.set(id, parent ?? null);
    }

    for (const id of affectedIds) {
      const visited = new Set<string>([id]);
      let next = this.extractBaseParentId(parentById.get(id));
      while (next) {
        if (next === id) {
          const exc = new BadRequestException({
            message: `Parent assignment for component ${id} would create a parent-child loop.`,
            code: 'PARENT_CYCLE_DETECTED',
            componentId: id,
          });
          (exc as any).code = 'PARENT_CYCLE_DETECTED';
          throw exc;
        }
        if (visited.has(next)) break;
        visited.add(next);
        next = this.extractBaseParentId(parentById.get(next));
      }
    }
  }

  // Pulls the proposed parent writes from a diff whose values may carry a
  // `component.parent` field (used by both updateComponents and the two
  // layout-update entry points).
  private collectParentWritesFromDiff(
    diff: Record<string, { component?: { parent?: string | null } }>
  ): Record<string, string | null | undefined> {
    const writes: Record<string, string | null | undefined> = {};
    for (const id in diff) {
      const candidate = diff[id]?.component;
      if (candidate && Object.prototype.hasOwnProperty.call(candidate, 'parent')) {
        writes[id] = candidate.parent ?? null;
      }
    }
    return writes;
  }

  // Common methods used by both the original methods and batch operations
  protected async createComponentsAndLayouts(
    diff: object,
    pageId: string,
    appVersionId: string,
    manager: EntityManager
  ) {
    const page = await manager.findOne(Page, {
      where: { appVersionId, id: pageId },
    });

    const newComponents = this.transformComponentData(diff);

    // Validate the proposed graph BEFORE inserting. New components overlay the
    // existing tree so a cycle introduced by a buggy paste/import gets caught
    // at the DB boundary even if the client guard was bypassed.
    const newComponentParents: Record<string, string | null> = {};
    newComponents.forEach((component) => {
      newComponentParents[component.id] = component.parent ?? null;
    });
    await this.assertNoParentCycle(newComponentParents, appVersionId, manager, {
      newComponentParents,
    });

    const componentLayouts = [];

    newComponents.forEach((component) => {
      component.page = page;
    });

    const savedComponents = await manager.save(Component, newComponents);

    savedComponents.forEach((component) => {
      const componentLayout = diff[component.id].layouts;

      if (componentLayout) {
        for (const type in componentLayout) {
          const layout = componentLayout[type];
          const newLayout = new Layout();
          newLayout.type = type;
          newLayout.top = layout.top;
          newLayout.left = layout.left;
          newLayout.width = layout.width;
          newLayout.height = layout.height;
          if (layout.widthPx != null) newLayout.widthPx = layout.widthPx;
          if (layout.fillWidth != null) newLayout.fillWidth = layout.fillWidth;
          newLayout.component = component;
          newLayout.dimensionUnit = LayoutDimensionUnits.COUNT;

          componentLayouts.push(newLayout);
        }
      }
    });

    await manager.save(Layout, componentLayouts);
  }

  protected async updateComponents(diff: object, appVersionId: string, manager: EntityManager) {
    const parentWrites = this.collectParentWritesFromDiff(diff as any);
    if (Object.keys(parentWrites).length > 0) {
      await this.assertNoParentCycle(parentWrites, appVersionId, manager);
    }

    for (const componentId in diff) {
      const { component } = diff[componentId];

      const doesComponentExist = await manager.findAndCount(Component, {
        where: { id: componentId },
      });

      if (doesComponentExist[1] === 0) {
        return {
          error: {
            message: `Component with id ${componentId} does not exist`,
          },
        };
      }

      const componentData: Component = await manager.findOne(Component, {
        where: { id: componentId },
      });

      const isComponentDefinitionChanged = component.definition ? true : false;

      if (isComponentDefinitionChanged) {
        const updatedDefinition = component.definition;
        const columnsUpdated = Object.keys(updatedDefinition);

        const newComponentsData = columnsUpdated.reduce((acc, column) => {
          const newColumnData = _.mergeWith(
            componentData[column === 'others' ? 'displayPreferences' : column],
            updatedDefinition[column],
            (objValue, srcValue) => {
              if ((componentData.type === 'Table' || componentData.type === 'Form') && _.isArray(objValue)) {
                return srcValue;
              } else if (componentData.type === 'Form' && _.isObject(srcValue)) {
                // Handle Form component with object srcValue like JSONData & JSONSchema
                return srcValue;
              } else if (
                [
                  'DropdownV2',
                  'MultiselectV2',
                  'PopoverMenu',
                  'ModuleContainer',
                  'Tabs',
                  'Steps',
                  'RadioButtonV2',
                  'Tags',
                  'TagsInput',
                  'Navigation',
                  'TreeSelect',
                  'Cascader',
                  'ButtonGroupV2',
                ].includes(componentData.type) &&
                _.isArray(objValue)
              ) {
                return _.isArray(srcValue) ? srcValue : Object.values(srcValue);
              }
            }
          );

          if (column === 'others') {
            acc['displayPreferences'] = newColumnData;
          } else {
            acc[column] = newColumnData;
          }

          return acc;
        }, {});

        await manager.update(Component, componentId, newComponentsData);
      } else {
        await manager.update(Component, componentId, component);
      }
    }
  }

  protected async deleteComponents(
    componentIds: string[],
    appVersionId: string,
    isComponentCut: boolean,
    manager: EntityManager
  ) {
    const components = await manager.findBy(Component, {
      id: In(componentIds),
    });

    if (!components.length) {
      return {
        error: {
          message: `Components with ids ${componentIds} do not exist`,
        },
      };
    }

    if (!isComponentCut) {
      components.forEach((component) => {
        this.eventHandlerService.cascadeDeleteEvents(component.id);
      });
    }

    await manager.delete(Component, { id: In(componentIds) });
  }

  protected async updateComponentLayouts(
    layoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>,
    manager: EntityManager
  ) {
    const parentWrites = this.collectParentWritesFromDiff(layoutDiff);
    if (Object.keys(parentWrites).length > 0) {
      // Signature doesn't carry appVersionId, so resolve it from the first
      // component's page. Single extra query — only fires when re-parenting.
      const firstComponentId = Object.keys(layoutDiff)[0];
      const sampleComponent = await manager.findOne(Component, {
        where: { id: firstComponentId },
        relations: ['page'],
      });
      if (sampleComponent?.page?.appVersionId) {
        await this.assertNoParentCycle(parentWrites, sampleComponent.page.appVersionId, manager);
      }
    }

    for (const componentId in layoutDiff) {
      const doesComponentExist = await manager.findAndCount(Component, {
        where: { id: componentId },
      });

      if (doesComponentExist[1] === 0) {
        return {
          error: {
            message: `Component with id ${componentId} does not exist`,
          },
        };
      }

      const { layouts, component } = layoutDiff[componentId];

      for (const type in layouts) {
        const componentLayout = await manager.findOne(Layout, {
          where: { componentId, type },
        });

        if (componentLayout) {
          const layout = {
            ...layouts[type],
          } as Partial<Layout>;

          await manager.update(Layout, { id: componentLayout.id }, layout);
        }
        // Handle parent change cases. component.parent can be undefined if the element is moved from container to canvas
        if (component) {
          await manager.update(Component, { id: componentId }, { parent: component.parent });
        }
      }
    }
  }

  /**
   * Hook called before component creation - override in EE to capture state for history
   */
  protected async beforeComponentCreate(
    componentIds: string[],
    pageId: string,
    appVersionId: string,
    componentDiff: object
  ): Promise<ComponentCreateContext | null> {
    return null; // No-op in CE
  }

  /**
   * Hook called after component creation - override in EE to queue history
   */
  protected async afterComponentCreate(
    context: ComponentCreateContext | null,
    componentDiff: object,
    pageId: string,
    appVersionId: string,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE
  }

  /**
   * Hook called before component update - override in EE to capture state for history
   */
  protected async beforeComponentUpdate(
    componentIds: string[],
    appVersionId: string,
    componentDiff: object
  ): Promise<ComponentUpdateContext | null> {
    return null; // No-op in CE
  }

  /**
   * Hook called after component update - override in EE to queue history
   */
  protected async afterComponentUpdate(
    context: ComponentUpdateContext | null,
    componentDiff: object,
    appVersionId: string,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE
  }

  /**
   * Hook called before component deletion - override in EE to capture state for history
   */
  protected async beforeComponentDelete(
    componentIds: string[],
    appVersionId: string
  ): Promise<ComponentDeleteContext | null> {
    return null; // No-op in CE
  }

  /**
   * Hook called after component deletion - override in EE to queue history
   */
  protected async afterComponentDelete(
    context: ComponentDeleteContext | null,
    componentIds: string[],
    appVersionId: string,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE
  }

  /**
   * Hook called before layout change - override in EE to capture state for history
   */
  protected async beforeComponentLayoutChange(
    componentIds: string[],
    appVersionId: string,
    layoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>
  ): Promise<ComponentLayoutContext | null> {
    return null; // No-op in CE
  }

  /**
   * Hook called after layout change - override in EE to queue history
   */
  protected async afterComponentLayoutChange(
    context: ComponentLayoutContext | null,
    layoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>,
    appVersionId: string,
    userId?: string,
    operationTimestamp?: number
  ): Promise<void> {
    // No-op in CE
  }
}
