import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class ListviewDefaultMode1688977149516 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);
    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const pages = definition['pages'];
        if (pages) {
          for (const pageId of Object.keys(pages)) {
            const components = definition['pages'][pageId]['components'];
            if (components) {
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
            }

            definition['components'] = components;
            version.definition = definition;
          }
        }
        await entityManager.update(AppVersion, { id: version.id }, { definition });
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
