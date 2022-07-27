import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import { isEmpty } from 'lodash';

export class UpdateDefinitionsForGlobalSettings1639038616546 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();
    const appVersionRepository = entityManager.getRepository(AppVersion);

    const appVersions = await appVersionRepository.find();

    for (const version of appVersions) {
      const definition = version['definition'];

      if (!isEmpty(definition) && !definition.globalSettings) {
        definition['globalSettings'] = {
          hideHeader: false,
          canvasMaxWidth: 1292,
          canvasBackgroundColor: '#edeff5',
        };
        version.definition = definition;

        await queryBuilder.update(AppVersion).set({ definition }).where('id = :id', { id: version.id }).execute();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
