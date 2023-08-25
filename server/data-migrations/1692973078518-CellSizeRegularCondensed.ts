import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class CellSizeRegularCondensed1692973078518 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();
    const appVersionRepository = entityManager.getRepository(AppVersion);

    const appVersions = await appVersionRepository.find();

    for (const version of appVersions) {
      const definition = version['definition'];

      const pages = definition['pages'];

      if (definition) {
        for (const pageId of Object.keys(pages)) {
          const components = pages[pageId]['components'];
          for (const componentId of Object.keys(components)) {
            const component = components[componentId];
            if (component.component.component === 'Table') {
              component.component.definition.styles.cellSize = {
                value: 'regular',
              };
              component.component.styles.cellSize = {
                ...component.component.styles.cellSize,
                options: [
                  { name: 'Condensed', value: 'condensed' },
                  { name: 'Regular', value: 'regular' },
                ],
              };
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
          }
          pages[pageId]['components'] = components;
        }

        definition['pages'] = pages;

        version.definition = definition;

        await queryBuilder.update(AppVersion).set({ definition }).where('id = :id', { id: version.id }).execute();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
