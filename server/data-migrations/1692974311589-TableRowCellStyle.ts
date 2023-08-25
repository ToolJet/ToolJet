import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class TableRowCellStyle1692974311589 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const queryBuilder = queryRunner.connection.createQueryBuilder();
    const appVersionRepository = entityManager.getRepository(AppVersion);

    const appVersions = await appVersionRepository.find();

    for (const version of appVersions) {
      const definition = version['definition'];

      const pages = definition['pages'];

      if (definition) {
        for (const pageId of Object.keys(pages)) {
          const components = pages[pageId]['components'];
          for (const componentId of Object.keys(components)) {
            const component = components[componentId];
            if (component.component.component === 'Table') {
              component.component.definition.styles.tableType = {
                value: 'table-classic',
              };
              component.component.styles.tableType = {
                ...component.component.styles.tableType,
                options: [
                  { name: 'Bordered', value: 'table-bordered' },
                  { name: 'Regular', value: 'table-classic' },
                  { name: 'Striped', value: 'table-striped' },
                ],
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
          pages[pageId]['components'] = components;
        }

        definition['pages'] = pages;

        version.definition = definition;

        await queryBuilder.update(AppVersion).set({ definition }).where('id = :id', { id: version.id }).execute();
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
