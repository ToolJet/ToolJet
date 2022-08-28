import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class ReplaceKeyNamesForValuesThatNeedNotBeResolved1661683231420 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);

    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];
          const events = component.component.definition.events ?? [];
          for (const event of events) {
            if (event.type === 'show-message') {
              event.message = event.__TjDoNotResolve__message;
            }
          }
          components[componentId] = {
            ...component,
            component: {
              ...component.component,
              definition: {
                ...component.component.definition,
                events,
              },
            },
          };
        }

        definition['components'] = components;
        version.definition = definition;

        await entityManager.update(AppVersion, { id: version.id }, { definition });
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
