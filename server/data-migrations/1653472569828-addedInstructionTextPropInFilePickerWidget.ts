import { MigrationInterface, QueryRunner } from 'typeorm';
import { AppVersion } from '../src/entities/app_version.entity';

export class addedInstructionTextPropInFilePickerWidget1653472569828 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const appVersions = await entityManager.find(AppVersion);

    for (const version of appVersions) {
      const definition = version['definition'];

      if (definition) {
        const components = definition['components'];

        for (const componentId of Object.keys(components)) {
          const component = components[componentId];
          if (component.component.component === 'FilePicker') {
            component.component.definition.properties.instructionText = {
              value: 'Drag and drop files here or click to select files',
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

        await entityManager.update(AppVersion, { id: version.id }, { definition });
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
