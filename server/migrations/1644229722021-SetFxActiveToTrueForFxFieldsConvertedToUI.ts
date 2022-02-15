import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class SetFxActiveToTrueForFxFieldsConvertedToUI1644229722021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();
    const appVersionRepository = entityManager.getRepository(AppVersion);
    const propertiesBeingSetToFxActive = ['loadingState'];
    const stylesBeingSetToFxActive = ['visibility', 'disabledState'];

    const appVersions = await appVersionRepository.find();

    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];

          const newProperties = Object.fromEntries(
            Object.entries(component.component.definition.properties).map(([propertyName, value]: any) => {
              const newValue = propertiesBeingSetToFxActive.includes(propertyName)
                ? { ...value, fxActive: true }
                : value;
              return [propertyName, newValue];
            })
          );

          const newStyles = Object.fromEntries(
            Object.entries(component.component.definition.styles).map(([styleName, value]: any) => {
              const newValue = stylesBeingSetToFxActive.includes(styleName) ? { ...value, fxActive: true } : value;
              return [styleName, newValue];
            })
          );

          component.component.definition.properties = newProperties;
          component.component.definition.styles = newStyles;

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
