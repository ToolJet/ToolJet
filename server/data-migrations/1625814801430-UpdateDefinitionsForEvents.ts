import { AppVersion } from '../src/entities/app_version.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateDefinitionsForEvents1625814801430 implements MigrationInterface {
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
          const events = component.component.definition.events;

          if (events) {
            const newEvents = [];

            for (const eventId of Object.keys(events)) {
              const actionId = events[eventId]['actionId'];

              if (actionId) {
                const newEvent = { ...events[eventId]['options'], actionId, eventId };
                newEvents.push(newEvent);
              } else {
                if (eventId === 'onBulkUpdate' && Object.keys(events[eventId]?.options || {}).length != 0) {
                  const newEvent = { ...events[eventId]['options'], actionId: 'run-query', eventId };
                  newEvents.push(newEvent);
                }
              }
            }

            component.component.definition.events = newEvents;
            components[componentId] = {
              ...component,
              component: {
                ...component.component,
                definition: {
                  ...component.component.definition,
                  events: newEvents,
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
