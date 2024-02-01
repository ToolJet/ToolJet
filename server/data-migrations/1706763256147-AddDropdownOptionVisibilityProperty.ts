import { Component } from 'src/entities/component.entity';
import { In, MigrationInterface, QueryRunner } from 'typeorm';

export class AddDropdownOptionVisibilityProperty1706763256147 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Array of component types to be enhanced
    const componentTypes = ['DropDown'];

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

      // Moving 'visibility' from styles to properties
      const optionsLength =
        //   if (styles.visibility) {
        //     properties.visibility = styles.visibility;
        //     delete styles.visibility; // Removing 'visibility' from styles
        //   }

        // Updating the component in the database with the modified properties and styles
        await entityManager.update(Component, component.id, { properties });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
