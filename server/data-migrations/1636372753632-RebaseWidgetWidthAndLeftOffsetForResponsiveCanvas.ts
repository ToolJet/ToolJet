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
        const changesRequired: {
          component: any;
          componentId: string;
          layout: string;
          newWidth: number;
          newLeft: number;
        }[] = [];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];
          const layouts = component.layouts;

          for (const layoutIndex in layouts) {
            const layout = layouts[layoutIndex];

            let containerWidth = 1292;
            if (layoutIndex === 'mobile') containerWidth = 450;
            if (component.parent) {
              console.log('component is', component);
              const parentComponentCandidates: any = Object.entries(components).filter(
                (entry) => entry[0] === component.parent
              );

              if (parentComponentCandidates.length > 0) {
                const parentComponent = parentComponentCandidates[0][1];
                const parentLayoutCandidateEntries: any = Object.entries(parentComponent.layouts).filter(
                  (entry) => entry[0] === layoutIndex
                );

                if (parentLayoutCandidateEntries.length > 0) {
                  containerWidth = parentLayoutCandidateEntries[0][1].width;

                  if (parentComponent.component.component === 'Modal') {
                    switch (parentComponent.component.definition.properties?.size?.value ?? 'lg') {
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
                }
              }
            }

            const width = layout.width;
            const newWidth = (width * 43) / containerWidth;
            // component.layouts[layoutIndex].width = newWidth;

            const left = layout.left;
            const newLeft = (left * 100) / containerWidth;
            // component.layouts[layoutIndex].left = newLeft;

            changesRequired.push({ component, componentId, layout: layoutIndex, newWidth, newLeft });
          }
        }

        for (const change of changesRequired) {
          change.component.layouts[change.layout].left = change.newLeft;
          change.component.layouts[change.layout].width = change.newWidth;

          components[change.componentId] = {
            ...change.component,
            component: {
              ...change.component.component,
            },
            layouts: {
              ...change.component.layouts,
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
