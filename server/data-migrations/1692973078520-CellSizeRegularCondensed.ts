import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import { MigrationProgress } from 'src/helpers/utils.helper';

export class CellSizeRegularCondensed1692973078520 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersionsCount = await entityManager.count(AppVersion);
    const perQuery = 100;
    const loopsCount = appVersionsCount / perQuery;

    const migrationProgress = new MigrationProgress('CellSizeRegularCondensed1692973078520', appVersionsCount);

    // Changes for fixing timeout error
    for (let i = 1; i <= loopsCount; i++) {
      const skip = perQuery * i - perQuery;

      const appVersions = await entityManager.find(AppVersion, { take: perQuery, skip });
      for (const version of appVersions) {
        const definition = version?.['definition'];

        if (definition) {
          const pages = definition?.['pages'];
          if (pages) {
            for (const pageId of Object.keys(pages)) {
              const components = pages?.[pageId]?.['components'];

              if (components) {
                for (const componentId of Object.keys(components)) {
                  const component = components[componentId];

                  if (
                    component?.component?.component === 'Table' &&
                    component?.component?.definition?.styles &&
                    component?.component?.styles
                  ) {
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
            }
            definition['pages'] = pages;
            version.definition = definition;
          }

          await entityManager.update(AppVersion, { id: version.id }, { definition });
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
