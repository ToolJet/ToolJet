import { Component } from 'src/entities/component.entity';
import { In, MigrationInterface, QueryRunner } from 'typeorm';

export class MoveVisibilityDisabledStatesToProperties1706080528978 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Array of component types to be enhanced
    const componentTypes = ['TextInput', 'NumberInput', 'PasswordInput', 'Text', 'DropDown'];

    // Obtaining the TypeORM EntityManager from the QueryRunner
    const entityManager = queryRunner.manager;

    // Retrieving components of specified types from the database
    const components = await entityManager.find(Component, {
      where: { type: In(componentTypes) }, // Filtering by component types
      order: { createdAt: 'ASC' }, // Ordering components by creation date in ascending order
    });

    // Iterating through each retrieved component
    for (const component of components) {
      // Extracting properties and styles from the component
      const properties = component.properties;
      const styles = component.styles;
      const general = component.general;

      // Moving 'visibility' from styles to properties
      if (styles.visibility) {
        properties.visibility = styles.visibility;
        delete styles.visibility; // Removing 'visibility' from styles
      }

      // Moving 'disabledState' from styles to properties
      if (styles.disabledState) {
        properties.disabledState = styles.disabledState;
        delete styles.disabledState; // Removing 'disabledState' from styles
      }

      // Moving 'tooltip' from general to properties
      if (general?.tooltip) {
        properties.tooltip = general?.tooltip;
        delete general?.tooltip; // Removing 'tooltip' from general
      }

      // Updating the component in the database with the modified properties and styles
      await entityManager.update(Component, component.id, { properties, styles, general });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
