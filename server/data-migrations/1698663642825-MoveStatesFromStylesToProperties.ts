import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

//This will need to be updated after App definition changes are merged
export class MoveStatesFromStylesToProperties1698663642825 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion, {
      select: ['id', 'definition'],
    });

    for (const version of appVersions) {
      const definition = version['definition'];
      if (definition) {
        for (const pageId of Object.keys(definition.pages)) {
          let components = { ...definition?.pages[pageId]?.components };

          for (const componentId of Object.keys(components)) {
            const _component = components[componentId];
            if (_component.component.component === 'Text' || _component.component.component === 'TextInput') {
              if (_component?.component?.definition?.styles?.visibility) {
                _component.component.definition.properties.visibility =
                  _component?.component?.definition.styles.visibility;
              }
              if (_component?.component?.definition?.styles?.disabledState) {
                _component.component.definition.properties.disabledState =
                  _component.component?.definition.styles.disabledState;
              }
              if (_component?.component?.definition?.generalStyles?.boxShadow) {
                _component.component.definition.styles.boxShadow =
                  _component.component?.definition?.generalStyles?.boxShadow;
              }
              delete _component.component.definition.styles.visibility;
              delete _component.component.definition.styles.disabledState;
              delete _component?.component?.definition?.generalStyles?.boxShadow;
              components = {
                ...components,
                [componentId]: { ..._component },
              };
            }
          }
          definition.pages[pageId].components = { ...components };
          version.definition = definition;
          await entityManager.update(AppVersion, { id: version.id }, { definition });
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
