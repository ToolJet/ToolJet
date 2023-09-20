import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';
import { MigrationProgress } from 'src/helpers/utils.helper';

export class TableRowCellStyle1692974311591 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersionsCount = await entityManager.count(AppVersion);
    const perQuery = 100;
    const loopsCount = appVersionsCount / perQuery;

    const migrationProgress = new MigrationProgress('TableRowCellStyle1692974311591', appVersionsCount);

    // Changes for fixing timeout error
    for (let i = 1; i <= loopsCount; i++) {
      const skip = perQuery * i - perQuery;

      const appVersions = await entityManager.find(AppVersion, { take: perQuery, skip });
      for (const version of appVersions) {
        const definition = version['definition'];

        if (definition) {
          const pages = definition['pages'];
          if (pages) {
            for (const pageId of Object.keys(pages)) {
              const components = pages[pageId]['components'];
              if (components) {
                for (const componentId of Object.keys(components)) {
                  const component = components[componentId];
                  if (
                    component?.component?.component === 'Table' &&
                    component?.component?.definition?.styles &&
                    component?.component?.styles
                  ) {
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
            }
            definition['pages'] = pages;
            version.definition = definition;
          }

          await entityManager.update(AppVersion, { id: version.id }, { definition });
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
