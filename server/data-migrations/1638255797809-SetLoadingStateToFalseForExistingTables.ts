import { AppVersion } from '@entities/app_version.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetLoadingStateToFalseForExistingTables1638255797809 implements MigrationInterface {
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

          if (component.component.component === 'Table') {
            component.component.definition.properties.loadingState = {
              value: `{{${component.component.definition.properties.loadingState}}}`,
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

        await queryBuilder.update(AppVersion).set({ definition }).where('id = :id', { id: version.id }).execute();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
