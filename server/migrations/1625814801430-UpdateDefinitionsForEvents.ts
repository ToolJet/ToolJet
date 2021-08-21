import { AppVersion } from "../src/entities/app_version.entity";
import { MigrationInterface, QueryRunner, getManager } from "typeorm";

export class UpdateDefinitionsForEvents1625814801430 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = getManager();
    const appVersionRepository = entityManager.getRepository(AppVersion);

    const appVersions = await appVersionRepository.find();

    for(const version of appVersions) {

      const definition = version['definition'];

      if(definition) {
        const components = definition['components']

        for(const componentId of Object.keys(components)) { 
          const component = components[componentId];

          const events = component.component.definition.events;

          if(events) {
            const newEvents = [];

            for(const eventId of Object.keys(events)) {
              const actionId = events[eventId]['actionId'];

              if(actionId) {
                const newEvent = { ...events[eventId]['options'], actionId, eventId };
                newEvents.push(newEvent);
              }
            }

            component.component.definition.events = newEvents;
            components[componentId] = component;
          }
        }

        definition['components'] = components;

        await appVersionRepository.update(version.id, { definition: definition });

      }
    }

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
