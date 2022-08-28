import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class addingCssPropsToTextWidget1656924847186 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);

    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];
          if (component.component.component === 'Text') {
            const stylesProps = {
              fontWeight: 'normal',
              decoration: 'none',
              transformation: 'none',
              fontStyle: 'normal',
              lineHeight: 1.5,
              textIndent: 0,
              letterSpacing: 0,
              wordSpacing: 0,
              fontVariant: 'normal',
            };
            for (const style in stylesProps) {
              component.component.definition.styles[style] = {
                value: stylesProps[style],
              };
            }
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
