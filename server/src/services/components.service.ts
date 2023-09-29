import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { Page } from 'src/entities/page.entity';
import { dbTransactionWrap } from 'src/helpers/utils.helper';

import { EventsService } from './events_handler.service';

@Injectable()
export class ComponentsService {
  constructor(
    private eventHandlerService: EventsService,

    @InjectRepository(Component)
    private componentsRepository: Repository<Component>
  ) {}

  async findOne(id: string): Promise<Component> {
    return this.componentsRepository.findOne(id);
  }

  async create(componentDiff: object, pageId: string, appVersionId: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const page = await manager.findOne(Page, {
        where: { appVersionId, id: pageId },
      });

      const newComponents = this.transformComponentData(componentDiff);
      const componentLayouts = [];

      newComponents.forEach((component) => {
        component.page = page;
      });

      const savedComponents = await manager.save(Component, newComponents);

      savedComponents.forEach((component) => {
        const componentLayout = componentDiff[component.id].layouts;

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

      await manager.save(Layout, componentLayouts);

      return {};
    });
  }

  async update(componentDiff: object) {
    return dbTransactionWrap(async (manager) => {
      for (const componentId in componentDiff) {
        const { component } = componentDiff[componentId];

        const componentData = await manager.findOne(Component, componentId);

        if (!componentData) {
          return {
            error: {
              message: `Component with id ${componentId} does not exist`,
            },
          };
        }

        const isComponentDefinitionChanged = component.definition ? true : false;

        if (isComponentDefinitionChanged) {
          const updatedDefinition = component.definition;
          const columnsUpdated = Object.keys(updatedDefinition);

          const newComponentData = columnsUpdated.reduce((acc, column) => {
            const newColumnData = {
              ...componentData[column],
              ...updatedDefinition[column],
            };

            acc[column] = newColumnData;
            return acc;
          }, {});

          await manager.update(Component, componentId, newComponentData);
          return;
        }

        await manager.update(Component, componentId, component);

        return;
      }
    });
  }

  async delete(componentIds: string[]) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const components = await manager.findByIds(Component, componentIds);

      if (!components.length) {
        return {
          error: {
            message: `Components with ids ${componentIds} do not exist`,
          },
        };
      }

      components.forEach((component) => {
        this.eventHandlerService.cascadeDeleteEvents(component.id);
      });

      await manager.delete(Component, componentIds);
    });
  }

  async componentLayoutChange(componenstLayoutDiff: object) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      for (const componentId in componenstLayoutDiff) {
        const { layouts } = componenstLayoutDiff[componentId];

        const componentLayout = await manager.findOne(Layout, { componentId });

        if (!componentLayout) {
          return {
            error: {
              message: `Component with id ${componentId} does not exist`,
            },
          };
        }

        for (const type in layouts) {
          const layout = {
            type,
            ...layouts[type],
          };
          const currentLayout = Object.assign({}, componentLayout);

          const newLayout = {
            ...currentLayout,
            ...layout,
          };

          await manager.update(Layout, { id: componentLayout.id }, newLayout);
        }
      }
    });
  }

  async getAllComponents(pageId: string) {
    // need to get all components for a page with their layouts

    return dbTransactionWrap(async (manager: EntityManager) => {
      return manager
        .createQueryBuilder(Component, 'component')
        .leftJoinAndSelect('component.layouts', 'layout')
        .where('component.pageId = :pageId', { pageId })
        .getMany()
        .then((components) => {
          return components.reduce((acc, component) => {
            const componentId = component.id;
            const componentData = component;
            const componentLayout = component.layouts[0];

            const transformedData = this.createComponentWithLayout(componentData, componentLayout);

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
      transformedComponent.validations = componentData.validation || {};

      transformedComponents.push(transformedComponent);
    }

    return transformedComponents;
  }

  createComponentWithLayout(componentData, layoutData) {
    const { id, name, properties, styles, generalStyles, validations, parent } = componentData;
    const { type, top, left, width, height } = layoutData;

    const componentWithLayout = {
      [id]: {
        component: {
          name,
          component: componentData.type,
          definition: {
            properties,
            styles,
            generalStyles,
            validations,
          },
          parent,
        },
        layouts: {
          [type]: {
            top,
            left,
            width,
            height,
          },
        },
      },
    };

    return componentWithLayout;
  }
}
