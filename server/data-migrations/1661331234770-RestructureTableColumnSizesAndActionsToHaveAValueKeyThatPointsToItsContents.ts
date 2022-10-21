import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class RestructureTableColumnSizesAndActionsToHaveAValueKeyThatPointsToItsContents1661331234770
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);

    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];
          if (component.component.component === 'Table') {
            const columnSizes = { value: component.component.definition.properties.columnSizes };
            components[componentId] = {
              ...component,
              component: {
                ...component.component,
                definition: {
                  ...component.component.definition,
                  properties: {
                    ...component.component.definition.properties,
                    columnSizes,
                  },
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
