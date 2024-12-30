import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { Page } from 'src/entities/page.entity';

import { LayoutDimensionUnits } from 'src/helpers/components.helper';
import { processDataInBatches } from 'src/helpers/utils.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateModalHeaderTitle91734422351569 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const componentTypes = ['Modal'];
    const batchSize = 100;
    const entityManager = queryRunner.manager;

    for (const componentType of componentTypes) {
      await processDataInBatches(
        entityManager,
        async (entityManager: EntityManager) => {
          return await entityManager.find(Component, {
            where: { type: componentType },
            order: { createdAt: 'ASC' },
          });
        },
        async (entityManager: EntityManager, components: Component[]) => {
          await this.processUpdates(entityManager, components);
        },
        batchSize
      );
    }
  }

  private async processUpdates(entityManager: EntityManager, components: Component[]) {
    for (const component of components) {
      const properties = component.properties;
      const styles = component.styles;
      const general = component.general;

      const page = await entityManager.findOne(Page, {
        where: { id: component.pageId },
      });

      // Update hideTitleBar property if it exists
      if (properties.hideTitleBar) {
        properties.hideHeader = properties.hideTitleBar;

        delete properties.hideTitleBar;
      }

      // Create a new title component if the title property exists
      //
      if (properties.title || properties.title === undefined) {
        const title = properties.title ? properties.title.value : 'Modal header title';
        const alignment = properties.titleAlignment ? properties.titleAlignment.value : 'left';
        const newTitleComponent = this.createTitleComponent(page, title, component, alignment);
        await entityManager.save(Component, newTitleComponent);

        if (properties.titleAlignment) delete properties.titleAlignment;
        delete properties.title;
        properties.hideFooter = { value: '{{true}}' };
        // Add the new title component to the layout
        const newLayout = this.createTitleComponentLayout(newTitleComponent);
        await entityManager.save(Layout, newLayout);
      }

      // Update the modal component with the modified properties
      await entityManager.update(Component, component.id, {
        properties,
        styles,
        general,
      });
    }
  }

  private createTitleComponent(page: Page, title: string, parent: Component, alignment: string): Component {
    const transformedComponent = new Component();
    transformedComponent.name = `${parent.name}HeaderTitleText`;
    transformedComponent.type = 'Text';
    transformedComponent.parent = `${parent.id}-header`;
    transformedComponent.page = page;
    transformedComponent.properties = {
      text: { value: title },
    };

    transformedComponent.styles = {
      textSize: { value: '{{16}}' },
      fontWeight: { value: 'bold' },
      textAlign: { value: alignment },
    };

    transformedComponent.general = {};
    return transformedComponent;
  }

  private createTitleComponentLayout(component: Component): Layout {
    const layout = new Layout();
    layout.type = 'desktop';
    layout.top = 0;
    layout.left = 0;
    layout.width = 40;
    layout.height = 80; // Default height for the title text
    layout.component = component;
    layout.dimensionUnit = LayoutDimensionUnits.COUNT;
    return layout;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
