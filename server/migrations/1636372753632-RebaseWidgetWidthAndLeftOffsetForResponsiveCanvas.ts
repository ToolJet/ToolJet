import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class RebaseWidgetWidthAndLeftOffsetForResponsiveCanvas1636372753632 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();
    const appVersionRepository = entityManager.getRepository(AppVersion);

    const appVersions = await appVersionRepository.find();

    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];
          console.log('component', component);
          const layouts = component.layouts;

          if (!component.parent) continue;

          for (const layoutIndex in layouts) {
            const layout = layouts[layoutIndex];

            let containerWidth = 1292;
            console.log('layout index', layoutIndex);
            if (component.parent) {
              const parentComponent: any = Object.entries(components).filter(
                (entry) => entry[0] === component.parent
              )[0][1];
              console.log('parent component', parentComponent);
              const parentLayoutCandidateEntries: any = Object.entries(parentComponent.layouts).filter(
                (entry) => entry[0] === layoutIndex
              );
              console.log('parentLayoutCandidateEntries', parentLayoutCandidateEntries);
              if (parentLayoutCandidateEntries.length > 0) {
                containerWidth = parentLayoutCandidateEntries[0][1].width;

                if (parentComponent.component.component === 'Modal') {
                  console.log('modal properties', parentComponent.component.definition.properties.size);
                  switch (parentComponent.component.definition.properties.size.value) {
                    case 'lg':
                      containerWidth = 718;
                      break;
                    case 'md':
                      containerWidth = 538;
                      break;
                    case 'sm':
                      containerWidth = 378;
                      break;
                  }
                }
                console.log('yepski', containerWidth);
              }
            }

            const width = layout.width;
            const newWidth = (width * 43) / containerWidth;
            component.layouts[layoutIndex].width = newWidth;

            const left = layout.left;
            const newLeft = (left * 100) / containerWidth;
            component.layouts[layoutIndex].left = newLeft;
          }

          console.log('component', component);
          components[componentId] = {
            ...component,
            component: {
              ...component.component,
              definition: {
                ...component.component.definition,
              },
            },
          };
        }

        definition['components'] = components;
        version.definition = definition;

        await queryBuilder.update(AppVersion).set({ definition }).where('id = :id', { id: version.id }).execute();

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];
          const layouts = component.layouts;

          if (component.parent != undefined) continue;

          for (const layoutIndex in layouts) {
            const layout = layouts[layoutIndex];
            const width = layout.width;
            const newWidth = (width * 43) / 1292;
            component.layouts[layoutIndex].width = newWidth;

            const left = layout.left;
            const newLeft = (left * 100) / 1292;
            component.layouts[layoutIndex].left = newLeft;
          }

          console.log('component', component);
          components[componentId] = {
            ...component,
            component: {
              ...component.component,
              definition: {
                ...component.component.definition,
              },
            },
          };
        }

        definition['components'] = components;
        version.definition = definition;

        await queryBuilder.update(AppVersion).set({ definition }).where('id = :id', { id: version.id }).execute();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
