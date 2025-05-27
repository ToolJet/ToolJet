import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { Page } from 'src/entities/page.entity';
import { dbTransactionForAppVersionAssociationsUpdate, dbTransactionWrap } from 'src/helpers/database.helper';
import { EventsService } from './event.service';
import { LayoutData } from '../dto/component';
import { LayoutDimensionUnits } from '../constants';
import { IComponentsService } from '../interfaces/services/IComponentService';
const _ = require('lodash');

@Injectable()
export class ComponentsService implements IComponentsService {
  constructor(protected eventHandlerService: EventsService) {}

  findOne(id: string): Promise<Component> {
    return dbTransactionWrap((manager: EntityManager) => {
      return manager.findOne(Component, { where: { id } });
    });
  }

  async create(componentDiff: object, pageId: string, appVersionId: string) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      await this.createComponentsAndLayouts(componentDiff, pageId, appVersionId, manager);
      return {};
    }, appVersionId);
  }

  async update(componentDiff: object, appVersionId: string) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const result = await this.updateComponents(componentDiff, appVersionId, manager);
      if (result?.error) {
        return result;
      }
    }, appVersionId);
  }

  async delete(componentIds: string[], appVersionId: string, isComponentCut = false) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const result = await this.deleteComponents(componentIds, appVersionId, isComponentCut, manager);
      if (result?.error) {
        return result;
      }
    }, appVersionId);
  }

  async componentLayoutChange(
    componenstLayoutDiff: Record<string, { layouts: LayoutData; component?: { parent: string } }>,
    appVersionId: string
  ) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
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
  }

  async getAllComponents(pageId: string) {
    // need to get all components for a page with their layouts

    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager
        .createQueryBuilder(Component, 'component')
        .leftJoinAndSelect('component.layouts', 'layout')
        .where('component.pageId = :pageId', { pageId })
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('layout.id')
            .from('layouts', 'layout')
            .where('layout.componentId = component.id')
            .andWhere('layout.type IN (:...types)', { types: ['desktop', 'mobile'] })
            .orderBy('layout.updatedAt', 'DESC')
            .limit(2)
            .getQuery();
          return `layout.id IN ${subQuery}`;
        })
        .getMany()
        .then((components) => {
          return components.reduce((acc, component) => {
            const componentId = component.id;
            const componentData = component;
            const componentLayout = component.layouts;

            const transformedData = this.createComponentWithLayout(componentData, componentLayout, manager);

            acc[componentId] = transformedData[componentId];

            return acc;
          }, {});
        });
    });
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

  createComponentWithLayout(componentData: Component, layoutData = [], manager: EntityManager) {
    const { id, name, properties, styles, generalStyles, validation, parent, displayPreferences, general } =
      componentData;

    const layouts = {};

    layoutData.forEach((layout) => {
      const { type, top, left, width, height, dimensionUnit, id } = layout;

      let adjustedLeftValue = left;
      if (dimensionUnit === LayoutDimensionUnits.PERCENT) {
        adjustedLeftValue = this.resolveGridPositionForComponent(left, type);
        manager.update(
          Layout,
          {
            id,
          },
          {
            dimensionUnit: LayoutDimensionUnits.COUNT,
            left: adjustedLeftValue,
          }
        );
      }

      layouts[type] = {
        top,
        left: adjustedLeftValue,
        width,
        height,
      };
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
    },
    appVersionId: string
  ) {
    return dbTransactionForAppVersionAssociationsUpdate(async (manager: EntityManager) => {
      const results: { created?: number; updated?: number; deleted?: number } = {};

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

      return results;
    }, appVersionId);
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
              } else if (
                (componentData.type === 'DropdownV2' ||
                  componentData.type === 'MultiselectV2' ||
                  componentData.type === 'Steps') &&
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
}
