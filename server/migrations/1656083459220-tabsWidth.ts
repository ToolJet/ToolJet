import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class tabsWidth1656083459220 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion, {
      select: ['id', 'definition'],
    });

    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];

          if (component.component.component === 'Tabs') {
            component.component.definition.styles.tabWidth = { value: 'auto' };
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

        await entityManager.update(AppVersion, { id: version.id }, { definition });
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
