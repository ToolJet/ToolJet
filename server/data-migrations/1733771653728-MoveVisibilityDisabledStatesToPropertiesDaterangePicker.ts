import { MigrationInterface, QueryRunner } from 'typeorm';
import { ComponentJsonRow, migrateComponentsByType } from '@helpers/component-migration.helper';

export class MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await migrateComponentsByType(queryRunner, {
      migrationName: this.constructor.name,
      componentTypes: ['DaterangePicker'],
      transform: (component) => this.transform(component),
    });
  }

  // Transform logic is unchanged from the original entity-based version; only column names differ.
  private transform(component: ComponentJsonRow) {
    const properties = component.properties;
    const styles = component.styles;
    const general = component.general_properties;
    const generalStyles = component.general_styles;

    if (styles.visibility) {
      properties.visibility = styles.visibility;
      delete styles.visibility;
    }

    if (styles.disabledState) {
      properties.disabledState = styles.disabledState;
      delete styles.disabledState;
    }

    if (generalStyles?.boxShadow) {
      styles.boxShadow = generalStyles?.boxShadow;
      delete generalStyles?.boxShadow;
    }

    if (general?.tooltip) {
      properties.tooltip = general?.tooltip;
      delete general?.tooltip;
    }

    // Label and value
    if (properties.label == undefined || null) {
      properties.label = '';
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
