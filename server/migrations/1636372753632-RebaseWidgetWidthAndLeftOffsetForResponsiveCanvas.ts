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
          const layouts = component.layouts;

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
