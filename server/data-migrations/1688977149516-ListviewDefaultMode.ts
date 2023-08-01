import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import { MigrationProgress } from 'src/helpers/utils.helper';

export class ListviewDefaultMode1688977149516 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersionsCount = await entityManager.count(AppVersion);
    const perQuery = 1000;
    const loopsCount = appVersionsCount / perQuery;

    const migrationProgress = new MigrationProgress('ListviewDefaultMode1688977149516', appVersionsCount);

    // Changes for fixing timeout error
    for (let i = 1; i <= loopsCount; i++) {
      const skip = perQuery * i - perQuery;

      const appVersions = await entityManager.find(AppVersion, { take: perQuery, skip });
      for (const version of appVersions) {
        const definition = version['definition'];

        if (definition) {
          const pages = definition['pages'];
          for (const pageId of Object.keys(pages)) {
            const components = definition['pages'][pageId]['components'];

            for (const componentId of Object.keys(components)) {
              const component = components[componentId];

              if (component?.component?.component === 'Listview') {
                component['component']['definition']['properties']['mode'] = {
                  value: 'list',
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
            definition['components'] = components;
            version.definition = definition;
          }
          await entityManager.update(AppVersion, { id: version.id }, { definition });
        }
        migrationProgress.show();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
