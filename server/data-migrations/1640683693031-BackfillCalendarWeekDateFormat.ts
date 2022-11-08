import { AppVersion } from '../src/entities/app_version.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillCalendarWeekDateFormat1640683693031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();
    const appVersionRepository = entityManager.getRepository(AppVersion);

    const appVersions = await appVersionRepository.find();

    for (const version of appVersions) {
      const definition = version['definition'];
      let definitionUpdated = false;

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const componentDefinition = components[componentId];
          if (componentDefinition.component.component !== 'Calendar') continue;

          componentDefinition.component.definition.styles.weekDateFormat =
            this.determineDateFormatForBackfill(componentDefinition);

          components[componentId] = componentDefinition;
          definitionUpdated = true;
        }

        if (!definitionUpdated) continue;

        definition['components'] = components;
        version.definition = definition;

        await queryBuilder.update(AppVersion).set({ definition }).where('id = :id', { id: version.id }).execute();
      }
    }
  }

  determineDateFormatForBackfill(componentDefinition) {
    const dateFormat = componentDefinition.component.definition.styles.displayDayNamesInWeekView?.value
      ? 'ddd'
      : 'DD MMM';

    return { value: dateFormat };
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
