import { Injectable } from '@nestjs/common';
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
import { IComponentsService } from '../interfaces/services/IComponentService';
import { ACTION_TYPE } from '@modules/app-history/constants';
import { AppHistoryUtilService } from '@modules/app-history/util.service';
const _ = require('lodash');

@Injectable()
export class ComponentsService implements IComponentsService {
  constructor(
    protected eventHandlerService: EventsService,
    protected appHistoryUtilService: AppHistoryUtilService
  ) {}

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
    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      await this.createComponentsAndLayouts(componentDiff, pageId, appVersionId, manager);
      return {};
    }, appVersionId);

    if (skipHistoryCapture) {
      return result;
    }

    // Queue history capture after successful component creation
    try {
      // Extract component IDs - let the queue processor resolve names from componentData
      const componentData = componentDiff as Record<string, any>;
      const componentIds = Object.keys(componentData);

      // The queue processor will resolve names from componentData and previous state
      await this.appHistoryUtilService.queueHistoryCapture(appVersionId, ACTION_TYPE.COMPONENT_ADD, {
        pageId,
        componentIds,
        operation: 'create',
        componentData: componentDiff,
      });
    } catch (error) {
      // Log the error but don't throw - component creation already succeeded
      console.error('Failed to queue history capture for component creation:', error);
      // History capture failure doesn't affect the component creation success
    }

    return result;
  }

  async update(componentDiff: object, appVersionId: string) {
    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const result = await this.updateComponents(componentDiff, appVersionId, manager);
      if (result?.error) {
        return result;
      }
    }, appVersionId);

    // Queue history capture after successful component update
    try {
      // Extract component IDs - let the queue processor resolve names from componentData and previous state
      const componentIds = Object.keys(componentDiff);
      if (componentIds.length > 0) {
        await this.appHistoryUtilService.queueHistoryCapture(appVersionId, ACTION_TYPE.COMPONENT_UPDATE, {
          componentIds,
          operation: 'update',
          componentData: componentDiff,
        });
      }
    } catch (error) {
      console.error('Failed to queue history capture for component update:', error);
    }

    return result;
  }

  async delete(componentIds: string[], appVersionId: string, isComponentCut = false) {
    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const result = await this.deleteComponents(componentIds, appVersionId, isComponentCut, manager);
      if (result?.error) {
        return result;
      }
    }, appVersionId);

    // Queue history capture
    try {
      await this.appHistoryUtilService.queueHistoryCapture(appVersionId, ACTION_TYPE.COMPONENT_DELETE, {
        componentIds,
        operation: 'delete',
        isComponentCut,
        // No need to pre-fetch componentNames or pageName - queue processor will resolve from history
      });
    } catch (error) {
      console.error('Failed to queue history capture for component deletion:', error);
    }

    return result;
  }

  async componentLayoutChange(
    componenstLayoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>,
    appVersionId: string,
    skipHistoryCapture: boolean = false
  ) {
    const result = await dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      for (const componentId in componenstLayoutDiff) {
        const doesComponentExist = await manager.findAndCount(Component, { where: { id: componentId } });

        if (doesComponentExist[1] === 0) {
          return {
            error: {
              message: `Component with id ${componentId} does not exist`,
            },
          };
        }

        const { layouts, component } = componenstLayoutDiff[componentId];

        for (const type in layouts) {
          const componentLayout = await manager.findOne(Layout, { where: { componentId, type } });

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

    // Skip history capture if requested (e.g., when called from AI service)
    if (skipHistoryCapture) {
      return result;
    }

    // Queue history capture after successful layout change
    try {
      // Extract component IDs - let the queue processor resolve names from layoutData and previous state
      const componentIds = Object.keys(componenstLayoutDiff);
      if (componentIds.length > 0) {
        await this.appHistoryUtilService.queueHistoryCapture(appVersionId, ACTION_TYPE.COMPONENT_UPDATE, {
          componentIds,
          operation: 'layout_change',
          layoutData: componenstLayoutDiff,
        });
      }
    } catch (error) {
      console.error('Failed to queue history capture for component layout change:', error);
    }

    return result;
  }

  async getAllComponents(pageId: string, externalManager?: EntityManager) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const rawComponents = await manager
        .createQueryBuilder(Component, 'component')
        .leftJoinAndSelect('component.layouts', 'layout')
        .where('component.pageId = :pageId', { pageId })
        .andWhere('layout.type IN (:...types)', { types: ['desktop', 'mobile'] })
        .orderBy('component.id', 'ASC')
        .addOrderBy('layout.updatedAt', 'DESC')
        .getMany();

      const result: Record<string, any> = {};
      const layoutsToUpdate: Layout[] = [];

      for (const component of rawComponents) {
        const processedLayoutsForComponent: Layout[] = [];

        (component.layouts || []).forEach((layout) => {
          if (layout && layout.type) {
            const currentLayout = { ...layout };

            if (currentLayout.dimensionUnit === LayoutDimensionUnits.PERCENT) {
              currentLayout.left = this.resolveGridPositionForComponent(currentLayout.left, currentLayout.type);
              currentLayout.dimensionUnit = LayoutDimensionUnits.COUNT;
              layoutsToUpdate.push(currentLayout);
            }
            processedLayoutsForComponent.push(currentLayout);
          }
        });

        const relevantLayouts = processedLayoutsForComponent
          .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
          .slice(0, 2);

        const transformedData = this.createComponentWithLayout(component, relevantLayouts);
        result[component.id] = transformedData[component.id];
      }

      if (layoutsToUpdate.length > 0) {
        await manager.save(Layout, layoutsToUpdate);
      }

      return result;
    }, externalManager);
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

    const layouts: Record<string, { top: number; left: number; width: number; height: number }> = {};

    layoutData.forEach((layout) => {
      if (layout && layout.type) {
        const { type, top, left, width, height } = layout;

        // Note: adjustedLeftValue logic will be handled BEFORE calling this function
        // so 'left' here is already the final desired value for the output.
        layouts[type] = {
          top: top ?? 0,
          left: left ?? 0, // Use the already adjusted 'left' value
          width: width ?? 0,
          height: height ?? 0,
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
      layout?: { diff: Record<string, { layouts: LayoutData; component?: { parent: string } }> };
      events?: CreateEventHandlerDto[];
    },
    appVersionId: string
  ) {
    // TODO: Consider moving batchOperations to a dedicated BatchOperationsService
    // to support batching across all entity types (components, events, queries, etc.)
    // This would make it reusable across the application and keep services focused
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

    // Queue history capture after successful batch operations
    try {
      // For batch operations, let the queue processor resolve names from batchData
      // Extract all component IDs from all operations
      const allComponentIds = [
        ...(batchOperations.create ? Object.keys(batchOperations.create.diff) : []),
        ...(batchOperations.update ? Object.keys(batchOperations.update.diff) : []),
        ...(batchOperations.delete ? batchOperations.delete.diff : []),
        ...(batchOperations.layout ? Object.keys(batchOperations.layout.diff) : []),
      ];

      await this.appHistoryUtilService.queueHistoryCapture(appVersionId, ACTION_TYPE.BATCH_UPDATE, {
        componentIds: allComponentIds,
        changeCount: allComponentIds.length,
        operation: 'batch_operations',
        batchData: batchOperations,
      });
    } catch (error) {
      console.error('Failed to queue history capture for batch operations:', error);
    }

    return result;
  }

  // Common methods used by both the original methods and batch operations
  private async createComponentsAndLayouts(diff: object, pageId: string, appVersionId: string, manager: EntityManager) {
    const page = await manager.findOne(Page, {
      where: { appVersionId, id: pageId },
    });

    const newComponents = this.transformComponentData(diff);
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
          newLayout.component = component;
          newLayout.dimensionUnit = LayoutDimensionUnits.COUNT;

          componentLayouts.push(newLayout);
        }
      }
    });

    await manager.save(Layout, componentLayouts);
  }

  private async updateComponents(diff: object, appVersionId: string, manager: EntityManager) {
    for (const componentId in diff) {
      const { component } = diff[componentId];

      const doesComponentExist = await manager.findAndCount(Component, { where: { id: componentId } });

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

  private async deleteComponents(
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

  private async updateComponentLayouts(
    layoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>,
    manager: EntityManager
  ) {
    for (const componentId in layoutDiff) {
      const doesComponentExist = await manager.findAndCount(Component, { where: { id: componentId } });

      if (doesComponentExist[1] === 0) {
        return {
          error: {
            message: `Component with id ${componentId} does not exist`,
          },
        };
      }

      const { layouts, component } = layoutDiff[componentId];

      for (const type in layouts) {
        const componentLayout = await manager.findOne(Layout, { where: { componentId, type } });

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

}
